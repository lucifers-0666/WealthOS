"""
WealthOS Database Package
Exports the most commonly used helpers for easy importing.
"""

from database.supabase_client import get_supabase, get_supabase_service
from database.crud import (
    # Holdings
    get_holdings,
    get_portfolio_summary,
    upsert_holding,
    bulk_upsert_holdings,
    delete_holding,
    holdings_to_dataframe,
    # Transactions
    get_transactions,
    add_transaction,
    bulk_add_transactions,
    transactions_to_dataframe,
    # Prices
    get_cached_prices,
    upsert_prices,
    is_price_stale,
    # Target allocation
    get_target_allocation,
    set_target_allocation,
    # AI
    save_message,
    get_conversation_history,
    # Watchlist
    get_watchlist,
    add_to_watchlist,
    remove_from_watchlist,
    # Uploads
    create_upload_session,
    update_upload_session,
    # Profiles
    get_or_create_profile,
    update_profile,
    get_profile_preferences,
    update_profile_preferences,
    create_user_activity,
    get_user_activity,
    get_profile_metrics,
)

__all__ = [
    "get_supabase", "get_supabase_service",
    "get_holdings", "get_portfolio_summary", "upsert_holding", "bulk_upsert_holdings",
    "delete_holding", "holdings_to_dataframe",
    "get_transactions", "add_transaction", "bulk_add_transactions", "transactions_to_dataframe",
    "get_cached_prices", "upsert_prices", "is_price_stale",
    "get_target_allocation", "set_target_allocation",
    "save_message", "get_conversation_history",
    "get_watchlist", "add_to_watchlist", "remove_from_watchlist",
    "create_upload_session", "update_upload_session",
    "get_or_create_profile", "update_profile",
    "get_profile_preferences", "update_profile_preferences",
    "create_user_activity", "get_user_activity", "get_profile_metrics",
]
