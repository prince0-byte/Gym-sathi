import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config import settings
from app.models.gym import Gym
from app.models.other import WhatsappErrorLog

GUPSHUP_URL = "https://api.gupshup.io/wa/api/v1/msg"

async def _log_error(db: AsyncSession, gym_id: int, number: str, error: str):
    db.add(WhatsappErrorLog(gym_id=gym_id, failed_number=number, error_message=error))
    await db.commit()

async def send_whatsapp_message(db: AsyncSession, gym_id: int, to_phone: str, message: str) -> bool:
    result = await db.execute(select(Gym).where(Gym.id == gym_id))
    gym = result.scalar_one_or_none()
    if not gym:
        return False
    use_owner = (gym.whatsapp_mode.value == "self"
                 and gym.whatsapp_number and gym.whatsapp_api_key and gym.whatsapp_app_name)
    num = gym.whatsapp_number   if use_owner else settings.ADMIN_WHATSAPP_NUMBER
    key = gym.whatsapp_api_key  if use_owner else settings.ADMIN_WHATSAPP_API_KEY
    app = gym.whatsapp_app_name if use_owner else settings.ADMIN_WHATSAPP_APP_NAME
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.post(GUPSHUP_URL,
                headers={"apikey": key, "Content-Type": "application/x-www-form-urlencoded"},
                data={"channel": "whatsapp", "source": num, "destination": to_phone,
                      "message": message, "src.name": app})
            if r.status_code == 202:
                return True
            raise Exception(r.text)
        except Exception as e:
            await _log_error(db, gym_id, to_phone, str(e))
            if use_owner:
                try:
                    r2 = await client.post(GUPSHUP_URL,
                        headers={"apikey": settings.ADMIN_WHATSAPP_API_KEY,
                                 "Content-Type": "application/x-www-form-urlencoded"},
                        data={"channel": "whatsapp", "source": settings.ADMIN_WHATSAPP_NUMBER,
                              "destination": to_phone, "message": message,
                              "src.name": settings.ADMIN_WHATSAPP_APP_NAME})
                    if r2.status_code == 202:
                        return True
                    await _log_error(db, gym_id, to_phone, f"Fallback failed: {r2.text}")
                except Exception as fe:
                    await _log_error(db, gym_id, to_phone, f"Fallback error: {fe}")
    return False

async def test_whatsapp_config(api_key: str, app_name: str, sender_number: str, test_number: str) -> bool:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.post(GUPSHUP_URL,
            headers={"apikey": api_key, "Content-Type": "application/x-www-form-urlencoded"},
            data={"channel": "whatsapp", "source": sender_number, "destination": test_number,
                  "message": "GymSathi WhatsApp Test — Working!", "src.name": app_name})
        return r.status_code == 202
