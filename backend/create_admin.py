#!/usr/bin/env python3
"""
Admin User Creation Script
Creates an admin user in MongoDB Atlas for managing the store
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from auth_utils import get_password_hash
import uuid
from datetime import datetime, timezone
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def create_admin():
    """Create admin user in MongoDB"""
    print("=" * 60)
    print("👤 Creating Admin User...")
    print("=" * 60)
    
    try:
        # Get MongoDB credentials
        mongo_url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        
        if not mongo_url or not db_name:
            print("❌ ERROR: MONGO_URL or DB_NAME not found in .env")
            return False
        
        # Connect to MongoDB
        print(f"\n📡 Connecting to {db_name}...")
        client = AsyncIOMotorClient(mongo_url)
        db = client[db_name]
        
        # Check if admin already exists
        existing_admin = await db.users.find_one({"email": "admin@mithaas.com"})
        if existing_admin:
            print("⚠️  Admin user already exists!")
            print(f"   Email: admin@mithaas.com")
            return True
        
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "name": "Admin",
            "email": "admin@mithaas.com",
            "hashed_password": get_password_hash("admin123"),
            "role": "admin",
            "phone": "+918989549544",
            "addresses": [],
            "wishlist": [],
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        result = await db.users.insert_one(admin_user)
        
        print("\n✅ Admin user created successfully!")
        print("\n📧 Login Credentials:")
        print("   Email: admin@mithaas.com")
        print("   Password: admin123")
        print("\n⚠️  IMPORTANT: Change password after first login!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Failed to create admin user!")
        print(f"Error: {str(e)}")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(create_admin())
