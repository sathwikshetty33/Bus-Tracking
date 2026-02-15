from sqlalchemy import create_engine, text
import os

# PostgreSQL URL from environment or default (matching database.py)
DATABASE_URL = "postgresql://neondb_owner:npg_FJDsUx3kS4fc@ep-polished-cherry-a1a65qyd-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"

def update_db():
    print("🔄 Checking database schema...")
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        try:
            # Check if role column exists
            result = conn.execute(text(
                "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='role'"
            ))
            
            if result.fetchone():
                print("✅ 'role' column already exists in 'users' table")
            else:
                print("🛠️ Adding 'role' column to 'users' table...")
                conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user' NOT NULL"))
                conn.commit()
                print("✅ Successfully added 'role' column")
                
        except Exception as e:
            print(f"❌ Error updating database: {e}")

if __name__ == "__main__":
    update_db()
