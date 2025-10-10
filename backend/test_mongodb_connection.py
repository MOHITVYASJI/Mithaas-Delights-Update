#!/usr/bin/env python3
"""
MongoDB Atlas Connection Test Script
Tests connection to MongoDB Atlas and verifies database setup
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

async def test_connection():
    """Test MongoDB Atlas connection"""
    print("=" * 60)
    print("🔍 Testing MongoDB Atlas Connection...")
    print("=" * 60)
    
    try:
        # Get MongoDB URL from environment
        mongo_url = os.environ.get('MONGO_URL')
        db_name = os.environ.get('DB_NAME')
        
        if not mongo_url:
            print("❌ ERROR: MONGO_URL not found in .env file")
            return False
        
        print(f"\n📡 Connecting to MongoDB Atlas...")
        print(f"📊 Database: {db_name}")
        
        # Create client
        client = AsyncIOMotorClient(mongo_url, serverSelectionTimeoutMS=5000)
        
        # Test connection with ping
        await client.admin.command('ping')
        print("✅ Successfully connected to MongoDB Atlas!")
        
        # Get database
        db = client[db_name]
        
        # List collections
        collections = await db.list_collection_names()
        print(f"\n📁 Collections in database ({len(collections)}):")
        if collections:
            for col in collections:
                count = await db[col].count_documents({})
                print(f"   - {col}: {count} documents")
        else:
            print("   - No collections yet (empty database)")
        
        # Test write operation
        print(f"\n🧪 Testing write operation...")
        test_doc = {"test": "connection", "timestamp": "test"}
        result = await db.test_collection.insert_one(test_doc)
        print(f"✅ Write test successful! Inserted ID: {result.inserted_id}")
        
        # Clean up test document
        await db.test_collection.delete_one({"_id": result.inserted_id})
        print(f"🧹 Cleaned up test document")
        
        print("\n" + "=" * 60)
        print("✅ MongoDB Atlas Connection Test PASSED!")
        print("=" * 60)
        print("\n💡 Your database is ready for deployment!")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Connection Failed!")
        print(f"Error: {str(e)}")
        print("\n🔧 Troubleshooting:")
        print("   1. Check MongoDB Atlas Network Access (whitelist 0.0.0.0/0)")
        print("   2. Verify credentials in MONGO_URL")
        print("   3. Ensure cluster is running")
        return False
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    asyncio.run(test_connection())
