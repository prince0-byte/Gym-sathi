from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from app.config import settings
from app.models.gym import Gym, SubscriptionStatus
from app.models.member import Member
from app.models.other import (GymSubscriptionLog, SubscriptionPayment, AdminDailyReport, OwnerDailyExpiredLog)
from app.services.date_utils import days_until_expiry, today_str
from app.services.whatsapp_service import send_whatsapp_message

PLAN_CONFIG = {
    "monthly":   {"days": 30,  "amount": settings.PRICE_MONTHLY},
    "quarterly": {"days": 90,  "amount": settings.PRICE_QUARTERLY},
    "yearly":    {"days": 365, "amount": settings.PRICE_YEARLY},
}

async def sync_subscription_statuses(db: AsyncSession):
    gyms = (await db.execute(select(Gym).where(Gym.role == "owner"))).scalars().all()
    for g in gyms:
        if g.subscription_expiry:
            days = days_until_expiry(g.subscription_expiry)
            if days is not None:
                new = SubscriptionStatus.expired if days < 0 else SubscriptionStatus.active
                if g.subscription_status != new:
                    g.subscription_status = new
    await db.commit()

async def get_admin_dashboard(db: AsyncSession) -> dict:
    await sync_subscription_statuses(db)
    today = today_str()
    month = datetime.today().strftime("%Y-%m")
    total     = (await db.execute(select(func.count(Gym.id)).where(Gym.role == "owner"))).scalar() or 0
    active    = (await db.execute(select(func.count(Gym.id)).where(Gym.role == "owner", Gym.subscription_status == SubscriptionStatus.active))).scalar() or 0
    expired   = (await db.execute(select(func.count(Gym.id)).where(Gym.role == "owner", Gym.subscription_status == SubscriptionStatus.expired))).scalar() or 0
    exp_today = (await db.execute(select(func.count(Member.id)).join(Gym, Member.gym_id == Gym.id).where(Member.expiry_date == today, Gym.role == "owner"))).scalar() or 0
    m_rev     = (await db.execute(select(func.sum(SubscriptionPayment.amount)).where(SubscriptionPayment.payment_date.like(f"{month}%")))).scalar() or 0.0
    t_rev     = (await db.execute(select(func.sum(SubscriptionPayment.amount)))).scalar() or 0.0
    return {"total_owners": total, "active_owners": active, "expired_owners": expired,
            "members_expired_today": exp_today, "month_revenue": m_rev, "lifetime_revenue": t_rev}

async def renew_subscription(db: AsyncSession, gym_id: int, plan_type: str, admin_gym_id: int) -> dict:
    if plan_type not in PLAN_CONFIG:
        return {"success": False, "error": "Invalid plan"}
    gym = (await db.execute(select(Gym).where(Gym.id == gym_id, Gym.role == "owner"))).scalar_one_or_none()
    if not gym:
        return {"success": False, "error": "Gym not found"}
    cfg   = PLAN_CONFIG[plan_type]
    today = datetime.today()
    base  = (datetime.strptime(gym.subscription_expiry, "%Y-%m-%d")
             if gym.subscription_expiry and datetime.strptime(gym.subscription_expiry, "%Y-%m-%d") > today
             else today)
    new_expiry = (base + timedelta(days=cfg["days"])).strftime("%Y-%m-%d")
    gym.subscription_expiry = new_expiry
    gym.subscription_status = SubscriptionStatus.active
    db.add(SubscriptionPayment(gym_id=gym_id, plan_type=plan_type, amount=cfg["amount"], payment_date=today_str()))
    await db.commit()
    msg = f"Subscription Renewed!\n\nHi {gym.name},\nPlan: {plan_type.capitalize()}\nValid Till: {new_expiry}\n\nThank you for GymSathi! 💪"
    await send_whatsapp_message(db, admin_gym_id, gym.phone, msg)
    return {"success": True, "new_expiry": new_expiry, "amount": cfg["amount"]}

async def _sub_sent(db: AsyncSession, gym_id: int, rtype: str) -> bool:
    r = await db.execute(select(GymSubscriptionLog).where(
        GymSubscriptionLog.gym_id == gym_id, GymSubscriptionLog.reminder_type == rtype,
        GymSubscriptionLog.reminder_date == today_str()))
    return r.scalar_one_or_none() is not None

async def _log_sub(db: AsyncSession, gym_id: int, rtype: str):
    db.add(GymSubscriptionLog(gym_id=gym_id, reminder_date=today_str(), reminder_type=rtype))
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()

async def run_subscription_reminder_engine(db: AsyncSession, admin_gym_id: int):
    gyms = (await db.execute(select(Gym).where(Gym.role == "owner"))).scalars().all()
    for gym in gyms:
        if not gym.subscription_expiry:
            continue
        days = days_until_expiry(gym.subscription_expiry)
        rtype, msg = None, None
        if days == 5:
            rtype = "5_day"
            msg = f"Hi {gym.name},\nYour GymSathi subscription expires in 5 days. Please renew."
        elif days == 1:
            rtype = "1_day"
            msg = f"URGENT {gym.name},\nSubscription expires TOMORROW. Renew immediately."
        elif days is not None and days < 0:
            days_after = (datetime.today() - datetime.strptime(gym.subscription_expiry, "%Y-%m-%d")).days
            if days_after == 1:
                rtype = "expired_day1"
                msg = f"{gym.name}, your subscription expired yesterday. Please renew."
            elif days_after == 5:
                rtype = "expired_day5"
                msg = f"FINAL REMINDER {gym.name}: Subscription expired 5 days ago. Renew now."
        if rtype and msg and not await _sub_sent(db, gym.id, rtype):
            await send_whatsapp_message(db, admin_gym_id, gym.phone, msg)
            await _log_sub(db, gym.id, rtype)

async def send_daily_admin_summary(db: AsyncSession, admin_gym_id: int, admin_phone: str) -> bool:
    today = today_str()
    if (await db.execute(select(AdminDailyReport).where(AdminDailyReport.report_date == today))).scalar_one_or_none():
        return False
    count      = (await db.execute(select(func.count(Member.id)).join(Gym, Member.gym_id == Gym.id).where(Member.expiry_date == today, Gym.role == "owner"))).scalar() or 0
    total_gyms = (await db.execute(select(func.count(Gym.id)).where(Gym.role == "owner"))).scalar() or 0
    msg = f"Daily GymSathi Report - {today}\n\nTotal Gym Owners: {total_gyms}\nMembers Expired Today: {count}\n\nStay proactive! 💪"
    await send_whatsapp_message(db, admin_gym_id, admin_phone, msg)
    db.add(AdminDailyReport(report_date=today))
    await db.commit()
    return True

async def send_expired_list_all_owners(db: AsyncSession, admin_gym_id: int) -> bool:
    today = today_str()
    if (await db.execute(select(OwnerDailyExpiredLog).where(OwnerDailyExpiredLog.sent_date == today))).scalar_one_or_none():
        return False
    owners = (await db.execute(select(Gym).where(Gym.role == "owner", Gym.subscription_status == SubscriptionStatus.active))).scalars().all()
    for owner in owners:
        expired = (await db.execute(select(Member).where(Member.gym_id == owner.id, Member.expiry_date == today))).scalars().all()
        if not expired:
            continue
        lines = "\n".join(f"- {m.name} ({m.phone})" for m in expired)
        msg = f"Expired Members Today - {owner.name}\n\n{lines}\n\nPlease follow up for renewal! 💪"
        await send_whatsapp_message(db, admin_gym_id, owner.phone, msg)
    db.add(OwnerDailyExpiredLog(sent_date=today))
    await db.commit()
    return True
