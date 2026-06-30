from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import date
from database.supabase_client import get_supabase
from core.price_fetcher import fetch_price
from core.greeks_calculator import get_option_chain
import math
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

router = APIRouter(prefix="/api/sandbox", tags=["sandbox"])

import jwt
from fastapi import Request

def _get_user_id(request: Request, authorization: str = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "")
    try:
        # Fast local unverified decode to save Supabase roundtrip
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

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

# ── WALLET ENDPOINTS ─────────────────────────────────────────────

@router.get("/wallet")
async def get_wallet(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    wallet_res = sb.table("sandbox_wallet").select("*").eq("user_id", user_id).execute()
    if not wallet_res.data:
        raise HTTPException(status_code=404, detail="Wallet not found")
    
    wallet = wallet_res.data[0]
    holdings_res = sb.table("sandbox_holdings").select("*").eq("user_id", user_id).execute()
    
    market_value = 0.0
    for h in holdings_res.data:
        p = fetch_price(h["ticker"])
        curr = p.get("price", h["avg_buy_price"])
        market_value += float(h["quantity"]) * curr
        
    portfolio_value = float(wallet["balance"]) + market_value
    total_pnl = portfolio_value - float(wallet["initial_balance"])
    
    return {
        "balance": float(wallet["balance"]),
        "initial_balance": float(wallet["initial_balance"]),
        "portfolio_value": portfolio_value,
        "total_pnl": total_pnl,
        "total_pnl_percent": (total_pnl / float(wallet["initial_balance"])) * 100
    }

@router.post("/wallet/reset")
async def reset_wallet(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    
    sb.table("sandbox_wallet").update({"balance": 500000.00}).eq("user_id", user_id).execute()
    sb.table("sandbox_holdings").delete().eq("user_id", user_id).execute()
    sb.table("sandbox_option_positions").delete().eq("user_id", user_id).execute()
    
    sb.table("sandbox_orders").insert({
        "user_id": user_id,
        "order_type": "RESET",
        "action": "RESET",
        "ticker": "RESET",
        "quantity": 0,
        "price": 0,
        "total_value": 0,
        "status": "EXECUTED",
        "notes": "Sandbox Reset"
    }).execute()
    
    return {"message": "Sandbox reset to ₹5,00,000"}

# ── EQUITY ENDPOINTS ─────────────────────────────────────────────

@router.get("/holdings")
async def get_holdings(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    res = sb.table("sandbox_holdings").select("*").eq("user_id", user_id).execute()
    
    holdings = []
    for h in res.data:
        p = fetch_price(h["ticker"])
        curr = p.get("price", h["avg_buy_price"])
        val = float(h["quantity"]) * curr
        unrealized = val - (float(h["quantity"]) * float(h["avg_buy_price"]))
        pnl_pct = (unrealized / (float(h["quantity"]) * float(h["avg_buy_price"]))) * 100 if float(h["avg_buy_price"]) > 0 else 0
        
        h["current_price"] = curr
        h["current_value"] = val
        h["unrealized_pnl"] = unrealized
        h["pnl_percent"] = pnl_pct
        holdings.append(h)
        
    holdings.sort(key=lambda x: x["unrealized_pnl"], reverse=True)
    return holdings

@router.post("/order/equity")
@limiter.limit("1/second")
async def place_equity_order(request: Request, order: SandboxEquityOrder, user_id: str = Depends(_get_user_id)):
    if not order.ticker or len(order.ticker) > 20:
        raise HTTPException(status_code=400, detail="Invalid ticker")
    if order.quantity < 1 or order.quantity > 10000:
        raise HTTPException(status_code=400, detail="Invalid quantity")
        
    sb = get_supabase()
    ticker = order.ticker.upper().strip()
    
    p = fetch_price(ticker)
    curr_price = p.get("price", 0.0)
    if not curr_price:
        raise HTTPException(status_code=400, detail="Could not fetch price for ticker")
        
    total_val = float(order.quantity) * curr_price
    
    wallet_res = sb.table("sandbox_wallet").select("*").eq("user_id", user_id).execute()
    wallet = wallet_res.data[0]
    balance = float(wallet["balance"])
    
    holdings_res = sb.table("sandbox_holdings").select("*").eq("user_id", user_id).eq("ticker", ticker).execute()
    existing_holding = holdings_res.data[0] if holdings_res.data else None
    
    if order.action == "BUY":
        if balance < total_val:
            raise HTTPException(status_code=400, detail="Insufficient balance")
            
        new_balance = balance - total_val
        sb.table("sandbox_wallet").update({"balance": new_balance}).eq("user_id", user_id).execute()
        
        if existing_holding:
            ex_qty = float(existing_holding["quantity"])
            ex_avg = float(existing_holding["avg_buy_price"])
            new_qty = ex_qty + order.quantity
            new_avg = ((ex_qty * ex_avg) + total_val) / new_qty
            sb.table("sandbox_holdings").update({
                "quantity": new_qty,
                "avg_buy_price": round(new_avg, 2)
            }).eq("id", existing_holding["id"]).execute()
        else:
            sb.table("sandbox_holdings").insert({
                "user_id": user_id,
                "ticker": ticker,
                "quantity": order.quantity,
                "avg_buy_price": curr_price
            }).execute()
            
    else: # SELL
        if not existing_holding or float(existing_holding["quantity"]) < order.quantity:
            raise HTTPException(status_code=400, detail="Insufficient holdings")
            
        realized_pnl = (curr_price - float(existing_holding["avg_buy_price"])) * order.quantity
        new_balance = balance + total_val
        new_realized_pnl = float(wallet.get("realized_pnl", 0)) + realized_pnl
        sb.table("sandbox_wallet").update({"balance": new_balance, "realized_pnl": new_realized_pnl}).eq("user_id", user_id).execute()
        
        new_qty = float(existing_holding["quantity"]) - order.quantity
        if new_qty == 0:
            sb.table("sandbox_holdings").delete().eq("id", existing_holding["id"]).execute()
        else:
            sb.table("sandbox_holdings").update({"quantity": new_qty}).eq("id", existing_holding["id"]).execute()
            
    sb.table("sandbox_orders").insert({
        "user_id": user_id,
        "order_type": "EQUITY",
        "action": order.action,
        "ticker": ticker,
        "quantity": order.quantity,
        "price": curr_price,
        "total_value": total_val,
        "status": "EXECUTED"
    }).execute()
    
    # Try calling AI if needed (Phase 4 integration)
    try:
        from core.ai_client import GeminiClient
        from database.crud import get_or_create_profile
        from config import settings
        profile = get_or_create_profile(user_id)
        api_key = (
            profile.get("gemini_api_key") or 
            profile.get("ui_preferences", {}).get("gemini_api_key") or 
            settings.GEMINI_API_KEY
        )
        if api_key:
            client = GeminiClient(api_key)
            # Stub call for later...
    except Exception as e:
        logger.warning(f"Failed to initiate sandbox AI call: {e}")
        
    return {
        "executed_price": curr_price,
        "total_value": total_val,
        "new_balance": new_balance,
        "message": f"{order.action} {order.quantity} shares of {ticker} at ₹{curr_price:,.2f}"
    }

@router.get("/orders")
async def get_orders(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    res = sb.table("sandbox_orders").select("*").eq("user_id", user_id).order("executed_at", desc=True).limit(50).execute()
    return res.data

# ── OPTIONS ENDPOINTS ────────────────────────────────────────────

@router.get("/options/chain")
async def get_options_chain(underlying: str, expiry: date):
    p = fetch_price(underlying + ".NS" if not underlying.endswith(".NS") else underlying)
    curr_price = p.get("price", 0.0)
    if not curr_price:
        raise HTTPException(status_code=400, detail="Could not fetch price for underlying")
        
    chain = get_option_chain(underlying, curr_price, expiry)
    return chain

@router.post("/order/option")
async def place_option_order(order: SandboxOptionOrder, user_id: str = Depends(_get_user_id)):
    if order.lots < 1 or order.lots > 50:
        raise HTTPException(status_code=400, detail="Invalid lots")
    if order.expiry_date <= date.today():
        raise HTTPException(status_code=400, detail="Expiry date must be in the future")
        
    u = order.underlying.upper().strip()
    lot_size = 50 if (u == "NIFTY" or u == "FINNIFTY") else 15 if u == "BANKNIFTY" else 50
    
    p = fetch_price(u + ".NS")
    curr_price = p.get("price", 0.0)
    if not curr_price:
        raise HTTPException(status_code=400, detail="Could not fetch price for underlying")
        
    chain = get_option_chain(u, curr_price, order.expiry_date)
    strike_data = next((s for s in chain if s["strike"] == order.strike_price), None)
    if not strike_data:
        raise HTTPException(status_code=400, detail="Invalid strike price")
        
    opt_data = strike_data["ce"] if order.option_type == "CE" else strike_data["pe"]
    premium = opt_data["premium"]
    total_cost = order.lots * lot_size * premium
    
    sb = get_supabase()
    wallet_res = sb.table("sandbox_wallet").select("*").eq("user_id", user_id).execute()
    wallet = wallet_res.data[0]
    balance = float(wallet["balance"])
    
    pos_res = sb.table("sandbox_option_positions").select("*").eq("user_id", user_id)\
        .eq("underlying", u).eq("strike_price", order.strike_price)\
        .eq("expiry_date", order.expiry_date.isoformat()).eq("option_type", order.option_type)\
        .eq("position_status", "OPEN").execute()
    
    existing_pos = pos_res.data[0] if pos_res.data else None
    
    if order.action == "BUY":
        if balance < total_cost:
            raise HTTPException(status_code=400, detail="Insufficient balance")
            
        new_balance = balance - total_cost
        sb.table("sandbox_wallet").update({"balance": new_balance}).eq("user_id", user_id).execute()
        
        if existing_pos:
            ex_lots = existing_pos["lots_held"]
            ex_avg = float(existing_pos["avg_premium"])
            new_lots = ex_lots + order.lots
            new_avg = ((ex_lots * ex_avg) + (order.lots * premium)) / new_lots
            sb.table("sandbox_option_positions").update({
                "lots_held": new_lots,
                "avg_premium": new_avg,
                "current_premium": premium,
                "delta": opt_data["delta"],
                "theta": opt_data["theta"],
                "gamma": opt_data["gamma"],
                "iv": opt_data["iv"]
            }).eq("id", existing_pos["id"]).execute()
        else:
            sb.table("sandbox_option_positions").insert({
                "user_id": user_id,
                "underlying": u,
                "strike_price": order.strike_price,
                "expiry_date": order.expiry_date.isoformat(),
                "option_type": order.option_type,
                "lot_size": lot_size,
                "lots_held": order.lots,
                "avg_premium": premium,
                "current_premium": premium,
                "delta": opt_data["delta"],
                "theta": opt_data["theta"],
                "gamma": opt_data["gamma"],
                "iv": opt_data["iv"]
            }).execute()
    else:
        # SELL (to close)
        if not existing_pos or existing_pos["lots_held"] < order.lots:
            raise HTTPException(status_code=400, detail="Insufficient holdings")
            
        realized_pnl = (premium - float(existing_pos["avg_premium"])) * order.lots * lot_size
        new_balance = balance + total_cost
        new_realized_pnl = float(wallet.get("realized_pnl", 0)) + realized_pnl
        sb.table("sandbox_wallet").update({"balance": new_balance, "realized_pnl": new_realized_pnl}).eq("user_id", user_id).execute()
        
        new_lots = existing_pos["lots_held"] - order.lots
        if new_lots == 0:
            sb.table("sandbox_option_positions").update({"position_status": "CLOSED", "lots_held": 0}).eq("id", existing_pos["id"]).execute()
        else:
            sb.table("sandbox_option_positions").update({"lots_held": new_lots}).eq("id", existing_pos["id"]).execute()
            
    sb.table("sandbox_orders").insert({
        "user_id": user_id,
        "order_type": "OPTION",
        "action": order.action,
        "ticker": u,
        "quantity": order.lots * lot_size,
        "price": premium,
        "total_value": total_cost,
        "strike_price": order.strike_price,
        "expiry_date": order.expiry_date.isoformat(),
        "option_type": order.option_type,
        "lot_size": lot_size,
        "premium": premium,
        "status": "EXECUTED"
    }).execute()
    
    return {
        "executed_price": premium,
        "total_value": total_cost,
        "new_balance": new_balance,
        "message": f"{order.action} {order.lots} lots of {u} {order.strike_price} {order.option_type} at ₹{premium:,.2f}"
    }

@router.get("/options/positions")
async def get_option_positions(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    res = sb.table("sandbox_option_positions").select("*").eq("user_id", user_id).eq("position_status", "OPEN").order("expiry_date", desc=False).execute()
    
    positions = []
    for pos in res.data:
        try:
            p = fetch_price(pos["underlying"] + ".NS")
            curr_price = p.get("price", 0.0)
            if curr_price:
                chain = get_option_chain(pos["underlying"], curr_price, date.fromisoformat(pos["expiry_date"]))
                strike_data = next((s for s in chain if s["strike"] == pos["strike_price"]), None)
                if strike_data:
                    opt_data = strike_data["ce"] if pos["option_type"] == "CE" else strike_data["pe"]
                    pos["current_premium"] = opt_data["premium"]
                    pos["delta"] = opt_data["delta"]
                    pos["theta"] = opt_data["theta"]
                    pos["gamma"] = opt_data["gamma"]
                    pos["iv"] = opt_data["iv"]
        except Exception:
            pass
            
        avg = float(pos["avg_premium"])
        curr = float(pos["current_premium"] or avg)
        lots = pos["lots_held"]
        lot_size = pos["lot_size"]
        
        pos["unrealized_pnl"] = (curr - avg) * lots * lot_size
        positions.append(pos)
        
    return positions

# ── FUTURES ENDPOINTS ────────────────────────────────────────────

@router.get("/futures/contracts")
async def get_futures_contracts():
    return [
        {"underlying": "NIFTY", "expiry": "2026-07-30", "lot_size": 50, "current_price": 22100.0, "margin_required": 110000.0}
    ]

@router.post("/order/future")
async def place_future_order(user_id: str = Depends(_get_user_id)):
    return {"message": "Futures trading coming soon"}
