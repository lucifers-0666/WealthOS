from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Literal, Optional, List, Dict, Any
from datetime import date, datetime, timedelta
import math
import logging
import pandas as pd
import numpy as np
import ta
from datasets import load_dataset
import yfinance as yf
from slowapi import Limiter
from slowapi.util import get_remote_address

from database.supabase_client import get_supabase
from core.price_fetcher import fetch_price, fetch_prices
from core.greeks_calculator import get_option_chain, black_scholes, calculate_greeks
from api.auth import get_current_user

logger = logging.getLogger("sandbox-routes")

FUTURES_CONTRACTS = {
    "NIFTY": {"ticker": "^NSEI", "lot_size": 50, "margin_pct": 0.10},
    "BANKNIFTY": {"ticker": "^NSEBANK", "lot_size": 15, "margin_pct": 0.10},
    "RELIANCE": {"ticker": "RELIANCE.NS", "lot_size": 250, "margin_pct": 0.12},
    "TCS": {"ticker": "TCS.NS", "lot_size": 175, "margin_pct": 0.12},
    "INFY": {"ticker": "INFY.NS", "lot_size": 400, "margin_pct": 0.12},
}

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])

# Helper: Keep _get_user_id for backwards compatibility with tests
def _get_user_id(request: Request, authorization: str = Header(None)) -> str:
    if not authorization:
        # Default dev fallback if no header
        return "7eb3ccbc-f8ab-4e6b-92a4-3d173be5b073"
    token = authorization.replace("Bearer ", "").strip()
    if token == "demo-token":
        import os
        return os.getenv("DEV_USER_ID", "7eb3ccbc-f8ab-4e6b-92a4-3d173be5b073")
    try:
        import jwt
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# Pydantic models for request bodies
class SandboxEquityOrder(BaseModel):
    ticker: str
    action: Literal["BUY", "SELL"]
    quantity: int

class SandboxOptionOrder(BaseModel):
    underlying: str
    action: Literal["BUY", "SELL"]
    option_type: Literal["CE", "PE"]
    strike_price: float
    expiry_date: date
    lots: int

class SandboxFutureOrder(BaseModel):
    underlying: str
    action: Literal["BUY", "SELL"]
    lots: int
    expiry_date: date

# ── DATABASE HELPERS ─────────────────────────────────────────────

def get_or_create_account(sb, user_id: str) -> dict:
    """Gets the sandbox account for the user, creating it if it doesn't exist."""
    res = sb.table("sandbox_accounts").select("*").eq("user_id", user_id).execute()
    if not res.data:
        # Create user account with initial balance ₹10,00,000
        new_acc = {
            "user_id": user_id,
            "balance": 1000000.00,
            "initial_balance": 1000000.00,
            "total_pnl": 0.00,
            "trades_count": 0
        }
        sb.table("sandbox_accounts").insert(new_acc).execute()
        res = sb.table("sandbox_accounts").select("*").eq("user_id", user_id).execute()
    return res.data[0]

def compute_position_details(trades: List[dict]) -> tuple[float, float]:
    """
    Computes unrealized P&L and blocked margin/premium for all open positions.
    Returns (total_unrealized_pnl, total_margin_or_premium_blocked)
    """
    unrealized_pnl = 0.0
    blocked_val = 0.0

    for t in trades:
        if t["status"] != "open":
            continue
        
        qty = float(t["quantity"])
        entry = float(t["entry_price"])
        
        # Get live price
        live = entry
        symbol = t["symbol"]
        
        try:
            if t["trade_type"] == "options":
                # Option symbol is stored like "RELIANCE 2400 CE" or similar.
                # Let's extract the underlying to get price
                parts = symbol.split()
                underlying = parts[0]
                strike = float(parts[1]) if len(parts) > 1 else entry
                opt_type = parts[2] if len(parts) > 2 else "CE"
                expiry = date.fromisoformat(t["option_expiry"]) if t["option_expiry"] else date.today()
                
                u_price_data = fetch_price(underlying)
                u_price = u_price_data.get("price", strike)
                chain = get_option_chain(underlying, u_price, expiry)
                strike_data = next((s for s in chain if s["strike"] == strike), None)
                if strike_data:
                    opt_data = strike_data["ce"] if opt_type == "CE" else strike_data["pe"]
                    live = float(opt_data["premium"])
            else:
                p_data = fetch_price(symbol)
                live = float(p_data.get("price", entry))
        except Exception as e:
            logger.warning(f"Error fetching live price for {symbol}: {e}")
            live = entry

        # Update LTP in trade row
        t["ltp"] = live
        
        # Calculate P&L
        if t["direction"] == "buy":
            pnl = (live - entry) * qty
            if t["trade_type"] == "options":
                pnl = (live - entry) * qty * float(t.get("lot_size", 1))
            elif t["trade_type"] == "futures":
                pnl = (live - entry) * qty * float(t.get("lot_size", 1))
        else: # sell (short)
            pnl = (entry - live) * qty
            if t["trade_type"] == "options":
                pnl = (entry - live) * qty * float(t.get("lot_size", 1))
            elif t["trade_type"] == "futures":
                pnl = (entry - live) * qty * float(t.get("lot_size", 1))

        t["pnl"] = round(pnl, 2)
        unrealized_pnl += pnl
        blocked_val += float(t.get("margin_used", 0))

    return unrealized_pnl, blocked_val

# ── WALLET ENDPOINTS ─────────────────────────────────────────────

