import os
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.member import Member, MemberStatus
from app.models.gym import Gym
from app.services.date_utils import indian_to_iso
from app.services.whatsapp_service import send_whatsapp_message

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CREDENTIALS_PATH = os.path.join(BASE_DIR, "credentials.json")

async def sync_google_sheet(db: AsyncSession, gym_id: int, sheet_url: str) -> dict:
    try:
        import gspread
        from oauth2client.service_account import ServiceAccountCredentials
    except ImportError:
        return {"error": "gspread not installed"}
    if not os.path.exists(CREDENTIALS_PATH):
        return {"error": "credentials.json not found"}
    scope  = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]
    creds  = ServiceAccountCredentials.from_json_keyfile_name(CREDENTIALS_PATH, scope)
    client = gspread.authorize(creds)
    records = client.open_by_url(sheet_url).sheet1.get_all_records()
    added, skipped = 0, 0
    for row in records:
        name      = str(row.get("name", "")).strip()
        phone_raw = str(row.get("phone", "")).strip()
        plan_name = str(row.get("plan_name", "monthly")).strip() or "monthly"
        if not name or not phone_raw or not phone_raw.isdigit() or len(phone_raw) != 10:
            skipped += 1
            continue
        phone = "91" + phone_raw
        expiry_date = indian_to_iso(str(row.get("expiry_date", "")).strip())
        if not expiry_date:
            skipped += 1
            continue
        join_raw  = str(row.get("join_date", "")).strip()
        join_date = indian_to_iso(join_raw) if join_raw else (
            (datetime.strptime(expiry_date, "%Y-%m-%d") - timedelta(days=30)).strftime("%Y-%m-%d"))
        try:
            fees_amount = float(row.get("fees_amount", 1000))
        except Exception:
            fees_amount = 1000.0
        existing = (await db.execute(select(Member).where(Member.phone == phone, Member.gym_id == gym_id))).scalar_one_or_none()
        if existing:
            old_expiry = existing.expiry_date
            existing.name = name; existing.plan_name = plan_name
            existing.join_date = join_date; existing.expiry_date = expiry_date; existing.fees_amount = fees_amount
            await db.commit()
            if old_expiry and expiry_date > old_expiry and existing.last_renewal_notified != expiry_date:
                msg = f"Membership Renewed!\nHi {name},\nValid Till: {expiry_date}\nKeep training! 💪"
                await send_whatsapp_message(db, gym_id, phone, msg)
                existing.last_renewal_notified = expiry_date
                await db.commit()
        else:
            db.add(Member(gym_id=gym_id, name=name, phone=phone, plan_name=plan_name,
                          join_date=join_date, expiry_date=expiry_date, fees_amount=fees_amount, status=MemberStatus.active))
            await db.commit()
        added += 1
    return {"added_or_updated": added, "skipped": skipped}

async def save_sheet_url(db: AsyncSession, gym_id: int, sheet_url: str) -> bool:
    gym = (await db.execute(select(Gym).where(Gym.id == gym_id))).scalar_one_or_none()
    if not gym:
        return False
    gym.sheet_url = sheet_url
    await db.commit()
    return True

async def get_sheet_url(db: AsyncSession, gym_id: int):
    gym = (await db.execute(select(Gym).where(Gym.id == gym_id))).scalar_one_or_none()
    return gym.sheet_url if gym else None
