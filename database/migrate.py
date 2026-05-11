#!/usr/bin/env python
"""
WealthOS — Database migration runner
Runs schema.sql against PostgreSQL.
Usage:
    python -m database.migrate          # apply schema
    python -m database.migrate --reset  # drop + recreate (dev only!)
    python -m database.migrate --check  # health check only
"""

import argparse
import os
import sys
from pathlib import Path

import psycopg2
from dotenv import load_dotenv

load_dotenv()

SCHEMA_FILE = Path(__file__).parent / "schema.sql"


def get_connection():
    url = os.getenv("DATABASE_URL", "postgresql://wealthos:wealthos@localhost:5432/wealthos")
    return psycopg2.connect(url)


def run_schema():
    print("[migrate] Applying schema.sql ...")
    sql = SCHEMA_FILE.read_text(encoding="utf-8")
    conn = get_connection()
    conn.autocommit = True
    with conn.cursor() as cur:
        cur.execute(sql)
    conn.close()
    print("[migrate] Schema applied successfully.")


def reset_db():
    print("[migrate] WARNING: Dropping all WealthOS tables ...")
    tables = [
        "ai_messages", "ai_conversations", "news_cache",
        "import_logs", "portfolio_snapshots", "price_history",
        "watchlist", "target_allocations", "transactions",
        "holdings", "assets", "portfolios", "users",
    ]
    conn = get_connection()
    conn.autocommit = True
    with conn.cursor() as cur:
        for t in tables:
            cur.execute(f'DROP TABLE IF EXISTS {t} CASCADE;')
            print(f"  dropped {t}")
    conn.close()
    run_schema()


def health_check():
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()[0]
        conn.close()
        print(f"[migrate] Connected: {version}")
        return True
    except Exception as e:
        print(f"[migrate] Connection failed: {e}")
        return False


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WealthOS DB migrator")
    parser.add_argument("--reset", action="store_true", help="Drop and recreate all tables (DEV only)")
    parser.add_argument("--check", action="store_true", help="Test DB connection only")
    args = parser.parse_args()

    if args.check:
        ok = health_check()
        sys.exit(0 if ok else 1)
    elif args.reset:
        confirm = input("Type YES to confirm full reset: ")
        if confirm == "YES":
            reset_db()
        else:
            print("Aborted.")
    else:
        run_schema()
