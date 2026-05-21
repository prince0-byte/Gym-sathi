"""Run once after deploy: python scripts/create_admin.py"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.gym import Gym, GymRole, SubscriptionStatus, WhatsappMode
from app.auth.jwt import hash_password


async def main():
    async with AsyncSessionLocal() as db:

        # Check if admin already exists
        existing = (
            await db.execute(
                select(Gym).where(Gym.role == GymRole.admin)
            )
        ).scalar_one_or_none()

        if existing:
            print(f"Admin already exists: {existing.username}")
            return

        print("=== Creating Default GymSathi Admin ===")

        # Default Admin Credentials
        name = "GymSathi"
        owner_name = "Prince Rathi"
        phone = "917060000406"
        city = "Saharanpur"
        username = "prince1"
        password = "@18Minshu"

        # Create Admin
        admin = Gym(
            name=name,
            owner_name=owner_name,
            phone=phone,
            city=city,
            username=username,
            password=hash_password(password),
            role=GymRole.admin,
            subscription_status=SubscriptionStatus.active,
            whatsapp_mode=WhatsappMode.admin,
            is_active=True
        )

        db.add(admin)
        await db.commit()

        print("===================================")
        print("✅ Admin created successfully!")
        print(f"👤 Username: {username}")
        print(f"🔑 Password: {password}")
        print("===================================")


if __name__ == "__main__":
    asyncio.run(main())