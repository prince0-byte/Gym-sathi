"""Run once after deploy: python scripts/create_admin.py"""
import asyncio, sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.gym import Gym, GymRole, SubscriptionStatus, WhatsappMode
from app.auth.jwt import hash_password

async def main():
    async with AsyncSessionLocal() as db:
        existing = (await db.execute(select(Gym).where(Gym.role == GymRole.admin))).scalar_one_or_none()
        if existing:
            print(f"Admin already exists: {existing.username}")
            return
        print("=== Create GymSathi Admin ===")
        name       = input("Platform Name: ").strip()
        owner_name = input("Admin Name: ").strip()
        phone_raw  = input("Phone (10 digits): ").strip()
        city       = input("City: ").strip()
        username   = input("Username: ").strip()
        password   = input("Password (min 6 chars): ").strip()
        phone      = "91" + phone_raw if len(phone_raw) == 10 else phone_raw
        db.add(Gym(name=name, owner_name=owner_name, phone=phone, city=city,
                   username=username, password=hash_password(password),
                   role=GymRole.admin, subscription_status=SubscriptionStatus.active,
                   whatsapp_mode=WhatsappMode.admin, is_active=True))
        await db.commit()
        print(f"Admin created: {username}")

if __name__ == "__main__":
    asyncio.run(main())
