from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from app.models.member import Member
from app.models.other import ReminderLog
from app.services.date_utils import days_until_expiry, today_str
from app.services.whatsapp_service import send_whatsapp_message
from app.services.member_service import sync_member_statuses

async def _already_sent(db: AsyncSession, member_id: int, rtype: str) -> bool:
    r = await db.execute(select(ReminderLog).where(
        ReminderLog.member_id == member_id,
        ReminderLog.reminder_type == rtype,
        ReminderLog.reminder_date == today_str()))
    return r.scalar_one_or_none() is not None

async def _log(db: AsyncSession, member_id: int, rtype: str):
    db.add(ReminderLog(member_id=member_id, reminder_date=today_str(), reminder_type=rtype))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()

async def run_reminder_engine(db: AsyncSession, gym_id: int) -> dict:
    await sync_member_statuses(db, gym_id)
    members = (await db.execute(select(Member).where(Member.gym_id == gym_id))).scalars().all()
    sent, skipped = 0, 0
    for m in members:
        days = days_until_expiry(m.expiry_date)
        if days is None:
            continue
        rtype, msg = None, None
        if days == 5:
            rtype = "before_5_days"
            msg = f"Hi {m.name}, your membership expires in 5 days. Please renew on time! 💪"
        elif days == 0:
            rtype = "today"
            msg = f"Hi {m.name}, your membership expires TODAY. Renew now to continue! 🔥"
        elif days == -1:
            rtype = "expired_-1"
            msg = f"Hi {m.name}, your membership expired yesterday. Renew now to stay on track! 💪"
        elif days == -5:
            rtype = "expired_-5"
            msg = f"Hi {m.name}, it has been 5 days since your membership expired. We miss you! 🔥"
        if rtype and msg:
            if not await _already_sent(db, m.id, rtype):
                await send_whatsapp_message(db, gym_id, m.phone, msg)
                await _log(db, m.id, rtype)
                sent += 1
            else:
                skipped += 1
    return {"members_checked": len(members), "reminders_sent": sent, "duplicates_skipped": skipped}
