from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.database import DATABASE_URL

def verify_admin():
    engine = create_engine(DATABASE_URL)
    Session = sessionmaker(bind=engine)
    session = Session()

    print("Checking 'users' table schema...")
    with engine.connect() as conn:
        result = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'"))
        columns = [row[0] for row in result]
        print(f"Columns in users table: {columns}")
        
        if 'role' in columns:
            print("✅ 'role' column exists.")
        else:
            print("❌ 'role' column MISSING!")

    print("\nChecking for admin user...")
    admin = session.query(User).filter(User.email == "admin").first()
    if admin:
        print(f"✅ Admin user found: {admin.email}")
        print(f"   Role: {admin.role}")
        print(f"   Is Active: {admin.is_active}")
        print(f"   Password Hash starts with: {admin.password_hash[:10]}...")
    else:
        print("❌ Admin user NOT found! Attempting to create...")
        from app.utils.security import get_password_hash
        admin = User(
            email="admin",
            phone="0000000000",
            password_hash=get_password_hash("admin123"),
            full_name="Administrator",
            role="admin",
            is_active=True
        )
        session.add(admin)
        session.commit()
        print("✅ Admin user created successfully (admin/admin123)")
    
    session.close()

if __name__ == "__main__":
    verify_admin()
