"""
WealthOS — CRUD helpers
High-level functions used by Streamlit pages and FastAPI routes.
All sync versions use get_sync_db(); async versions use get_db().
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

import pandas as pd
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from database.db import get_sync_db
from database.models import (
    Asset, Holding, ImportLog, Portfolio, PortfolioSnapshot,
    PriceHistory, TargetAllocation, Transaction, User, Watchlist,
    AIConversation, AIMessage, NewsCache,
)


# ══════════════════════════════════════════════════════════════
# USERS
# ══════════════════════════════════════════════════════════════

def get_or_create_user(email: str, display_name: str = "") -> User:
    with get_sync_db() as db:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            user = User(email=email, display_name=display_name)
            db.add(user)
            db.flush()
            # create default portfolio
            portfolio = Portfolio(user_id=user.id, name="Main Portfolio", is_default=True)
            db.add(portfolio)
        return user


# ══════════════════════════════════════════════════════════════
# PORTFOLIOS
# ══════════════════════════════════════════════════════════════

def list_portfolios(user_id: uuid.UUID) -> List[Portfolio]:
    with get_sync_db() as db:
        return db.query(Portfolio).filter(Portfolio.user_id == user_id).order_by(Portfolio.created_at).all()


def get_default_portfolio(user_id: uuid.UUID) -> Optional[Portfolio]:
    with get_sync_db() as db:
        return db.query(Portfolio).filter(
            Portfolio.user_id == user_id,
            Portfolio.is_default == True,
        ).first()


# ══════════════════════════════════════════════════════════════
# ASSETS
# ══════════════════════════════════════════════════════════════

def get_asset_by_ticker(ticker: str, exchange: str = "NSE") -> Optional[Asset]:
    with get_sync_db() as db:
        return db.query(Asset).filter(
            Asset.ticker == ticker.upper(),
            Asset.exchange == exchange.upper(),
        ).first()


def get_or_create_asset(ticker: str, exchange: str, name: str, asset_class: str,
                         yf_ticker: str = None, sector: str = None,
                         country: str = "IN", currency: str = "INR") -> Asset:
    with get_sync_db() as db:
        asset = db.query(Asset).filter(
            Asset.ticker == ticker.upper(),
            Asset.exchange == exchange.upper(),
        ).first()
        if not asset:
            asset = Asset(
                ticker=ticker.upper(), exchange=exchange.upper(),
                yf_ticker=yf_ticker, name=name, asset_class=asset_class,
                sector=sector, country=country, currency=currency,
            )
            db.add(asset)
            db.flush()
        return asset


def list_assets(asset_class: str = None) -> List[Asset]:
    with get_sync_db() as db:
        q = db.query(Asset)
        if asset_class:
            q = q.filter(Asset.asset_class == asset_class)
        return q.order_by(Asset.ticker).all()


# ══════════════════════════════════════════════════════════════
# TRANSACTIONS
# ══════════════════════════════════════════════════════════════

def add_transaction(
    portfolio_id: uuid.UUID,
    asset_id: uuid.UUID,
    txn_type: str,
    txn_date: date,
    quantity: Decimal,
    price: Decimal,
    fees: Decimal = Decimal("0"),
    taxes: Decimal = Decimal("0"),
    notes: str = None,
    source: str = "MANUAL",
    broker: str = None,
    external_ref: str = None,
) -> Transaction:
    with get_sync_db() as db:
        amount = quantity * price
        txn = Transaction(
            portfolio_id=portfolio_id, asset_id=asset_id,
            txn_type=txn_type.upper(), txn_date=txn_date,
            quantity=quantity, price=price, amount=amount,
            fees=fees, taxes=taxes, notes=notes,
            source=source, broker=broker, external_ref=external_ref,
        )
        db.add(txn)
        db.flush()
        _update_holding_from_transaction(db, txn)
        return txn


def _update_holding_from_transaction(db: Session, txn: Transaction) -> None:
    """Recompute holding avg cost and quantity after a transaction."""
    holding = db.query(Holding).filter(
        Holding.portfolio_id == txn.portfolio_id,
        Holding.asset_id == txn.asset_id,
    ).first()

    if not holding:
        holding = Holding(portfolio_id=txn.portfolio_id, asset_id=txn.asset_id)
        db.add(holding)

    if txn.txn_type in ("BUY", "SIP"):
        new_invested = holding.invested_amount + txn.amount
        new_qty = holding.quantity + txn.quantity
        holding.avg_cost_price = new_invested / new_qty if new_qty else Decimal("0")
        holding.quantity = new_qty
        holding.invested_amount = new_invested
    elif txn.txn_type in ("SELL", "REDEMPTION"):
        holding.quantity = max(Decimal("0"), holding.quantity - txn.quantity)
        sold_value = txn.quantity * holding.avg_cost_price
        holding.invested_amount = max(Decimal("0"), holding.invested_amount - sold_value)


def get_transactions(portfolio_id: uuid.UUID, asset_id: uuid.UUID = None) -> List[Transaction]:
    with get_sync_db() as db:
        q = db.query(Transaction).filter(Transaction.portfolio_id == portfolio_id)
        if asset_id:
            q = q.filter(Transaction.asset_id == asset_id)
        return q.order_by(desc(Transaction.txn_date)).all()


def transactions_to_df(portfolio_id: uuid.UUID) -> pd.DataFrame:
    """Return transactions as a DataFrame for use in portfolio_engine."""
    txns = get_transactions(portfolio_id)
    if not txns:
        return pd.DataFrame()
    rows = []
    for t in txns:
        rows.append({
            "date": t.txn_date,
            "ticker": t.asset.ticker if t.asset else "",
            "type": t.txn_type,
            "quantity": float(t.quantity),
            "price": float(t.price),
            "amount": float(t.amount),
            "fees": float(t.fees),
        })
    return pd.DataFrame(rows)


# ══════════════════════════════════════════════════════════════
# HOLDINGS
# ══════════════════════════════════════════════════════════════

def get_holdings(portfolio_id: uuid.UUID) -> List[Holding]:
    with get_sync_db() as db:
        return (
            db.query(Holding)
            .filter(Holding.portfolio_id == portfolio_id, Holding.quantity > 0)
            .all()
        )


def update_holding_price(portfolio_id: uuid.UUID, asset_id: uuid.UUID,
                          current_price: Decimal) -> None:
    """Update live price fields on a holding (called by price_fetcher)."""
    with get_sync_db() as db:
        holding = db.query(Holding).filter(
            Holding.portfolio_id == portfolio_id,
            Holding.asset_id == asset_id,
        ).first()
        if holding:
            holding.current_price = current_price
            holding.current_value = holding.quantity * current_price
            holding.unrealised_pnl = holding.current_value - holding.invested_amount
            holding.unrealised_pnl_pct = (
                (holding.unrealised_pnl / holding.invested_amount * 100)
                if holding.invested_amount else Decimal("0")
            )
            holding.last_price_at = datetime.utcnow()


def holdings_to_df(portfolio_id: uuid.UUID) -> pd.DataFrame:
    """Return holdings as a DataFrame for Streamlit display."""
    holdings = get_holdings(portfolio_id)
    if not holdings:
        return pd.DataFrame()
    rows = []
    for h in holdings:
        rows.append({
            "ticker": h.asset.ticker if h.asset else "",
            "name": h.asset.name if h.asset else "",
            "asset_class": h.asset.asset_class if h.asset else "",
            "quantity": float(h.quantity),
            "avg_cost": float(h.avg_cost_price),
            "invested": float(h.invested_amount),
            "current_price": float(h.current_price) if h.current_price else None,
            "current_value": float(h.current_value) if h.current_value else None,
            "pnl": float(h.unrealised_pnl) if h.unrealised_pnl else None,
            "pnl_pct": float(h.unrealised_pnl_pct) if h.unrealised_pnl_pct else None,
        })
    return pd.DataFrame(rows)


# ══════════════════════════════════════════════════════════════
# PRICE HISTORY
# ══════════════════════════════════════════════════════════════

def bulk_insert_prices(records: list[dict]) -> int:
    """Insert OHLCV records, ignoring duplicates. Returns count inserted."""
    with get_sync_db() as db:
        inserted = 0
        for r in records:
            existing = db.query(PriceHistory).filter(
                PriceHistory.asset_id == r["asset_id"],
                PriceHistory.price_date == r["price_date"],
            ).first()
            if not existing:
                db.add(PriceHistory(**r))
                inserted += 1
        return inserted


def get_price_history(asset_id: uuid.UUID, start: date, end: date) -> pd.DataFrame:
    with get_sync_db() as db:
        rows = (
            db.query(PriceHistory)
            .filter(
                PriceHistory.asset_id == asset_id,
                PriceHistory.price_date >= start,
                PriceHistory.price_date <= end,
            )
            .order_by(PriceHistory.price_date)
            .all()
        )
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame([{
            "date": r.price_date, "open": float(r.open or 0),
            "high": float(r.high or 0), "low": float(r.low or 0),
            "close": float(r.close), "volume": r.volume,
        } for r in rows])


# ══════════════════════════════════════════════════════════════
# PORTFOLIO SNAPSHOTS
# ══════════════════════════════════════════════════════════════

def save_snapshot(portfolio_id: uuid.UUID, snapshot_date: date,
                  total_value: Decimal, invested_amount: Decimal,
                  day_change: Decimal = None) -> None:
    with get_sync_db() as db:
        existing = db.query(PortfolioSnapshot).filter(
            PortfolioSnapshot.portfolio_id == portfolio_id,
            PortfolioSnapshot.snapshot_date == snapshot_date,
        ).first()
        pnl = total_value - invested_amount
        pnl_pct = (pnl / invested_amount * 100) if invested_amount else Decimal("0")
        if existing:
            existing.total_value = total_value
            existing.invested_amount = invested_amount
            existing.total_pnl = pnl
            existing.total_pnl_pct = pnl_pct
            existing.day_change = day_change
        else:
            db.add(PortfolioSnapshot(
                portfolio_id=portfolio_id, snapshot_date=snapshot_date,
                total_value=total_value, invested_amount=invested_amount,
                total_pnl=pnl, total_pnl_pct=pnl_pct, day_change=day_change,
            ))


def get_snapshot_history(portfolio_id: uuid.UUID, days: int = 365) -> pd.DataFrame:
    with get_sync_db() as db:
        rows = (
            db.query(PortfolioSnapshot)
            .filter(PortfolioSnapshot.portfolio_id == portfolio_id)
            .order_by(PortfolioSnapshot.snapshot_date)
            .limit(days)
            .all()
        )
        if not rows:
            return pd.DataFrame()
        return pd.DataFrame([{
            "date": r.snapshot_date,
            "total_value": float(r.total_value),
            "invested": float(r.invested_amount),
            "pnl": float(r.total_pnl or 0),
            "pnl_pct": float(r.total_pnl_pct or 0),
            "day_change": float(r.day_change or 0),
        } for r in rows])


# ══════════════════════════════════════════════════════════════
# AI CONVERSATIONS
# ══════════════════════════════════════════════════════════════

def create_conversation(user_id: uuid.UUID, portfolio_id: uuid.UUID = None,
                         model: str = "gemini-1.5-pro") -> AIConversation:
    with get_sync_db() as db:
        conv = AIConversation(user_id=user_id, portfolio_id=portfolio_id, model_used=model)
        db.add(conv)
        db.flush()
        return conv


def add_message(conversation_id: uuid.UUID, role: str, content: str,
                tokens: int = None, latency_ms: int = None) -> AIMessage:
    with get_sync_db() as db:
        msg = AIMessage(
            conversation_id=conversation_id, role=role, content=content,
            tokens_used=tokens, latency_ms=latency_ms,
        )
        db.add(msg)
        # update conversation title from first user message
        if role == "user":
            conv = db.get(AIConversation, conversation_id)
            if conv and not conv.title:
                conv.title = content[:80]
        return msg


def get_conversation_history(conversation_id: uuid.UUID) -> List[dict]:
    """Return messages as list of {role, content} dicts for LLM context."""
    with get_sync_db() as db:
        msgs = db.query(AIMessage).filter(
            AIMessage.conversation_id == conversation_id
        ).order_by(AIMessage.created_at).all()
        return [{"role": m.role, "content": m.content} for m in msgs]


# ══════════════════════════════════════════════════════════════
# NEWS CACHE
# ══════════════════════════════════════════════════════════════

def cache_articles(articles: list[dict]) -> int:
    """Store news articles, skip duplicates. Returns inserted count."""
    with get_sync_db() as db:
        inserted = 0
        for a in articles:
            if not db.query(NewsCache).filter(NewsCache.url == a.get("url")).first():
                db.add(NewsCache(**a))
                inserted += 1
        return inserted


def get_latest_news(limit: int = 50, ticker: str = None) -> List[NewsCache]:
    with get_sync_db() as db:
        q = db.query(NewsCache).order_by(desc(NewsCache.published_at))
        if ticker:
            q = q.filter(NewsCache.related_tickers.any(ticker.upper()))
        return q.limit(limit).all()


# ══════════════════════════════════════════════════════════════
# IMPORT LOGS
# ══════════════════════════════════════════════════════════════

def log_import(portfolio_id: uuid.UUID, filename: str, file_size: int = None) -> ImportLog:
    with get_sync_db() as db:
        log = ImportLog(portfolio_id=portfolio_id, filename=filename,
                        file_size_bytes=file_size, status="PENDING")
        db.add(log)
        db.flush()
        return log


def update_import_log(log_id: uuid.UUID, status: str, rows_total: int = None,
                       rows_imported: int = None, rows_failed: int = None,
                       error_log: list = None) -> None:
    with get_sync_db() as db:
        log = db.get(ImportLog, log_id)
        if log:
            log.status = status
            if rows_total is not None: log.rows_total = rows_total
            if rows_imported is not None: log.rows_imported = rows_imported
            if rows_failed is not None: log.rows_failed = rows_failed
            if error_log is not None: log.error_log = error_log
