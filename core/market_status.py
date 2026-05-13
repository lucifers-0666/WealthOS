"""
core/market_status.py
Real-time NSE/BSE Indian market session engine.
Timezone-aware. Handles pre-open, open, after-hours, weekends, and NSE holidays.
"""

from datetime import datetime, time, date, timedelta
from zoneinfo import ZoneInfo
from enum import Enum
from typing import Optional

IST = ZoneInfo("Asia/Kolkata")


class MarketSession(str, Enum):
    PRE_OPEN   = "pre_open"
    OPEN       = "open"
    CLOSED     = "closed"
    AFTER_HOURS = "after_hours"


# NSE observed holidays 2025-2026
# Source: NSE India official holiday calendar
NSE_HOLIDAYS: set[date] = {
    # 2025
    date(2025, 1, 26),   # Republic Day
    date(2025, 2, 26),   # Mahashivratri
    date(2025, 3, 14),   # Holi
    date(2025, 3, 31),   # Id-ul-Fitr (Ramzan Eid)
    date(2025, 4, 10),   # Shri Ram Navami
    date(2025, 4, 14),   # Dr. Baba Saheb Ambedkar Jayanti
    date(2025, 4, 18),   # Good Friday
    date(2025, 5, 1),    # Maharashtra Day
    date(2025, 8, 15),   # Independence Day
    date(2025, 8, 27),   # Ganesh Chaturthi
    date(2025, 10, 2),   # Mahatma Gandhi Jayanti
    date(2025, 10, 2),   # Dussehra
    date(2025, 10, 24),  # Diwali Laxmi Puja (Muhurat Trading only)
    date(2025, 11, 5),   # Prakash Gurpurb
    date(2025, 12, 25),  # Christmas
    # 2026
    date(2026, 1, 26),   # Republic Day
    date(2026, 3, 20),   # Holi
    date(2026, 3, 30),   # Eid ul-Fitr
    date(2026, 4, 3),    # Good Friday
    date(2026, 4, 14),   # Dr. Baba Saheb Ambedkar Jayanti
    date(2026, 4, 17),   # Shri Ram Navami
    date(2026, 5, 1),    # Maharashtra Day
    date(2026, 8, 15),   # Independence Day
    date(2026, 8, 20),   # Janmashtami
    date(2026, 9, 18),   # Ganesh Chaturthi
    date(2026, 10, 2),   # Mahatma Gandhi Jayanti
    date(2026, 10, 20),  # Dussehra
    date(2026, 11, 12),  # Diwali Laxmi Puja
    date(2026, 11, 25),  # Guru Nanak Jayanti
    date(2026, 12, 25),  # Christmas
}

# Session boundaries (IST)
PRE_OPEN_START = time(9, 0)
PRE_OPEN_END   = time(9, 15)
MARKET_OPEN    = time(9, 15)
MARKET_CLOSE   = time(15, 30)
AFTER_HOURS_END = time(16, 0)  # post-closing session ends


def _is_trading_day(d: date) -> bool:
    """Returns True if d is a weekday and not an NSE holiday."""
    if d.weekday() >= 5:  # 5=Saturday, 6=Sunday
        return False
    return d not in NSE_HOLIDAYS


def get_market_status() -> dict:
    """
    Returns the current NSE market session status.

    Returns:
        {
            session: str          # 'open' | 'pre_open' | 'after_hours' | 'closed'
            label: str            # Human-readable label
            is_open: bool         # True only during live trading session
            current_time_ist: str # HH:MM:SS IST
            current_date_ist: str # YYYY-MM-DD
            next_open: str | None # ISO datetime of next market open (IST)
            exchange: str         # 'NSE/BSE'
            timezone: str         # 'Asia/Kolkata'
        }
    """
    now = datetime.now(IST)
    today = now.date()
    current_time = now.time().replace(second=0, microsecond=0)

    session: MarketSession
    is_trading = _is_trading_day(today)

    if not is_trading:
        session = MarketSession.CLOSED
    elif PRE_OPEN_START <= current_time < PRE_OPEN_END:
        session = MarketSession.PRE_OPEN
    elif PRE_OPEN_END <= current_time <= MARKET_CLOSE:
        session = MarketSession.OPEN
    elif MARKET_CLOSE < current_time <= AFTER_HOURS_END:
        session = MarketSession.AFTER_HOURS
    else:
        session = MarketSession.CLOSED

    label_map = {
        MarketSession.OPEN:        "Markets Open",
        MarketSession.PRE_OPEN:    "Pre-Market",
        MarketSession.AFTER_HOURS: "After Hours",
        MarketSession.CLOSED:      "Markets Closed",
    }

    next_open = _next_open_datetime(now)
    next_open_str = next_open.isoformat() if next_open else None

    return {
        "session":          session.value,
        "label":            label_map[session],
        "is_open":          session == MarketSession.OPEN,
        "current_time_ist": now.strftime("%H:%M:%S"),
        "current_date_ist": today.isoformat(),
        "day_of_week":      now.strftime("%A"),
        "is_holiday":       today in NSE_HOLIDAYS,
        "next_open":        next_open_str,
        "next_open_label":  _next_open_label(next_open),
        "exchange":         "NSE / BSE",
        "timezone":         "Asia/Kolkata (IST)",
    }


def _next_open_datetime(now: datetime) -> Optional[datetime]:
    """Calculate the next market open datetime in IST."""
    today = now.date()
    current_time = now.time()

    # If today is a trading day and market hasn't opened yet
    if _is_trading_day(today) and current_time < MARKET_OPEN:
        return datetime.combine(today, MARKET_OPEN).replace(tzinfo=IST)

    # Find next trading day
    next_day = today + timedelta(days=1)
    for _ in range(14):  # look up to 14 days ahead (covers long holiday stretches)
        if _is_trading_day(next_day):
            return datetime.combine(next_day, MARKET_OPEN).replace(tzinfo=IST)
        next_day += timedelta(days=1)

    return None


def _next_open_label(next_open: Optional[datetime]) -> str:
    if not next_open:
        return "Unknown"
    now = datetime.now(IST)
    delta = next_open - now
    total_seconds = int(delta.total_seconds())
    if total_seconds <= 0:
        return "Now"
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    if hours > 0:
        return f"Opens in {hours}h {minutes}m"
    return f"Opens in {minutes}m"