@router.get("/wallet")
async def get_wallet(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    account = get_or_create_account(sb, user_id)
    
    # Query all open trades to compute live valuation
    trades_res = sb.table("sandbox_trades").select("*").eq("user_id", user_id).eq("status", "open").execute()
    open_trades = trades_res.data
    
    unrealized_pnl, blocked_margin = compute_position_details(open_trades)
    
    # Portfolio value = current cash balance + unrealized P&L
    acc_bal = float(account.get("balance", 0.0) or 0.0)
    acc_init = float(account.get("initial_balance", 1000000.00) or 1000000.00)
    
    portfolio_value = acc_bal + unrealized_pnl
    total_pnl = portfolio_value - acc_init
    total_pnl_percent = (total_pnl / acc_init) * 100 if acc_init > 0 else 0.0

    # Fetch realized P&L from closed trades
    closed_res = sb.table("sandbox_trades").select("pnl").eq("user_id", user_id).neq("status", "open").execute()
    realized_pnl = sum(float(x["pnl"] or 0) for x in closed_res.data)
    
    return {
        "balance": acc_bal,
        "initial_balance": acc_init,
        "portfolio_value": round(portfolio_value, 2),
        "total_pnl": round(total_pnl, 2),
        "total_pnl_percent": round(total_pnl_percent, 2),
        "realized_pnl": round(realized_pnl, 2),
        "blocked_margin": round(blocked_margin, 2),
        "available_balance": round(acc_bal - blocked_margin, 2)
    }

@router.post("/wallet/reset")
async def reset_wallet(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    
    # Update sandbox account back to 1,000,000
    sb.table("sandbox_accounts").update({
        "balance": 1000000.00,
        "initial_balance": 1000000.00,
        "total_pnl": 0.00,
        "trades_count": 0,
        "updated_at": datetime.now().isoformat()
    }).eq("user_id", user_id).execute()
    
    # Delete or square off all trades
    sb.table("sandbox_trades").delete().eq("user_id", user_id).execute()
    sb.table("sandbox_strategy_results").delete().eq("user_id", user_id).execute()
    
    return {"message": "Sandbox reset to ₹10,00,000"}

# ── POSITION & LEDGER ENDPOINTS ──────────────────────────────────

@router.get("/holdings")
async def get_holdings(user_id: str = Depends(_get_user_id)):
    """Exposes open Equity holdings for the UI."""
    sb = get_supabase()
    res = sb.table("sandbox_trades").select("*").eq("user_id", user_id).eq("trade_type", "intraday").eq("status", "open").execute()
    trades = res.data
    compute_position_details(trades)
    
    # Convert schema to match existing UI structure
    holdings = []
    for t in trades:
        holdings.append({
            "id": t["id"],
            "ticker": t["symbol"],
            "quantity": t["quantity"],
            "avg_buy_price": float(t["entry_price"]),
            "current_price": float(t["ltp"]),
            "unrealized_pnl": float(t["pnl"]),
            "pnl_percent": (float(t["pnl"]) / (float(t["entry_price"]) * float(t["quantity"]))) * 100 if float(t["entry_price"]) > 0 else 0.0,
            "direction": t["direction"],
            "opened_at": t["opened_at"]
        })
    return holdings

@router.get("/options/positions")
async def get_option_positions(user_id: str = Depends(_get_user_id)):
    """Exposes open Options positions for the UI."""
    sb = get_supabase()
    res = sb.table("sandbox_trades").select("*").eq("user_id", user_id).eq("trade_type", "options").eq("status", "open").execute()
    trades = res.data
    compute_position_details(trades)
    
    positions = []
    for t in trades:
        # Option symbol is stored like "RELIANCE 2400 CE"
        parts = t["symbol"].split()
        underlying = parts[0]
        strike = float(parts[1]) if len(parts) > 1 else float(t["option_strike"] or 0)
        opt_type = parts[2] if len(parts) > 2 else t["option_type"]
        
        positions.append({
            "id": t["id"],
            "underlying": underlying,
            "strike_price": strike,
            "option_type": opt_type,
            "expiry_date": t["option_expiry"],
            "lots_held": t["quantity"],
            "lot_size": t["lot_size"],
            "avg_premium": float(t["entry_price"]),
            "current_premium": float(t["ltp"]),
            "unrealized_pnl": float(t["pnl"]),
            "direction": t["direction"],
            "opened_at": t["opened_at"]
        })
    return positions

@router.get("/futures/positions")
async def get_futures_positions(user_id: str = Depends(_get_user_id)):
    """Exposes open Futures positions for the UI."""
    sb = get_supabase()
    res = sb.table("sandbox_trades").select("*").eq("user_id", user_id).eq("trade_type", "futures").eq("status", "open").execute()
    trades = res.data
    compute_position_details(trades)
    
    positions = []
    for t in trades:
        positions.append({
            "id": t["id"],
            "underlying": t["symbol"],
            "position_type": "LONG" if t["direction"] == "buy" else "SHORT",
            "lots": t["quantity"],
            "quantity": t["quantity"] * t["lot_size"],
            "avg_price": float(t["entry_price"]),
            "current_price": float(t["ltp"]),
            "unrealized_pnl": float(t["pnl"]),
            "margin_required": float(t["margin_used"]),
            "expiry_date": t["option_expiry"] or "2026-07-30",
            "opened_at": t["opened_at"]
        })
    return positions

@router.get("/orders")
async def get_orders(user_id: str = Depends(_get_user_id)):
    """Exposes transaction ledger (all trades) for the UI."""
    sb = get_supabase()
    res = sb.table("sandbox_trades").select("*").eq("user_id", user_id).order("opened_at", desc=True).limit(100).execute()
    orders = []
    for t in res.data:
        # Map sandbox_trades fields to frontend expected fields
        # symbol is mapped to ticker
        ticker = t["symbol"]
        action = t["direction"].upper()
        
        # Format option fields if option
        strike = None
        opt_type = None
        if t["trade_type"] == "options":
            parts = t["symbol"].split()
            ticker = parts[0]
            strike = float(parts[1]) if len(parts) > 1 else t["option_strike"]
            opt_type = parts[2] if len(parts) > 2 else t["option_type"]
            
        orders.append({
            "id": t["id"],
            "executed_at": t["opened_at"],
            "order_type": t["trade_type"].upper(),
            "action": action,
            "ticker": ticker,
            "quantity": t["quantity"] if t["trade_type"] != "options" else t["quantity"] * t["lot_size"],
            "price": float(t["entry_price"]),
            "total_value": float(t["entry_price"]) * float(t["quantity"]) * (float(t["lot_size"]) if t["trade_type"] in ("options", "futures") else 1.0),
            "status": t["status"].upper(),
            "strike_price": strike,
            "option_type": opt_type,
            "expiry_date": t["option_expiry"],
            "notes": t.get("notes") or f"P&L: ₹{t.get('pnl', 0):,.2f}"
        })
    return orders

# ── ORDER PLACEMENT FLOWS WITH FIFO NETTING ───────────────────────

def execute_trade_with_netting(sb, user_id: str, trade_type: str, symbol: str, direction: str, quantity: int, entry_price: float, lot_size: int = 1, option_strike: float = None, option_expiry: date = None, option_type: str = None, margin_pct: float = 1.0, strategy_tag: str = None) -> dict:
    """
    Main trade execution engine. It checks for opposite open trades and nets them.
    Any remaining quantity creates a new open position.
    """
    account = get_or_create_account(sb, user_id)
    balance = float(account.get("balance", 0.0) or 0.0)
    
    # Query opposite open positions
    opposite_direction = "sell" if direction == "buy" else "buy"
    opp_res = sb.table("sandbox_trades")\
        .select("*")\
        .eq("user_id", user_id)\
        .eq("symbol", symbol)\
        .eq("trade_type", trade_type)\
        .eq("direction", opposite_direction)\
        .eq("status", "open")\
        .order("opened_at", desc=False)\
        .execute()
        
    opp_trades = opp_res.data
    
    if direction == "sell" and trade_type in ("intraday", "options"):
        total_held = sum(int(t["quantity"]) for t in opp_trades)
        if total_held < quantity:
            raise HTTPException(status_code=400, detail="Insufficient holdings")
            
    remaining_qty = quantity
    realized_pnl = 0.0
    
    # Calculate costs/margins
    contract_multiplier = float(lot_size)
    
    for t in opp_trades:
        if remaining_qty <= 0:
            break
            
        match_qty = min(remaining_qty, t["quantity"])
        t_qty = float(t["quantity"])
        t_entry = float(t["entry_price"])
        
        # Calculate P&L for this matched portion
        if t["direction"] == "buy":
            pnl_portion = (entry_price - t_entry) * match_qty * contract_multiplier
        else: # sell
            pnl_portion = (t_entry - entry_price) * match_qty * contract_multiplier
            
        realized_pnl += pnl_portion
        
        # Update or close the opposite trade
        if match_qty == t["quantity"]:
            # Close completely
            sb.table("sandbox_trades").update({
                "status": "closed",
                "exit_price": entry_price,
                "pnl": pnl_portion,
                "closed_at": datetime.now().isoformat()
            }).eq("id", t["id"]).execute()
            
            # Return capital to balance
            if trade_type == "intraday":
                if t["direction"] == "buy":
                    # return entry capital + pnl = exit_value
                    balance += (t_entry * match_qty) + pnl_portion
                else: # sell (short)
                    # return margin blocked + pnl
                    balance += float(t.get("margin_used", 0)) + pnl_portion
            elif trade_type == "options":
                if t["direction"] == "buy":
                    balance += (t_entry * match_qty * contract_multiplier) + pnl_portion
                else: # write
                    balance += float(t.get("margin_used", 0)) + pnl_portion
            elif trade_type == "futures":
                # return margin blocked + pnl
                balance += float(t.get("margin_used", 0)) + pnl_portion
        else:
            # Partial close: reduce quantity of opposite, create a new closed record
            new_qty = t["quantity"] - match_qty
            sb.table("sandbox_trades").update({
                "quantity": new_qty,
                "margin_used": new_qty * t_entry * contract_multiplier * (margin_pct if trade_type != "intraday" else 0.20)
            }).eq("id", t["id"]).execute()
            
            # Insert closed row for history
            closed_trade = t.copy()
            closed_trade.pop("id", None)
            closed_trade.update({
                "quantity": match_qty,
                "status": "closed",
                "exit_price": entry_price,
                "pnl": pnl_portion,
                "margin_used": 0.0,
                "closed_at": datetime.now().isoformat()
            })
            sb.table("sandbox_trades").insert(closed_trade).execute()
            
            # Return capital to balance for partial close
            if trade_type == "intraday":
                if t["direction"] == "buy":
                    balance += (t_entry * match_qty) + pnl_portion
                else:
                    balance += (t_entry * match_qty * 0.20) + pnl_portion
            elif trade_type == "options":
                if t["direction"] == "buy":
                    balance += (t_entry * match_qty * contract_multiplier) + pnl_portion
                else:
                    balance += (t_entry * match_qty * contract_multiplier * 0.20) + pnl_portion
            elif trade_type == "futures":
                balance += (t_entry * match_qty * contract_multiplier * margin_pct) + pnl_portion
                
        remaining_qty -= match_qty

    # If we still have quantity left, open a new position
    if remaining_qty > 0:
        # Calculate capital requirement for new position
        new_cost = remaining_qty * entry_price * contract_multiplier
        margin_used = 0.0
        
        if trade_type == "intraday":
            if direction == "buy":
                if balance < new_cost:
                    raise HTTPException(status_code=400, detail=f"Insufficient balance. Required: ₹{new_cost:,.2f}, Available: ₹{balance:,.2f}")
                balance -= new_cost
            else: # short
                # Intraday short blocks 20% margin
                margin_used = new_cost * 0.20
                if balance < margin_used:
                    raise HTTPException(status_code=400, detail=f"Insufficient margin. Required: ₹{margin_used:,.2f}, Available: ₹{balance:,.2f}")
                # We block margin by deducting it from cash
                balance -= margin_used
        elif trade_type == "options":
            if direction == "buy":
                if balance < new_cost:
                    raise HTTPException(status_code=400, detail=f"Insufficient balance. Required: ₹{new_cost:,.2f}, Available: ₹{balance:,.2f}")
                balance -= new_cost
            else: # sell (option writing)
                # Option writing blocks 20% underlying margin
                margin_used = new_cost * 0.20
                if balance < margin_used:
                    raise HTTPException(status_code=400, detail=f"Insufficient margin. Required: ₹{margin_used:,.2f}, Available: ₹{balance:,.2f}")
                balance -= margin_used
        elif trade_type == "futures":
            # Futures buy/sell blocks margin
            margin_used = new_cost * margin_pct
            if balance < margin_used:
                raise HTTPException(status_code=400, detail=f"Insufficient margin. Required: ₹{margin_used:,.2f}, Available: ₹{balance:,.2f}")
            balance -= margin_used

        # Insert new open trade
        new_trade = {
            "user_id": user_id,
            "symbol": symbol,
            "trade_type": trade_type,
            "direction": direction,
            "quantity": remaining_qty,
            "entry_price": entry_price,
            "ltp": entry_price,
            "pnl": 0.0,
            "status": "open",
            "strategy_tag": strategy_tag,
            "option_strike": option_strike,
            "option_expiry": option_expiry.isoformat() if option_expiry else None,
            "option_type": option_type,
            "lot_size": lot_size,
            "margin_used": margin_used,
            "opened_at": datetime.now().isoformat()
        }
        sb.table("sandbox_trades").insert(new_trade).execute()

    # Update account balance and trade count
    trades_count = int(account.get("trades_count", 0) or 0) + 1
    sb.table("sandbox_accounts").update({
        "balance": round(balance, 2),
        "trades_count": trades_count,
        "updated_at": datetime.now().isoformat()
    }).eq("user_id", user_id).execute()
    
    return {
        "executed_price": entry_price,
        "total_value": quantity * entry_price * contract_multiplier,
        "new_balance": round(balance, 2),
        "realized_pnl": round(realized_pnl, 2),
        "message": f"Successfully executed {direction.upper()} order for {quantity} units of {symbol} at ₹{entry_price:,.2f}"
    }

# Place Equity Order
@router.post("/order/equity")
@limiter.limit("5/second")
async def place_equity_order(request: Request, order: SandboxEquityOrder, user_id: str = Depends(_get_user_id)):
    if order.quantity < 1 or order.quantity > 50000:
        raise HTTPException(status_code=400, detail="Invalid quantity. Min: 1, Max: 50,000.")
        
    ticker = order.ticker.upper().strip()
    p_data = fetch_price(ticker)
    curr_price = p_data.get("price", 0.0)
    if not curr_price:
        raise HTTPException(status_code=400, detail=f"Could not fetch live price for {ticker}")
        
    sb = get_supabase()
    res = execute_trade_with_netting(
        sb=sb,
        user_id=user_id,
        trade_type="intraday",
        symbol=ticker,
        direction=order.action.lower(),
        quantity=order.quantity,
        entry_price=curr_price
    )
    return res

# Place Option Order
@router.post("/order/option")
@limiter.limit("5/second")
async def place_option_order(request: Request, order: SandboxOptionOrder, user_id: str = Depends(_get_user_id)):
    if order.lots < 1 or order.lots > 100:
        raise HTTPException(status_code=400, detail="Invalid lots. Min: 1, Max: 100.")
    if order.expiry_date <= date.today():
        raise HTTPException(status_code=400, detail="Expiry date must be in the future.")
        
    underlying = order.underlying.upper().strip()
    lot_size = 50 if (underlying == "NIFTY" or underlying == "FINNIFTY") else 15 if underlying == "BANKNIFTY" else 250
    
    # Option symbol format in table
    opt_symbol = f"{underlying} {int(order.strike_price)} {order.option_type}"
    
    u_price_data = fetch_price(underlying)
    u_price = u_price_data.get("price", 0.0)
    if not u_price:
        raise HTTPException(status_code=400, detail=f"Could not fetch underlying price for {underlying}")
        
    chain = get_option_chain(underlying, u_price, order.expiry_date)
    strike_data = next((s for s in chain if s["strike"] == order.strike_price), None)
    if not strike_data:
        raise HTTPException(status_code=400, detail="Invalid strike price.")
        
    opt_data = strike_data["ce"] if order.option_type == "CE" else strike_data["pe"]
    premium = float(opt_data["premium"])
    
    sb = get_supabase()
    res = execute_trade_with_netting(
        sb=sb,
        user_id=user_id,
        trade_type="options",
        symbol=opt_symbol,
        direction=order.action.lower(),
        quantity=order.lots,
        entry_price=premium,
        lot_size=lot_size,
        option_strike=order.strike_price,
        option_expiry=order.expiry_date,
        option_type=order.option_type
    )
    return res

# Place Future Order
@router.post("/order/future")
@limiter.limit("5/second")
async def place_future_order(request: Request, order: SandboxFutureOrder, user_id: str = Depends(_get_user_id)):
    if order.lots < 1 or order.lots > 100:
        raise HTTPException(status_code=400, detail="Invalid lots. Min: 1, Max: 100.")
    if order.expiry_date <= date.today():
        raise HTTPException(status_code=400, detail="Contract expiry date must be in the future.")
        
    underlying = order.underlying.upper().strip()
    if underlying not in FUTURES_CONTRACTS:
        raise HTTPException(status_code=400, detail="Invalid underlying index/stock for futures.")
        
    details = FUTURES_CONTRACTS[underlying]
    lot_size = details["lot_size"]
    margin_pct = details["margin_pct"]
    
    p_data = fetch_price(details["ticker"])
    curr_price = p_data.get("price", 0.0)
    if not curr_price:
        raise HTTPException(status_code=400, detail=f"Could not fetch futures price for {underlying}")
        
    sb = get_supabase()
    res = execute_trade_with_netting(
        sb=sb,
        user_id=user_id,
        trade_type="futures",
        symbol=underlying,
        direction=order.action.lower(),
        quantity=order.lots,
        entry_price=curr_price,
        lot_size=lot_size,
        option_expiry=order.expiry_date,
        margin_pct=margin_pct
    )
    return res

# ── CLOSE / SQUARE-OFF ENDPOINT ─────────────────────────────────

@router.post("/trade/close/{trade_id}")
async def close_trade(trade_id: str, user_id: str = Depends(_get_user_id)):
    """Manually square off / close a specific open position."""
    sb = get_supabase()
    
    # Query the trade to close
    res = sb.table("sandbox_trades").select("*").eq("id", trade_id).eq("user_id", user_id).eq("status", "open").execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Open trade not found.")
        
    trade = res.data[0]
    symbol = trade["symbol"]
    trade_type = trade["trade_type"]
    direction = trade["direction"]
    qty = int(trade["quantity"])
    entry = float(trade["entry_price"])
    lot_size = int(trade.get("lot_size", 1))
    
    # Fetch live price
    exit_price = entry
    try:
        if trade_type == "options":
            parts = symbol.split()
            underlying = parts[0]
            strike = float(parts[1]) if len(parts) > 1 else entry
            opt_type = parts[2] if len(parts) > 2 else "CE"
            expiry = date.fromisoformat(trade["option_expiry"]) if trade["option_expiry"] else date.today()
            
            u_price_data = fetch_price(underlying)
            u_price = u_price_data.get("price", strike)
            chain = get_option_chain(underlying, u_price, expiry)
            strike_data = next((s for s in chain if s["strike"] == strike), None)
            if strike_data:
                opt_data = strike_data["ce"] if opt_type == "CE" else strike_data["pe"]
                exit_price = float(opt_data["premium"])
        else:
            p_data = fetch_price(symbol)
            exit_price = float(p_data.get("price", entry))
    except Exception as e:
        logger.warning(f"Error fetching exit price for {symbol}: {e}")
        exit_price = entry
        
    # Calculate realized P&L
    contract_multiplier = float(lot_size)
    if direction == "buy":
        pnl = (exit_price - entry) * qty * contract_multiplier
    else: # sell
        pnl = (entry - exit_price) * qty * contract_multiplier
        
    # Fetch account
    account = get_or_create_account(sb, user_id)
    balance = float(account.get("balance", 0.0) or 0.0)
    
    # Return capital
    if trade_type == "intraday":
        if direction == "buy":
            balance += (entry * qty) + pnl
        else:
            balance += float(trade.get("margin_used", 0)) + pnl
    elif trade_type == "options":
        if direction == "buy":
            balance += (entry * qty * contract_multiplier) + pnl
        else:
            balance += float(trade.get("margin_used", 0)) + pnl
    elif trade_type == "futures":
        balance += float(trade.get("margin_used", 0)) + pnl
        
    # Update trade status
    sb.table("sandbox_trades").update({
        "status": "closed",
        "exit_price": exit_price,
        "pnl": pnl,
        "closed_at": datetime.now().isoformat()
    }).eq("id", trade_id).execute()
    
    # Update account balance
    sb.table("sandbox_accounts").update({
        "balance": round(balance, 2),
        "updated_at": datetime.now().isoformat()
    }).eq("user_id", user_id).execute()
    
    return {
        "message": f"Successfully squared off position in {symbol}. Realized P&L: ₹{pnl:,.2f}",
        "pnl": pnl,
        "new_balance": balance
    }

# ── LEADERBOARD ENDPOINT ─────────────────────────────────────────

@router.get("/leaderboard")
async def get_leaderboard():
    sb = get_supabase()
    
    # Fetch all sandbox accounts
    accounts_res = sb.table("sandbox_accounts").select("user_id, balance, initial_balance, total_pnl, trades_count").execute()
    accounts = accounts_res.data
    
    # Fetch all user profiles for names
    profiles_res = sb.table("profiles").select("id, full_name, email").execute()
    profile_map = {p["id"]: p for p in profiles_res.data}
    
    leaderboard = []
    for acc in accounts:
        u_id = acc["user_id"]
        profile = profile_map.get(u_id, {})
        name = profile.get("full_name") or profile.get("email") or "Anonymous Trader"
        if "@" in name:
            name = name.split("@")[0].capitalize()
            
        initial = float(acc["initial_balance"])
        balance = float(acc["balance"])
        
        # Live valuation computation for accurate leaderboard
        open_trades_res = sb.table("sandbox_trades").select("*").eq("user_id", u_id).eq("status", "open").execute()
        unrealized_pnl, _ = compute_position_details(open_trades_res.data)
        
        portfolio_value = balance + unrealized_pnl
        net_return = portfolio_value - initial
        return_pct = (net_return / initial * 100) if initial > 0 else 0.0
        
        leaderboard.append({
            "name": name,
            "initial_balance": initial,
            "portfolio_value": round(portfolio_value, 2),
            "total_pnl": round(net_return, 2),
            "return_percent": round(return_pct, 2),
            "trades_count": acc["trades_count"]
        })
        
    # Sort by return_percent descending
    leaderboard.sort(key=lambda x: x["return_percent"], reverse=True)
    
    # Add rank
    for rank, item in enumerate(leaderboard, 1):
        item["rank"] = rank
        
    return leaderboard[:10]

# ── STRATEGY LAB & BACKTESTER ─────────────────────────────────────

@router.get("/strategies")
async def get_strategies():
    """Returns definitions of the 8 popular backtesting strategies."""
    return [
        {
            "name": "SMA Crossover",
            "description": "Simple Moving Average Crossover. Buys when a fast SMA crosses above a slow SMA (Golden Cross), indicating a bullish trend. Sells/Shorts when the opposite occurs (Death Cross).",
            "parameters": {"fast_period": 9, "slow_period": 21}
        },
        {
            "name": "EMA Crossover",
            "description": "Exponential Moving Average Crossover. Similar to SMA crossover but reacts faster to recent price fluctuations.",
            "parameters": {"fast_period": 9, "slow_period": 21}
        },
        {
            "name": "RSI Mean Reversion",
            "description": "Relative Strength Index indicator. Buys when the asset is oversold (RSI below 30) anticipating a reversion to the mean, and sells when overbought (RSI above 70).",
            "parameters": {"rsi_period": 14, "oversold": 30, "overbought": 70}
        },
        {
            "name": "MACD Trend Rider",
            "description": "Moving Average Convergence Divergence. Uses the MACD line crossing above the Signal line to buy, and crossing below to sell.",
            "parameters": {"fast_period": 12, "slow_period": 26, "signal_period": 9}
        },
        {
            "name": "Bollinger Bands Reversion",
            "description": "Bollinger Bands. Buys when the price drops below the lower band (oversold/undervalued) and sells when it touches or rises above the upper band.",
            "parameters": {"period": 20, "std_dev": 2.0}
        },
        {
            "name": "SuperTrend Follower",
            "description": "Trend following indicator using Average True Range (ATR) to trail stops. Holds long positions during green trend bands and exits during red bands.",
            "parameters": {"atr_period": 10, "multiplier": 3.0}
        },
        {
            "name": "Dual Thrust Range Breakout",
            "description": "Famous breakout strategy based on opening range. Buys when price climbs above a threshold of the previous day's high/low range, sells when it breaches the lower threshold.",
            "parameters": {"period": 4, "k1": 0.5, "k2": 0.5}
        },
        {
            "name": "Momentum ROC",
            "description": "Rate of Change Momentum. Enters long when the price ROC is positive and rising, exits when the rate of change flips negative.",
            "parameters": {"roc_period": 12}
        }
    ]

def load_historical_data(symbol: str, start_date: str, end_date: str) -> pd.DataFrame:
    """3-level fallback data loader: Hugging Face datasets -> yfinance -> Synthetic."""
    
    # 1. Hugging Face dataset fallback
    try:
        logger.info(f"Fallback Level 1: Loading {symbol} historical data from Hugging Face...")
        dataset = load_dataset("akshaybhat/NSE-historical-data", split="train", trust_remote_code=True)
        df = dataset.to_pandas()
        df.columns = [c.lower() for c in df.columns]
        
        if 'symbol' in df.columns and 'date' in df.columns:
            symbol_df = df[df['symbol'].str.upper() == symbol.upper()].copy()
            if not symbol_df.empty:
                symbol_df['date'] = pd.to_datetime(symbol_df['date'])
                # Filter by dates
                symbol_df = symbol_df[(symbol_df['date'] >= start_date) & (symbol_df['date'] <= end_date)]
                if not symbol_df.empty:
                    symbol_df = symbol_df.sort_values('date').set_index('date')
                    # Rename columns to standard yfinance style
                    rename_dict = {
                        'open': 'Open', 'high': 'High', 'low': 'Low', 'close': 'Close', 'volume': 'Volume'
                    }
                    symbol_df = symbol_df.rename(columns=rename_dict)
                    logger.info(f"Hugging Face load successful: {len(symbol_df)} rows")
                    return symbol_df[['Open', 'High', 'Low', 'Close', 'Volume']]
    except Exception as e:
        logger.warning(f"Hugging Face dataset download failed: {e}. Trying yfinance.")

    # 2. yfinance fallback
    try:
        logger.info(f"Fallback Level 2: Loading {symbol} historical data from yfinance...")
        yf_symbol = symbol.upper().strip()
        if not yf_symbol.endswith(".NS") and yf_symbol not in ["^NSEI", "^NSEBANK"]:
            yf_symbol = f"{yf_symbol}.NS"
        df = yf.download(yf_symbol, start=start_date, end=end_date, progress=False)
        if not df.empty and len(df) > 5:
            if isinstance(df.columns, pd.MultiIndex):
                df.columns = df.columns.get_level_values(0)
            logger.info(f"yfinance load successful: {len(df)} rows")
            return df[['Open', 'High', 'Low', 'Close', 'Volume']].dropna()
    except Exception as e:
        logger.warning(f"yfinance download failed: {e}. Generating synthetic data.")

    # 3. Synthetic data generator (Geometric Brownian Motion / Monte Carlo)
    logger.info(f"Fallback Level 3: Generating synthetic data for {symbol}...")
    dates = pd.date_range(start=start_date, end=end_date, freq='D')
    n_days = len(dates)
    
    so = 100.0  # default
    u = symbol.upper().strip()
    if u in ("NIFTY", "NIFTY50", "^NSEI"): so = 22000.0
    elif u in ("BANKNIFTY", "^NSEBANK"): so = 48000.0
    elif u == "RELIANCE": so = 2500.0
    elif u == "TCS": so = 3800.0
    elif u == "INFY": so = 1600.0
    
    # Simulate geometric Brownian motion returns
    mu = 0.0005  # slight drift
    sigma = 0.015  # 1.5% daily volatility
    
    daily_returns = np.random.normal(mu, sigma, n_days)
    price_path = so * np.exp(np.cumsum(daily_returns))
    
    # Build open, high, low, close
    opens = price_path * (1 + np.random.normal(0, 0.002, n_days))
    highs = np.maximum(price_path, opens) * (1 + np.abs(np.random.normal(0, 0.004, n_days)))
    lows = np.minimum(price_path, opens) * (1 - np.abs(np.random.normal(0, 0.004, n_days)))
    volumes = np.random.randint(50000, 2000000, n_days)
    
    df_synthetic = pd.DataFrame({
        'Open': opens,
        'High': highs,
        'Low': lows,
        'Close': price_path,
        'Volume': volumes
    }, index=dates)
    df_synthetic.index.name = 'date'
    return df_synthetic

@router.post("/strategies/backtest")
async def run_strategy_backtest(req_body: dict, user_id: str = Depends(_get_user_id)):
    """Runs strategy backtests using ta and historical data."""
    strategy_name = req_body.get("strategy_name")
    symbol = req_body.get("symbol", "NIFTY")
    parameters = req_body.get("parameters", {})
    start_date = req_body.get("start_date", (datetime.now() - timedelta(days=365)).strftime("%Y-%m-%d"))
    end_date = req_body.get("end_date", datetime.now().strftime("%Y-%m-%d"))
    
    # 1. Load data
    df = load_historical_data(symbol, start_date, end_date)
    if df.empty or len(df) < 15:
        raise HTTPException(status_code=400, detail="Insufficient historical data to run backtest.")
        
    close_series = df["Close"].astype(float)
    high_series = df["High"].astype(float)
    low_series = df["Low"].astype(float)
    open_series = df["Open"].astype(float)
    
    # 2. Compute signals
    buy_signals = pd.Series(index=df.index, data=False)
    sell_signals = pd.Series(index=df.index, data=False)
    
    if strategy_name == "SMA Crossover":
        fast = int(parameters.get("fast_period", 9))
        slow = int(parameters.get("slow_period", 21))
        fast_sma = ta.trend.sma_indicator(close_series, window=fast)
        slow_sma = ta.trend.sma_indicator(close_series, window=slow)
        
        # Buy on Golden Cross, Sell on Death Cross
        diff = fast_sma - slow_sma
        buy_signals = (diff > 0) & (diff.shift(1) <= 0)
        sell_signals = (diff < 0) & (diff.shift(1) >= 0)
        
    elif strategy_name == "EMA Crossover":
        fast = int(parameters.get("fast_period", 9))
        slow = int(parameters.get("slow_period", 21))
        fast_ema = ta.trend.ema_indicator(close_series, window=fast)
        slow_ema = ta.trend.ema_indicator(close_series, window=slow)
        
        diff = fast_ema - slow_ema
        buy_signals = (diff > 0) & (diff.shift(1) <= 0)
        sell_signals = (diff < 0) & (diff.shift(1) >= 0)
        
    elif strategy_name == "RSI Mean Reversion":
        period = int(parameters.get("rsi_period", 14))
        oversold = float(parameters.get("oversold", 30))
        overbought = float(parameters.get("overbought", 70))
        
        rsi = ta.momentum.rsi(close_series, window=period)
        buy_signals = (rsi < oversold) & (rsi.shift(1) >= oversold)
        sell_signals = (rsi > overbought) & (rsi.shift(1) <= overbought)
        
    elif strategy_name == "MACD Trend Rider":
        fast = int(parameters.get("fast_period", 12))
        slow = int(parameters.get("slow_period", 26))
        sign = int(parameters.get("signal_period", 9))
        
        macd = ta.trend.macd(close_series, window_fast=fast, window_slow=slow)
        macd_sig = ta.trend.macd_signal(close_series, window_fast=fast, window_slow=slow, window_sign=sign)
        diff = macd - macd_sig
        buy_signals = (diff > 0) & (diff.shift(1) <= 0)
        sell_signals = (diff < 0) & (diff.shift(1) >= 0)
        
    elif strategy_name == "Bollinger Bands Reversion":
        period = int(parameters.get("period", 20))
        std_dev = float(parameters.get("std_dev", 2.0))
        
        bb_high = ta.volatility.bollinger_hband(close_series, window=period, window_dev=std_dev)
        bb_low = ta.volatility.bollinger_lband(close_series, window=period, window_dev=std_dev)
        
        buy_signals = (close_series < bb_low)
        sell_signals = (close_series > bb_high)
        
    elif strategy_name == "SuperTrend Follower":
        atr_pd = int(parameters.get("atr_period", 10))
        mult = float(parameters.get("multiplier", 3.0))
        
        # Calculate ATR
        atr = ta.volatility.average_true_range(high_series, low_series, close_series, window=atr_pd)
        hl2 = (high_series + low_series) / 2
        
        upper_band = hl2 + (mult * atr)
        lower_band = hl2 - (mult * atr)
        
        trend = pd.Series(1, index=df.index)
        for i in range(1, len(df)):
            if close_series.iloc[i] > upper_band.iloc[i-1]:
                trend.iloc[i] = 1
            elif close_series.iloc[i] < lower_band.iloc[i-1]:
                trend.iloc[i] = -1
            else:
                trend.iloc[i] = trend.iloc[i-1]
                if trend.iloc[i] == 1 and lower_band.iloc[i] < lower_band.iloc[i-1]:
                    lower_band.iloc[i] = lower_band.iloc[i-1]
                if trend.iloc[i] == -1 and upper_band.iloc[i] > upper_band.iloc[i-1]:
                    upper_band.iloc[i] = upper_band.iloc[i-1]
                    
        buy_signals = (trend == 1) & (trend.shift(1) == -1)
        sell_signals = (trend == -1) & (trend.shift(1) == 1)
        
    elif strategy_name == "Dual Thrust Range Breakout":
        pd_val = int(parameters.get("period", 4))
        k1 = float(parameters.get("k1", 0.5))
        k2 = float(parameters.get("k2", 0.5))
        
        hh = high_series.rolling(pd_val).max()
        hc = close_series.rolling(pd_val).max()
        lc = close_series.rolling(pd_val).min()
        ll = low_series.rolling(pd_val).min()
        
        rng = np.maximum(hh - lc, hc - ll)
        buy_line = open_series + k1 * rng
        sell_line = open_series - k2 * rng
        
        buy_signals = (close_series > buy_line)
        sell_signals = (close_series < sell_line)
        
    else:  # Momentum ROC
        roc_pd = int(parameters.get("roc_period", 12))
        roc = ta.momentum.roc(close_series, window=roc_pd)
        buy_signals = (roc > 0) & (roc.shift(1) <= 0)
        sell_signals = (roc < 0) & (roc.shift(1) >= 0)

    # 3. Simulate Backtest
    capital = 100000.00
    initial_capital = capital
    position = 0.0  # quantity
    entry_price = 0.0
    trades_log = []
    
    equity_curve = []
    
    for date_idx, price in close_series.items():
        dt_str = date_idx.strftime("%Y-%m-%d")
        
        if buy_signals.loc[date_idx] and position == 0:
            # Buy
            position = capital / price
            entry_price = price
            trades_log.append({
                "type": "BUY",
                "date": dt_str,
                "price": round(price, 2),
                "pnl": 0.0,
                "capital": round(capital, 2)
            })
        elif sell_signals.loc[date_idx] and position > 0:
            # Sell
            exit_price = price
            trade_pnl = (exit_price - entry_price) * position
            capital += trade_pnl
            trades_log.append({
                "type": "SELL",
                "date": dt_str,
                "price": round(price, 2),
                "pnl": round(trade_pnl, 2),
                "capital": round(capital, 2)
            })
            position = 0.0
            
        curr_val = capital if position == 0 else position * price
        equity_curve.append(curr_val)

    # 4. Metrics
    total_return = ((capital - initial_capital) / initial_capital) * 100
    
    # Win rate
    sell_trades = [t for t in trades_log if t["type"] == "SELL"]
    wins = [t for t in sell_trades if t["pnl"] > 0]
    win_rate = (len(wins) / len(sell_trades) * 100) if sell_trades else 0.0
    
    # Drawdown
    equity_series = pd.Series(equity_curve)
    peaks = equity_series.cummax()
    drawdowns = (equity_series - peaks) / peaks * 100
    max_drawdown = drawdowns.min() if not drawdowns.empty else 0.0
    
    result = {
        "total_return": round(total_return, 2),
        "win_rate": round(win_rate, 2),
        "max_drawdown": round(abs(max_drawdown), 2),
        "trades": trades_log
    }
    
    # Save/cache in database
    sb = get_supabase()
    try:
        sb.table("sandbox_strategy_results").upsert({
            "user_id": user_id,
            "strategy_name": strategy_name,
            "symbol": symbol,
            "parameters": parameters,
            "result": result,
            "run_at": datetime.now().isoformat()
        }, on_conflict="user_id, strategy_name, symbol").execute()
    except Exception as db_e:
        logger.error(f"Error caching backtest: {db_e}")
        
    return result
