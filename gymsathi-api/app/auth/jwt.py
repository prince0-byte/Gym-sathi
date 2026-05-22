from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
import bcrypt

from app.config import settings


# ====================================
# PASSWORD HASHING
# ====================================

def hash_password(plain: str) -> str:
    password_bytes = plain[:72].encode("utf-8")
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt(rounds=12))
    return hashed.decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        password_bytes = plain[:72].encode("utf-8")
        hashed_bytes = hashed.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


# ====================================
# JWT TOKEN HELPERS
# ====================================

def _make_token(data: dict, expires: timedelta) -> str:
    payload = {
        **data,
        "exp": datetime.now(timezone.utc) + expires
    }
    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )


def create_access_token(gym_id: int, role: str) -> str:
    return _make_token(
        {
            "sub": str(gym_id),
            "role": role,
            "type": "access"
        },
        timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )


def create_refresh_token(gym_id: int) -> str:
    return _make_token(
        {
            "sub": str(gym_id),
            "type": "refresh"
        },
        timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )


def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload if payload.get("type") == "access" else None
    except JWTError:
        return None


def decode_refresh_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload if payload.get("type") == "refresh" else None
    except JWTError:
        return None
