#!/usr/bin/env python3
"""
Script pour initialiser les jours fériés français 2024-2027 dans MongoDB
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# French holidays 2024-2027
FRENCH_HOLIDAYS = [
    # 2024
    {"date": "2024-01-01", "name": "Jour de l'An"},
    {"date": "2024-04-01", "name": "Lundi de Pâques"},
    {"date": "2024-05-01", "name": "Fête du Travail"},
    {"date": "2024-05-08", "name": "Victoire 1945"},
    {"date": "2024-05-09", "name": "Jeudi de l'Ascension"},
    {"date": "2024-05-20", "name": "Lundi de Pentecôte"},
    {"date": "2024-07-14", "name": "Fête nationale"},
    {"date": "2024-08-15", "name": "Assomption"},
    {"date": "2024-11-01", "name": "Toussaint"},
    {"date": "2024-11-11", "name": "Armistice 1918"},
    {"date": "2024-12-25", "name": "Noël"},
    
    # 2025
    {"date": "2025-01-01", "name": "Jour de l'An"},
    {"date": "2025-04-21", "name": "Lundi de Pâques"},
    {"date": "2025-05-01", "name": "Fête du Travail"},
    {"date": "2025-05-08", "name": "Victoire 1945"},
    {"date": "2025-05-29", "name": "Jeudi de l'Ascension"},
    {"date": "2025-06-09", "name": "Lundi de Pentecôte"},
    {"date": "2025-07-14", "name": "Fête nationale"},
    {"date": "2025-08-15", "name": "Assomption"},
    {"date": "2025-11-01", "name": "Toussaint"},
    {"date": "2025-11-11", "name": "Armistice 1918"},
    {"date": "2025-12-25", "name": "Noël"},
    
    # 2026
    {"date": "2026-01-01", "name": "Jour de l'An"},
    {"date": "2026-04-06", "name": "Lundi de Pâques"},
    {"date": "2026-05-01", "name": "Fête du Travail"},
    {"date": "2026-05-08", "name": "Victoire 1945"},
    {"date": "2026-05-14", "name": "Jeudi de l'Ascension"},
    {"date": "2026-05-25", "name": "Lundi de Pentecôte"},
    {"date": "2026-07-14", "name": "Fête nationale"},
    {"date": "2026-08-15", "name": "Assomption"},
    {"date": "2026-11-01", "name": "Toussaint"},
    {"date": "2026-11-11", "name": "Armistice 1918"},
    {"date": "2026-12-25", "name": "Noël"},
    
    # 2027
    {"date": "2027-01-01", "name": "Jour de l'An"},
    {"date": "2027-03-29", "name": "Lundi de Pâques"},
    {"date": "2027-05-01", "name": "Fête du Travail"},
    {"date": "2027-05-08", "name": "Victoire 1945"},
    {"date": "2027-05-06", "name": "Jeudi de l'Ascension"},
    {"date": "2027-05-17", "name": "Lundi de Pentecôte"},
    {"date": "2027-07-14", "name": "Fête nationale"},
    {"date": "2027-08-15", "name": "Assomption"},
    {"date": "2027-11-01", "name": "Toussaint"},
    {"date": "2027-11-11", "name": "Armistice 1918"},
    {"date": "2027-12-25", "name": "Noël"},
]

async def seed_holidays():
    """Initialize holidays in MongoDB"""
    mongo_url = os.environ['MONGO_URL']
    db_name = os.environ['DB_NAME']
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    try:
        print(f"Connecting to MongoDB: {db_name}")
        
        # Clear existing holidays
        result = await db.business_hours_holidays.delete_many({})
        print(f"✓ Cleared {result.deleted_count} existing holidays")
        
        # Insert new holidays
        result = await db.business_hours_holidays.insert_many(
            [{"date": h["date"], "name": h["name"], "isClosed": True} for h in FRENCH_HOLIDAYS]
        )
        print(f"✓ Inserted {len(result.inserted_ids)} holidays")
        
        # Verify
        count = await db.business_hours_holidays.count_documents({})
        print(f"✓ Total holidays in DB: {count}")
        
        # Show some examples
        examples = await db.business_hours_holidays.find({}).sort("date", 1).limit(5).to_list(5)
        print("\nExamples:")
        for h in examples:
            print(f"  {h['date']}: {h['name']}")
        
        print("\n✅ Holiday seeding completed successfully!")
        
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(seed_holidays())
