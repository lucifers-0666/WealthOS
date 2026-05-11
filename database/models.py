"""
WealthOS — SQLAlchemy ORM Models
Maps every PostgreSQL table to a Python class.
Compatible with SQLAlchemy 2.x (async-ready).
"""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    BigInteger, Boolean, CheckConstraint, Column, Date,
    DateTime, ForeignKey, Integer, Numeric, String, Text,
    UniqueConstraint, func, text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


# ── helpers ──────────────────────────────────────────────────────────────────

def _uuid() -> uuid.UUID:
    return uuid.uuid4()


# ── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    display_name: Mapped[Optional[str]] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    timezone: Mapped[str] = mapped_column(Text, nullable=False, default="Asia/Kolkata")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # relationships
    portfolios: Mapped[List["Portfolio"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    watchlist: Mapped[List["Watchlist"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    conversations: Mapped[List["AIConversation"]] = relationship(back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<User {self.email}>"


# ── Portfolios ────────────────────────────────────────────────────────────────

class Portfolio(Base):
    __tablename__ = "portfolios"
    __table_args__ = (UniqueConstraint("user_id", "name"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="portfolios")
    holdings: Mapped[List["Holding"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")
    target_allocations: Mapped[List["TargetAllocation"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")
    snapshots: Mapped[List["PortfolioSnapshot"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")
    import_logs: Mapped[List["ImportLog"]] = relationship(back_populates="portfolio", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Portfolio {self.name}>"


# ── Assets ───────────────────────────────────────────────────────────────────

class Asset(Base):
    __tablename__ = "assets"
    __table_args__ = (
        UniqueConstraint("ticker", "exchange"),
        CheckConstraint("asset_class IN ('EQUITY','ETF','MUTUAL_FUND','BOND','GOLD','CRYPTO','CASH')"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    ticker: Mapped[str] = mapped_column(Text, nullable=False)
    exchange: Mapped[str] = mapped_column(Text, nullable=False)
    yf_ticker: Mapped[Optional[str]] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    asset_class: Mapped[str] = mapped_column(Text, nullable=False)
    sector: Mapped[Optional[str]] = mapped_column(Text)
    country: Mapped[Optional[str]] = mapped_column(String(2))
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    isin: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    holdings: Mapped[List["Holding"]] = relationship(back_populates="asset")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="asset")
    price_history: Mapped[List["PriceHistory"]] = relationship(back_populates="asset", cascade="all, delete-orphan")
    watchlist: Mapped[List["Watchlist"]] = relationship(back_populates="asset")

    def __repr__(self) -> str:
        return f"<Asset {self.ticker}@{self.exchange}>"


# ── Holdings ─────────────────────────────────────────────────────────────────

class Holding(Base):
    __tablename__ = "holdings"
    __table_args__ = (UniqueConstraint("portfolio_id", "asset_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    asset_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assets.id"), nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False, default=0)
    avg_cost_price: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False, default=0)
    invested_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    current_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    current_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    unrealised_pnl: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    unrealised_pnl_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 4))
    last_price_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    portfolio: Mapped["Portfolio"] = relationship(back_populates="holdings")
    asset: Mapped["Asset"] = relationship(back_populates="holdings")

    def __repr__(self) -> str:
        return f"<Holding {self.asset_id} x{self.quantity}>"


# ── Transactions ─────────────────────────────────────────────────────────────

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (
        CheckConstraint("txn_type IN ('BUY','SELL','DIVIDEND','SPLIT','BONUS','SIP','REDEMPTION')"),
        CheckConstraint("source IN ('MANUAL','CSV_IMPORT','BROKER_API')"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    asset_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assets.id"), nullable=False)
    txn_type: Mapped[str] = mapped_column(Text, nullable=False)
    txn_date: Mapped[date] = mapped_column(Date, nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    fees: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    taxes: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    source: Mapped[str] = mapped_column(Text, default="MANUAL")
    broker: Mapped[Optional[str]] = mapped_column(Text)
    external_ref: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    portfolio: Mapped["Portfolio"] = relationship(back_populates="transactions")
    asset: Mapped["Asset"] = relationship(back_populates="transactions")

    @property
    def net_amount(self) -> Decimal:
        return self.amount + self.fees + self.taxes

    def __repr__(self) -> str:
        return f"<Transaction {self.txn_type} {self.asset_id} on {self.txn_date}>"


# ── Target Allocations ────────────────────────────────────────────────────────

class TargetAllocation(Base):
    __tablename__ = "target_allocations"
    __table_args__ = (UniqueConstraint("portfolio_id", "label"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(Text, nullable=False)
    asset_class: Mapped[Optional[str]] = mapped_column(Text)
    country: Mapped[Optional[str]] = mapped_column(String(2))
    target_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    portfolio: Mapped["Portfolio"] = relationship(back_populates="target_allocations")


# ── Price History ─────────────────────────────────────────────────────────────

class PriceHistory(Base):
    __tablename__ = "price_history"
    __table_args__ = (UniqueConstraint("asset_id", "price_date"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    asset_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assets.id", ondelete="CASCADE"), nullable=False)
    price_date: Mapped[date] = mapped_column(Date, nullable=False)
    open: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    high: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    low: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    close: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    volume: Mapped[Optional[int]] = mapped_column(BigInteger)
    currency: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    asset: Mapped["Asset"] = relationship(back_populates="price_history")


# ── Watchlist ─────────────────────────────────────────────────────────────────

class Watchlist(Base):
    __tablename__ = "watchlist"
    __table_args__ = (UniqueConstraint("user_id", "asset_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    asset_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("assets.id"), nullable=False)
    alert_above: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    alert_below: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 4))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="watchlist")
    asset: Mapped["Asset"] = relationship(back_populates="watchlist")


# ── AI Conversations ──────────────────────────────────────────────────────────

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    portfolio_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("portfolios.id", ondelete="SET NULL"))
    title: Mapped[Optional[str]] = mapped_column(Text)
    model_used: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="conversations")
    messages: Mapped[List["AIMessage"]] = relationship(back_populates="conversation", cascade="all, delete-orphan", order_by="AIMessage.created_at")


class AIMessage(Base):
    __tablename__ = "ai_messages"
    __table_args__ = (CheckConstraint("role IN ('user','assistant','system')"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    conversation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tokens_used: Mapped[Optional[int]] = mapped_column(Integer)
    latency_ms: Mapped[Optional[int]] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation: Mapped["AIConversation"] = relationship(back_populates="messages")


# ── News Cache ────────────────────────────────────────────────────────────────

class NewsCache(Base):
    __tablename__ = "news_cache"
    __table_args__ = (CheckConstraint("sentiment IN ('POSITIVE','NEGATIVE','NEUTRAL')"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    source: Mapped[Optional[str]] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    sentiment: Mapped[Optional[str]] = mapped_column(Text)
    sentiment_score: Mapped[Optional[Decimal]] = mapped_column(Numeric(4, 3))
    related_tickers: Mapped[Optional[list]] = mapped_column(ARRAY(Text))
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ── Portfolio Snapshots ───────────────────────────────────────────────────────

class PortfolioSnapshot(Base):
    __tablename__ = "portfolio_snapshots"
    __table_args__ = (UniqueConstraint("portfolio_id", "snapshot_date"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    snapshot_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    invested_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    total_pnl: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    total_pnl_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 4))
    day_change: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2))
    day_change_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(8, 4))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    portfolio: Mapped["Portfolio"] = relationship(back_populates="snapshots")


# ── Import Logs ───────────────────────────────────────────────────────────────

class ImportLog(Base):
    __tablename__ = "import_logs"
    __table_args__ = (CheckConstraint("status IN ('PENDING','PROCESSING','SUCCESS','PARTIAL','FAILED')"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=_uuid)
    portfolio_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("portfolios.id", ondelete="CASCADE"), nullable=False)
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer)
    rows_total: Mapped[Optional[int]] = mapped_column(Integer)
    rows_imported: Mapped[Optional[int]] = mapped_column(Integer)
    rows_failed: Mapped[Optional[int]] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="PENDING")
    error_log: Mapped[Optional[dict]] = mapped_column(JSONB)
    imported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    portfolio: Mapped["Portfolio"] = relationship(back_populates="import_logs")
