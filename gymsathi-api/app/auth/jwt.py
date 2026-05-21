from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def _make_token(data: dict, expires: timedelta) -> str:
    payload = {**data, "exp": datetime.now(timezone.utc) + expires}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_access_token(gym_id: int, role: str) -> str:
    return _make_token({"sub": str(gym_id), "role": role, "type": "access"},
                       timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))

def create_refresh_token(gym_id: int) -> str:
    return _make_token({"sub": str(gym_id), "type": "refresh"},
                       timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))

def decode_access_token(token: str) -> Optional[dict]:
    try:
        p = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return p if p.get("type") == "access" else None
    except JWTError:
        return None

def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        p = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return p if p.get("type") == "refresh" else None
    except JWTError:
        return None
