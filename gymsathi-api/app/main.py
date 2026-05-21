from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.config import settings
from app.database import AsyncSessionLocal
from app.routers import auth, admin, owner
from app.models.gym import Gym, GymRole, SubscriptionStatus

scheduler = AsyncIOScheduler()


async def run_daily_jobs():
    async with AsyncSessionLocal() as db:
        try:
            from app.services.subscription_service import (
                run_subscription_reminder_engine,
                send_daily_admin_summary,
                send_expired_list_all_owners
            )

            admin_gym = (
                await db.execute(
                    select(Gym).where(Gym.role == GymRole.admin)
                )
            ).scalar_one_or_none()

            if not admin_gym:
                print("No admin account found")
                return

            await run_subscription_reminder_engine(
                db,
                admin_gym.id
            )

            await send_daily_admin_summary(
                db,
                admin_gym.id,
                admin_gym.phone
            )

            await send_expired_list_all_owners(
                db,
                admin_gym.id
            )

            print("Daily jobs completed")

        except Exception as e:
            print(f"Daily job error: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):

    scheduler.add_job(
        run_daily_jobs,
        "cron",
        hour=9,
        minute=0,
        id="daily_jobs"
    )

    scheduler.start()

    yield

    scheduler.shutdown()


app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="GymSathi SaaS API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(owner.router)


@app.get("/", tags=["Health"])
async def root():
    return {
        "status": "ok",
        "app": settings.APP_NAME
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy"
    }


# ====================================
# TEMP ADMIN CREATE ROUTE
# ====================================

@app.get("/create-admin")
async def create_admin():

    async with AsyncSessionLocal() as db:

        try:

            existing_admin = (
                await db.execute(
                    select(Gym).where(Gym.role == GymRole.admin)
                )
            ).scalar_one_or_none()

            if existing_admin:
                return {
                    "message": "Admin already exists"
                }

            admin = Gym(
                name="GymSathi",
                owner_name="Prince Rathi",
                phone="7060000406",
                city="Saharanpur",
                username="admin",
                password="@18Minshu",
                role=GymRole.admin,
                subscription_status=SubscriptionStatus.active,
                is_active=True
            )

            db.add(admin)

            await db.commit()

            await db.refresh(admin)

            return {
                "message": "Admin created successfully",
                "username": "admin",
                "password": "@18Minshu"
            }

        except Exception as e:

            await db.rollback()

            return {
                "error": str(e)
            }