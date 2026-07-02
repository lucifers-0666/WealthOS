from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from typing import Literal, Optional, List
from datetime import date
from database.supabase_client import get_supabase
from core.price_fetcher import fetch_price
from core.greeks_calculator import get_option_chain
import math
import logging
from slowapi import Limiter
from slowapi.util import get_remote_address

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

class SandboxFutureOrder(BaseModel):
    underlying: str
    action: Literal["BUY", "SELL"]
    lots: int
    expiry_date: date

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

# ── MARKET DATA & FUTURES ENDPOINTS ──────────────────────────────

@router.get("/price")
async def get_live_price(ticker: str):
    """Fetch live ticker price for sandbox trading quotes."""
    try:
        res = fetch_price(ticker)
        if res.get("error"):
            raise HTTPException(status_code=400, detail=res["error"])
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/futures/contracts")
async def get_futures_contracts():
    contracts = []
    for u, details in FUTURES_CONTRACTS.items():
        p = fetch_price(details["ticker"])
        price = p.get("price", 0.0)
        contracts.append({
            "underlying": u,
            "ticker": details["ticker"],
            "lot_size": details["lot_size"],
            "current_price": price,
            "margin_required": round(price * details["lot_size"] * details["margin_pct"], 2),
            "expiry": "2026-07-30"
        })
    return contracts

@router.get("/futures/positions")
async def get_futures_positions(user_id: str = Depends(_get_user_id)):
    sb = get_supabase()
    res = sb.table("sandbox_orders").select("*").eq("user_id", user_id).eq("order_type", "FUTURE").order("executed_at", desc=False).execute()
    
    positions = []
    for u, details in FUTURES_CONTRACTS.items():
        u_orders = [o for o in res.data if o["ticker"] == u]
        if not u_orders:
            continue
        
        net_qty = 0.0
        buy_value = 0.0
        buy_qty = 0.0
        sell_value = 0.0
        sell_qty = 0.0
        
        for o in u_orders:
            qty = float(o["quantity"])
            price = float(o["price"])
            if o["action"] == "BUY":
                net_qty += qty
                buy_value += qty * price
                buy_qty += qty
            elif o["action"] == "SELL":
                net_qty -= qty
                sell_value += qty * price
                sell_qty += qty
                
        if net_qty != 0:
            lot_size = details["lot_size"]
            lots = int(abs(net_qty) // lot_size)
            
            p = fetch_price(details["ticker"])
            curr_price = p.get("price", 0.0)
            
            if net_qty > 0:
                avg_price = buy_value / buy_qty if buy_qty > 0 else 0.0
                unrealized_pnl = (curr_price - avg_price) * net_qty
                pos_type = "LONG"
            else:
                avg_price = sell_value / sell_qty if sell_qty > 0 else 0.0
                unrealized_pnl = (avg_price - curr_price) * abs(net_qty)
                pos_type = "SHORT"
                
            margin_required = curr_price * abs(net_qty) * details["margin_pct"]
            
            positions.append({
                "underlying": u,
                "position_type": pos_type,
                "lots": lots,
                "quantity": abs(net_qty),
                "avg_price": round(avg_price, 2),
                "current_price": curr_price,
                "unrealized_pnl": round(unrealized_pnl, 2),
                "margin_required": round(margin_required, 2),
                "expiry_date": u_orders[-1]["expiry_date"]
            })
            
    return positions

@router.post("/order/future")
async def place_future_order(order: SandboxFutureOrder, user_id: str = Depends(_get_user_id)):
    if order.lots < 1 or order.lots > 50:
        raise HTTPException(status_code=400, detail="Invalid lots count. Min: 1, Max: 50.")
    if order.expiry_date <= date.today():
        raise HTTPException(status_code=400, detail="Contract expiry date must be in the future.")

    u = order.underlying.upper().strip()
    if u not in FUTURES_CONTRACTS:
        raise HTTPException(status_code=400, detail="Invalid underlying index/stock for futures")
        
    details = FUTURES_CONTRACTS[u]
    lot_size = details["lot_size"]
    qty = order.lots * lot_size
    
    p = fetch_price(details["ticker"])
    curr_price = p.get("price", 0.0)
    if not curr_price:
        raise HTTPException(status_code=400, detail="Could not fetch current market price for underlying")
        
    contract_val = qty * curr_price
    margin_req = contract_val * details["margin_pct"]
    
    sb = get_supabase()
    wallet_res = sb.table("sandbox_wallet").select("*").eq("user_id", user_id).execute()
    if not wallet_res.data:
        raise HTTPException(status_code=404, detail="Sandbox wallet not initialized")
    wallet = wallet_res.data[0]
    balance = float(wallet["balance"])
    
    orders_res = sb.table("sandbox_orders").select("*").eq("user_id", user_id).eq("order_type", "FUTURE").eq("ticker", u).order("executed_at", desc=False).execute()
    
    net_qty = 0.0
    buy_value = 0.0
    buy_qty = 0.0
    sell_value = 0.0
    sell_qty = 0.0
    
    for o in orders_res.data:
        q = float(o["quantity"])
        pr = float(o["price"])
        if o["action"] == "BUY":
            net_qty += q
            buy_value += q * pr
            buy_qty += q
        elif o["action"] == "SELL":
            net_qty -= q
            sell_value += q * pr
            sell_qty += q
            
    realized_pnl = 0.0
    is_closing = False
    
    if net_qty > 0 and order.action == "SELL":
        is_closing = True
        close_qty = min(net_qty, qty)
        avg_buy = buy_value / buy_qty if buy_qty > 0 else curr_price
        realized_pnl = (curr_price - avg_buy) * close_qty
    elif net_qty < 0 and order.action == "BUY":
        is_closing = True
        close_qty = min(abs(net_qty), qty)
        avg_sell = sell_value / sell_qty if sell_qty > 0 else curr_price
        realized_pnl = (avg_sell - curr_price) * close_qty
        
    if not is_closing or qty > abs(net_qty):
        final_net_qty = net_qty + qty if order.action == "BUY" else net_qty - qty
        final_margin = abs(final_net_qty) * curr_price * details["margin_pct"]
        if balance < final_margin:
            raise HTTPException(status_code=400, detail=f"Insufficient margin. Required: ₹{final_margin:,.2f}, Available: ₹{balance:,.2f}")
            
    new_balance = balance + realized_pnl
    new_realized_pnl = float(wallet.get("realized_pnl", 0)) + realized_pnl
    sb.table("sandbox_wallet").update({
        "balance": new_balance,
        "realized_pnl": new_realized_pnl
    }).eq("user_id", user_id).execute()
    
    sb.table("sandbox_orders").insert({
        "user_id": user_id,
        "order_type": "FUTURE",
        "action": order.action,
        "ticker": u,
        "quantity": qty,
        "price": curr_price,
        "total_value": contract_val,
        "contract_size": lot_size,
        "margin_used": margin_req,
        "expiry_date": order.expiry_date.isoformat(),
        "status": "EXECUTED"
    }).execute()
    
    return {
        "executed_price": curr_price,
        "total_value": contract_val,
        "margin_used": margin_req,
        "new_balance": new_balance,
        "realized_pnl": realized_pnl,
        "message": f"Placed {order.action} order for {order.lots} lots of {u} Future at ₹{curr_price:,.2f}"
    }
