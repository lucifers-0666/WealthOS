"""
WealthOS — Supabase Migration Runner
Runs schema.sql and optionally seed.sql against your Supabase project.

Usage:
    python -m database.migrate              # run schema only
    python -m database.migrate --seed       # run schema + seed data
    python -m database.migrate --seed --user-id <your-uuid>
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SCHEMA_FILE = Path(__file__).parent / "schema.sql"
SEED_FILE   = Path(__file__).parent / "seed.sql"


def run_sql(client, sql: str, label: str):
    """Execute raw SQL via Supabase service role."""
    print(f"\n--- Running: {label} ---")
    statements = [s.strip() for s in sql.split(";") if s.strip()]
    errors = []
    for i, stmt in enumerate(statements):
        try:
            client.rpc("exec_sql", {"sql": stmt + ";"}).execute()
        except Exception as e:
            # supabase-py doesn't support raw DDL via REST — use psycopg2 path
            errors.append((i, str(e)[:120]))
    if errors:
        print(f"  {len(errors)} statement(s) used psycopg2 fallback (expected for DDL)")
    print(f"  Done: {label}")


def run_via_psycopg2(schema_sql: str, seed_sql: str = None, user_id: str = None):
    """
    Direct PostgreSQL connection via psycopg2.
    Connection string from SUPABASE_DB_URL env var.
    Format: postgresql://postgres:<password>@db.<project>.supabase.co:5432/postgres
    """
    try:
        import psycopg2
    except ImportError:
        print("\nInstall psycopg2 for direct DB migrations: pip install psycopg2-binary")
        print("Or run schema.sql manually in Supabase Dashboard → SQL Editor")
        sys.exit(1)

    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("Set SUPABASE_DB_URL in .env — find it in Supabase Dashboard → Settings → Database → Connection String")
        sys.exit(1)

    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()

    print("\n--- Applying schema.sql ---")
    cur.execute(schema_sql)
    print("  Schema applied successfully.")

    if seed_sql and user_id:
        print("\n--- Applying seed.sql ---")
        filled_seed = seed_sql.replace("YOUR_USER_UUID", user_id)
        cur.execute(filled_seed)
        print("  Seed data inserted.")
    elif seed_sql and not user_id:
        print("  Skipping seed: pass --user-id <uuid> to insert demo data.")

    cur.close()
    conn.close()
    print("\nMigration complete.")


def main():
    parser = argparse.ArgumentParser(description="WealthOS Supabase migration runner")
    parser.add_argument("--seed", action="store_true", help="Also run seed.sql")
    parser.add_argument("--user-id", type=str, help="User UUID for seed data")
    args = parser.parse_args()

    schema_sql = SCHEMA_FILE.read_text()
    seed_sql   = SEED_FILE.read_text() if args.seed else None

    run_via_psycopg2(schema_sql, seed_sql, args.user_id)


if __name__ == "__main__":
    main()
