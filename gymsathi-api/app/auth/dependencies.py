from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.auth.jwt import decode_access_token
from app.database import get_db
from app.models.gym import Gym

bearer = HTTPBearer()

async def get_current_gym(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: AsyncSession = Depends(get_db),
) -> Gym:
    payload = decode_access_token(creds.credentials)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Invalid or expired token",
                            headers={"WWW-Authenticate": "Bearer"})
    result = await db.execute(select(Gym).where(Gym.id == int(payload["sub"])))
    gym = result.scalar_one_or_none()
    if not gym or not gym.is_active:
        raise HTTPException(status_code=401, detail="Account not found")
    return gym

async def require_admin(gym: Gym = Depends(get_current_gym)) -> Gym:
    if gym.role.value != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return gym

async def require_owner(gym: Gym = Depends(get_current_gym)) -> Gym:
    if gym.role.value != "owner":
        raise HTTPException(status_code=403, detail="Owner access required")
    return gym

async def require_active_owner(gym: Gym = Depends(require_owner)) -> Gym:
    if gym.subscription_status.value == "expired":
        raise HTTPException(status_code=402, detail="Subscription expired. Please renew.")
    return gym
