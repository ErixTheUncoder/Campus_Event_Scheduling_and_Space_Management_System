from sqlalchemy import create_engine, text
from dotenv import load_dotenv
import os

# Load variables from .env
load_dotenv()

# Get DATABASE_URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL not found in .env")

# Create engine
engine = create_engine(DATABASE_URL)

# Test connection
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT now();"))
        print("✅ Connection successful!")
        print("Server time:", result.scalar())
except Exception as e:
    print("❌ Connection failed")
    print(e)
