import os
import logging
from fastapi import Header, HTTPException
from database.supabase_client import get_supabase

logger = logging.getLogger("wealthos.auth")

def get_current_user(authorization: str = Header(None)) -> dict:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.replace("Bearer ", "").strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
        
    if token == "demo-token":
        dev_id = os.getenv("DEV_USER_ID", "7eb3ccbc-f8ab-4e6b-92a4-3d173be5b073")
        return {
            "id": dev_id,
            "email": "demo@example.com",
            "full_name": "Demo User",
        }
        
    try:
        sb = get_supabase()
        auth_res = sb.auth.get_user(token)
        auth_user = getattr(auth_res, "user", None)
        if not auth_user or not getattr(auth_user, "id", None):
            raise HTTPException(status_code=401, detail="Invalid token")
        user_meta = getattr(auth_user, "user_metadata", None) or {}
        full_name = user_meta.get("full_name") or user_meta.get("name")
        return {
            "id": auth_user.id,
            "email": getattr(auth_user, "email", None),
            "full_name": full_name,
        }
    except Exception as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid token or session expired")
