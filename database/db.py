"""
WealthOS — Database connection manager
Supports both sync (psycopg2) and async (asyncpg) engines.
Use get_db() for FastAPI / background tasks.
Use get_sync_db() for Streamlit pages (sync context).
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager, contextmanager
from typing import AsyncGenerator, Generator

from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, sessionmaker

from database.models import Base

load_dotenv()

# ── Connection URLs ───────────────────────────────────────────────────────────

DATABASE_URL: str = os.getenv(
    "DATABASE_URL",
    "postgresql://wealthos:wealthos@localhost:5432/wealthos",
)

# asyncpg uses postgresql+asyncpg://
ASYNC_DATABASE_URL: str = DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
).replace("postgres://", "postgresql+asyncpg://")

# psycopg2 keeps standard URL
SYNC_DATABASE_URL: str = DATABASE_URL.replace(
    "postgresql+asyncpg://", "postgresql://"
).replace("postgres+asyncpg://", "postgresql://")

# ── Sync Engine (Streamlit) ───────────────────────────────────────────────────

_sync_engine = create_engine(
    SYNC_DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,  # auto-reconnect
    echo=False,
)

SyncSessionLocal = sessionmaker(
    bind=_sync_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@contextmanager
def get_sync_db() -> Generator[Session, None, None]:
    """Context manager for sync Streamlit usage.

    Usage::

        with get_sync_db() as db:
            holdings = db.query(Holding).all()
    """
    db = SyncSessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


# ── Async Engine (FastAPI) ────────────────────────────────────────────────────

_async_engine = create_async_engine(
    ASYNC_DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    echo=False,
)

AsyncSessionLocal = async_sessionmaker(
    bind=_async_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession,
)


@asynccontextmanager
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Async context manager for FastAPI dependency injection.

    Usage::

        async with get_db() as db:
            result = await db.execute(select(Holding))
    """
    async with AsyncSessionLocal() as db:
        try:
            yield db
            await db.commit()
        except Exception:
            await db.rollback()
            raise


# ── FastAPI dependency ────────────────────────────────────────────────────────

async def db_dependency() -> AsyncGenerator[AsyncSession, None]:
    """Use as FastAPI Depends().

    Usage::

        @app.get("/holdings")
        async def get_holdings(db: AsyncSession = Depends(db_dependency)):
            ...
    """
    async with get_db() as db:
        yield db


# ── Schema helpers ────────────────────────────────────────────────────────────

def create_all_tables() -> None:
    """Create all tables synchronously (run once at startup or from CLI)."""
    Base.metadata.create_all(bind=_sync_engine)
    print("[WealthOS] All tables created.")


def drop_all_tables() -> None:
    """Drop all tables — USE WITH CAUTION."""
    Base.metadata.drop_all(bind=_sync_engine)
    print("[WealthOS] All tables dropped.")


def health_check() -> bool:
    """Returns True if the database is reachable."""
    try:
        with _sync_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        print(f"[WealthOS] DB health check failed: {e}")
        return False
