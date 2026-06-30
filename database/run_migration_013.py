import os
import sys
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

def run_migration():
    try:
        import psycopg2
    except ImportError:
        print("psycopg2 is not installed.")
        sys.exit(1)

    db_url = os.getenv("SUPABASE_DB_URL")
    if not db_url:
        print("SUPABASE_DB_URL not found in .env")
        sys.exit(1)

    migration_file = Path(__file__).parent / "migrations" / "013_user_settings_api_keys.sql"
    sql = migration_file.read_text()

    print("Connecting to DB...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Executing 013_user_settings_api_keys.sql...")
    cur.execute(sql)
    
    print("Migration executed successfully.")
    cur.close()
    conn.close()

if __name__ == "__main__":
    run_migration()
