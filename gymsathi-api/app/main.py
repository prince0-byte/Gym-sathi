from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.config import settings
from app.database import AsyncSessionLocal, get_db
from app.routers import auth, admin, owner
from app.models.gym import Gym, GymRole, SubscriptionStatus, WhatsappMode
from app.auth.jwt import hash_password

scheduler = AsyncIOScheduler()

async def run_daily_jobs():
    """Roz 9 AM pe chalti hai - subscription reminders, summary, expired list"""
    async with AsyncSessionLocal() as db:
        try:
            from app.services.subscription_service import (
                run_subscription_reminder_engine, send_daily_admin_summary, send_expired_list_all_owners)

            admin_gym = (await db.execute(select(Gym).where(Gym.role == GymRole.admin))).scalars().first()
            if not admin_gym:
                print("No admin account found")
                return
            await run_subscription_reminder_engine(db, admin_gym.id)
            await send_daily_admin_summary(db, admin_gym.id, admin_gym.phone)
            await send_expired_list_all_owners(db, admin_gym.id)
            print("Daily jobs completed")
        except Exception as e:
            print(f"Daily job error: {e}")

async def run_sheet_sync():
    """Har 30 minute pe chalti hai - sheet sync + renewal WhatsApp message"""
    async with AsyncSessionLocal() as db:
        try:
            from app.services.sheet_service import sync_google_sheet

            owners = (await db.execute(
                select(Gym).where(Gym.role == GymRole.owner)
            )).scalars().all()

            for owner_gym in owners:
                if owner_gym.sheet_url:
                    result = await sync_google_sheet(db, owner_gym.id, owner_gym.sheet_url)
                    print(f"Sheet sync for {owner_gym.name}: {result}")

            print("Sheet sync completed")
        except Exception as e:
            print(f"Sheet sync error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(run_daily_jobs, "cron", hour=9, minute=0, id="daily_jobs")
    scheduler.add_job(run_sheet_sync, "interval", minutes=30, id="sheet_sync")
    scheduler.start()
    yield
    scheduler.shutdown()

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="GymSathi SaaS API",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware, allow_origins=settings.CORS_ORIGINS,
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(owner.router)

@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "app": settings.APP_NAME}

@app.get("/health", tags=["Health"])
async def health():
    return {"status": "healthy"}

@app.get("/check-admin", tags=["Setup"])
async def check_admin(db: AsyncSession = Depends(get_db)):
    """Check all admin accounts in database."""
    try:
        result = await db.execute(select(Gym).where(Gym.role == GymRole.admin))
        admins = result.scalars().all()
        return [{"id": a.id, "username": a.username, "phone": a.phone, "is_active": a.is_active} for a in admins]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/reset-admin-password", tags=["Setup"])
async def reset_admin_password(body: dict, db: AsyncSession = Depends(get_db)):
    """Reset password for a specific admin by username."""
    try:
        username = body.get("username")
        new_password = body.get("password")

        if not username:
            raise HTTPException(status_code=400, detail="'username' required")
        if not new_password:
            raise HTTPException(status_code=400, detail="'password' required")

        result = await db.execute(select(Gym).where(Gym.username == username))
        admin_user = result.scalar_one_or_none()

        if not admin_user:
            raise HTTPException(status_code=404, detail=f"No user found with username '{username}'")

        admin_user.password = hash_password(new_password)
        await db.commit()
        return {"message": f"Password reset for '{username}' successfully!"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/setup", tags=["Setup"])
async def setup_admin(body: dict, db: AsyncSession = Depends(get_db)):
    """One-time admin setup. Automatically disabled once admin exists."""
    try:
        result = await db.execute(select(Gym).where(Gym.role == GymRole.admin))
        existing = result.scalars().first()

        if existing:
            raise HTTPException(
                status_code=403,
                detail=f"Setup already done. Admin '{existing.username}' exists. Use that to login."
            )

        for field in ["username", "password", "name", "owner_name", "city"]:
            if not body.get(field):
                raise HTTPException(status_code=400, detail=f"Field '{field}' required")

        phone = str(body.get("phone", ""))
        if len(phone) == 10:
            phone = "91" + phone

        new_admin = Gym(
            name=body["name"],
            owner_name=body["owner_name"],
            phone=phone,
            city=body["city"],
            username=body["username"],
            password=hash_password(body["password"]),
            role=GymRole.admin,
            subscription_status=SubscriptionStatus.active,
            whatsapp_mode=WhatsappMode.admin,
            is_active=True
        )
        db.add(new_admin)
        await db.commit()
        return {"message": f"Admin '{body['username']}' created successfully!"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
