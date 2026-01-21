from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///instance/dev.db")
engine = create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT user_id, full_name, user_role, email FROM users"))
        users = result.fetchall()
        
        if not users:
            print("No users found in database")
        else:
            print(f"Found {len(users)} users:")
            for user in users:
                print(f"  ID: {user[0]}, Name: {user[1]}, Role: {user[2]}, Email: {user[3]}")
except Exception as e:
    print("Error:", e)
