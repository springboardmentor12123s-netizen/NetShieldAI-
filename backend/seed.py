# this wd hash the admin password
from database.postgres import SessionLocal, User
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def seed_admin():
    db = SessionLocal()
    
    # Check if admin already exists
    existing_user = db.query(User).filter(User.email == "admin@netshield.com").first()
    if existing_user:
        print("Admin user already exists in the database!")
        db.close()
        return

    # Create the initial admin user
    hashed_pwd = pwd_context.hash("admin123")
    admin_user = User(
        username="admin@netshield.com",
        hashed_password=hashed_pwd,
        role="Administrator"
    )
    
    db.add(admin_user)
    db.commit()
    print("Success: Admin user seeded into PostgreSQL!")
    db.close()

if __name__ == "__main__":
    seed_admin()