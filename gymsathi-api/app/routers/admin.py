from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
from app.database import get_db
from app.auth.dependencies import require_admin
from app.auth.jwt import hash_password
from app.models.gym import Gym, SubscriptionStatus
from app.models.member import Member
from app.schemas import (GymCreate, GymOut, GymRenewRequest, AdminDashboardOut,
                          WhatsappConfigUpdate, MessageResponse)
from app.services.subscription_service import get_admin_dashboard, renew_subscription, sync_subscription_statuses
from app.services.date_utils import days_until_expiry, today_str

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard", response_model=AdminDashboardOut)
async def dashboard(db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    return AdminDashboardOut(**(await get_admin_dashboard(db)))

@router.post("/owners", response_model=GymOut)
async def create_owner(body: GymCreate, db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    if (await db.execute(select(Gym).where(Gym.username == body.username))).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Username already taken")
    expiry = body.subscription_expiry or (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d")
    g = Gym(name=body.name, owner_name=body.owner_name, phone=body.phone, city=body.city,
            username=body.username, password=hash_password(body.password), role="owner",
            subscription_plan=body.subscription_plan, subscription_expiry=expiry,
            subscription_status=SubscriptionStatus.active, whatsapp_mode=body.whatsapp_mode,
            whatsapp_number=body.whatsapp_number, whatsapp_api_key=body.whatsapp_api_key,
            whatsapp_app_name=body.whatsapp_app_name)
    db.add(g)
    await db.commit()
    await db.refresh(g)
    return g

@router.get("/owners", response_model=list[GymOut])
async def list_owners(db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    await sync_subscription_statuses(db)
    result = await db.execute(select(Gym).where(Gym.role == "owner").order_by(Gym.created_at.desc()))
    return result.scalars().all()

@router.get("/owners/{gym_id}", response_model=GymOut)
async def get_owner(gym_id: int, db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    gym = (await db.execute(select(Gym).where(Gym.id == gym_id, Gym.role == "owner"))).scalar_one_or_none()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    return gym

@router.post("/owners/{gym_id}/renew", response_model=MessageResponse)
async def renew_owner_sub(gym_id: int, body: GymRenewRequest, db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    result = await renew_subscription(db, gym_id, body.plan_type, admin.id)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("error", "Renewal failed"))
    return MessageResponse(message=f"Subscription renewed until {result['new_expiry']}")

@router.delete("/owners/{gym_id}", response_model=MessageResponse)
async def delete_owner(gym_id: int, db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    if gym_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete admin account")
    gym = (await db.execute(select(Gym).where(Gym.id == gym_id, Gym.role == "owner"))).scalar_one_or_none()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    await db.delete(gym)
    await db.commit()
    return MessageResponse(message=f"Gym '{gym.name}' deleted")

@router.get("/expiring-gyms")
async def expiring_gyms(db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    await sync_subscription_statuses(db)
    gyms = (await db.execute(select(Gym).where(Gym.role == "owner"))).scalars().all()
    return [{"id": g.id, "name": g.name, "phone": g.phone, "expiry": g.subscription_expiry, "days_left": days_until_expiry(g.subscription_expiry)}
            for g in gyms if g.subscription_expiry and 0 <= (days_until_expiry(g.subscription_expiry) or 999) <= 5]

@router.get("/expired-members-today")
async def expired_today(db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    today = today_str()
    rows = (await db.execute(select(Gym.id, Gym.name, Member.name, Member.phone)
        .join(Member, Member.gym_id == Gym.id).where(Member.expiry_date == today, Gym.role == "owner"))).all()
    grouped: dict = {}
    for gid, gname, mname, mphone in rows:
        if gid not in grouped:
            grouped[gid] = {"gym_name": gname, "members": []}
        grouped[gid]["members"].append({"name": mname, "phone": mphone})
    return list(grouped.values())

@router.put("/owners/{gym_id}/whatsapp", response_model=MessageResponse)
async def update_whatsapp(gym_id: int, body: WhatsappConfigUpdate, db: AsyncSession = Depends(get_db), admin: Gym = Depends(require_admin)):
    gym = (await db.execute(select(Gym).where(Gym.id == gym_id))).scalar_one_or_none()
    if not gym:
        raise HTTPException(status_code=404, detail="Gym not found")
    gym.whatsapp_mode = body.whatsapp_mode; gym.whatsapp_number = body.whatsapp_number
    gym.whatsapp_api_key = body.whatsapp_api_key; gym.whatsapp_app_name = body.whatsapp_app_name
    await db.commit()
    return MessageResponse(message="WhatsApp config updated")
