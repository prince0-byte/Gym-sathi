from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.gym import Gym, SubscriptionStatus
from app.auth.jwt import verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.services.date_utils import days_until_expiry
from app.schemas import LoginRequest, TokenResponse, RefreshRequest

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Gym).where(Gym.username == body.username))
    gym = result.scalar_one_or_none()
    if not gym or not verify_password(body.password, gym.password):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not gym.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    sub_status = "active"
    if gym.role.value == "owner" and gym.subscription_expiry:
        days = days_until_expiry(gym.subscription_expiry)
        if days is not None and days <= 0:
            sub_status = "expired"
            gym.subscription_status = SubscriptionStatus.expired
            await db.commit()
    return TokenResponse(
        access_token=create_access_token(gym.id, gym.role.value),
        refresh_token=create_refresh_token(gym.id),
        role=gym.role.value, gym_id=gym.id,
        gym_name=gym.name, subscription_status=sub_status,
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh(body: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_refresh_token(body.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    result = await db.execute(select(Gym).where(Gym.id == int(payload["sub"])))
    gym = result.scalar_one_or_none()
    if not gym or not gym.is_active:
        raise HTTPException(status_code=401, detail="Account not found")
    return TokenResponse(
        access_token=create_access_token(gym.id, gym.role.value),
        refresh_token=create_refresh_token(gym.id),
        role=gym.role.value, gym_id=gym.id,
        gym_name=gym.name, subscription_status=gym.subscription_status.value,
    )
