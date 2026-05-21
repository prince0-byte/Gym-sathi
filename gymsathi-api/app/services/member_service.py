from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.member import Member, MemberStatus
from app.models.gym import Gym
from app.services.date_utils import days_until_expiry, today_str, date_offset_str
from app.services.whatsapp_service import send_whatsapp_message

BULK_TEMPLATES = {
    "1": "Hello {name},\nAaj {gym_name} band rahega.\n- {gym_name}",
    "2": "Hello {name},\nKal se {gym_name} ka timing 6AM to 10PM rahega.\n--- {gym_name}",
    "3": "Hello {name},\nStay consistent at {gym_name} 💪",
    "4": "Hello {name},\nSpecial discount on Personal Training at {gym_name}!",
}

async def sync_member_statuses(db: AsyncSession, gym_id: int):
    result = await db.execute(select(Member).where(Member.gym_id == gym_id))
    for m in result.scalars().all():
        days = days_until_expiry(m.expiry_date)
        if days is None:
            continue
        new_status = MemberStatus.expired if days < 0 else MemberStatus.active
        if m.status != new_status:
            m.status = new_status
    await db.commit()

async def get_owner_dashboard(db: AsyncSession, gym_id: int) -> dict:
    await sync_member_statuses(db, gym_id)
    today = today_str()
    active    = (await db.execute(select(func.count(Member.id)).where(Member.gym_id == gym_id, Member.status == MemberStatus.active))).scalar() or 0
    expired   = (await db.execute(select(func.count(Member.id)).where(Member.gym_id == gym_id, Member.status == MemberStatus.expired))).scalar() or 0
    revenue   = (await db.execute(select(func.sum(Member.fees_amount)).where(Member.gym_id == gym_id, Member.status == MemberStatus.active))).scalar() or 0.0
    expiring  = (await db.execute(select(func.count(Member.id)).where(Member.gym_id == gym_id, Member.status == MemberStatus.active, Member.expiry_date.between(today, date_offset_str(5))))).scalar() or 0
    today_exp = (await db.execute(select(func.count(Member.id)).where(Member.gym_id == gym_id, Member.expiry_date == today))).scalar() or 0
    return {"active_members": active, "expired_members": expired, "total_revenue": revenue, "expiring_soon": expiring, "today_expired": today_exp}

async def create_member(db: AsyncSession, gym_id: int, name: str, phone: str,
                         plan_name: str, join_date: str, expiry_date: str, fees_amount: float) -> Member:
    m = Member(gym_id=gym_id, name=name, phone=phone, plan_name=plan_name,
               join_date=join_date, expiry_date=expiry_date, fees_amount=fees_amount, status=MemberStatus.active)
    db.add(m)
    await db.commit()
    await db.refresh(m)
    return m

async def get_members(db: AsyncSession, gym_id: int, status_filter: str = None, search: str = None):
    await sync_member_statuses(db, gym_id)
    q = select(Member).where(Member.gym_id == gym_id)
    if status_filter in ("active", "expired"):
        q = q.where(Member.status == (MemberStatus.active if status_filter == "active" else MemberStatus.expired))
    if search:
        q = q.where(Member.name.ilike(f"%{search}%") | Member.phone.ilike(f"%{search}%"))
    q = q.order_by(Member.expiry_date.asc())
    return (await db.execute(q)).scalars().all()

async def get_member(db: AsyncSession, member_id: int, gym_id: int):
    result = await db.execute(select(Member).where(Member.id == member_id, Member.gym_id == gym_id))
    return result.scalar_one_or_none()

async def delete_member(db: AsyncSession, member_id: int, gym_id: int) -> bool:
    m = await get_member(db, member_id, gym_id)
    if not m:
        return False
    await db.delete(m)
    await db.commit()
    return True

async def renew_member(db: AsyncSession, member_id: int, gym_id: int, plan_type: str):
    m = await get_member(db, member_id, gym_id)
    if not m:
        return None
    today = datetime.today()
    base  = datetime.strptime(m.expiry_date, "%Y-%m-%d")
    base  = base if base > today else today
    days_map = {"monthly": 30, "quarterly": 90, "yearly": 365}
    new_expiry = (base + timedelta(days=days_map[plan_type])).strftime("%Y-%m-%d")
    m.expiry_date = new_expiry
    m.status = MemberStatus.active
    await db.commit()
    await db.refresh(m)
    msg = f"Membership Renewed!\n\nHi {m.name},\nValid Till: {new_expiry}\n\nKeep training hard! 💪"
    await send_whatsapp_message(db, gym_id, m.phone, msg)
    return m

async def send_bulk_message(db: AsyncSession, gym_id: int, template_id: str) -> dict:
    template = BULK_TEMPLATES.get(template_id)
    if not template:
        return {"error": "Invalid template"}
    gym = (await db.execute(select(Gym).where(Gym.id == gym_id))).scalar_one_or_none()
    if not gym:
        return {"error": "Gym not found"}
    members = await get_members(db, gym_id, status_filter="active")
    sent = 0
    for m in members:
        msg = template.replace("{name}", m.name).replace("{gym_name}", gym.name)
        if await send_whatsapp_message(db, gym_id, m.phone, msg):
            sent += 1
    return {"sent": sent, "total": len(members)}
