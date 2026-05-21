from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from app.database import get_db
from app.auth.dependencies import require_owner, require_active_owner
from app.models.gym import Gym
from app.schemas import (MemberCreate, MemberOut, MemberRenewRequest, OwnerDashboardOut,
                          WhatsappTestRequest, BulkMessageRequest, SheetUrlUpdate, MessageResponse)
from app.services.member_service import (get_owner_dashboard, create_member, get_members,
                                          get_member, delete_member, renew_member, send_bulk_message, BULK_TEMPLATES)
from app.services.reminder_service import run_reminder_engine
from app.services.whatsapp_service import test_whatsapp_config
from app.services.sheet_service import sync_google_sheet, save_sheet_url, get_sheet_url

router = APIRouter(prefix="/owner", tags=["Owner"])

@router.get("/dashboard", response_model=OwnerDashboardOut)
async def dashboard(db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_owner)):
    return OwnerDashboardOut(**(await get_owner_dashboard(db, gym.id)))

@router.get("/members", response_model=list[MemberOut])
async def list_members(status: Optional[str] = Query(None), search: Optional[str] = Query(None),
                        db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_owner)):
    return await get_members(db, gym.id, status_filter=status, search=search)

@router.post("/members", response_model=MemberOut)
async def add_member(body: MemberCreate, db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_active_owner)):
    return await create_member(db, gym.id, body.name, body.phone, body.plan_name, body.join_date, body.expiry_date, body.fees_amount)

@router.get("/members/{member_id}", response_model=MemberOut)
async def get_member_detail(member_id: int, db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_owner)):
    m = await get_member(db, member_id, gym.id)
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    return m

@router.post("/members/{member_id}/renew", response_model=MemberOut)
async def renew(member_id: int, body: MemberRenewRequest, db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_active_owner)):
    m = await renew_member(db, member_id, gym.id, body.plan_type)
    if not m:
        raise HTTPException(status_code=404, detail="Member not found")
    return m

@router.delete("/members/{member_id}", response_model=MessageResponse)
async def remove_member(member_id: int, db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_active_owner)):
    if not await delete_member(db, member_id, gym.id):
        raise HTTPException(status_code=404, detail="Member not found")
    return MessageResponse(message="Member deleted")

@router.post("/reminders/run")
async def run_reminders(db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_active_owner)):
    return await run_reminder_engine(db, gym.id)

@router.post("/bulk-message")
async def bulk_message(body: BulkMessageRequest, db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_active_owner)):
    return await send_bulk_message(db, gym.id, body.template_id)

@router.get("/bulk-message/templates")
async def get_templates(gym: Gym = Depends(require_owner)):
    return BULK_TEMPLATES

@router.post("/whatsapp/test", response_model=MessageResponse)
async def whatsapp_test(body: WhatsappTestRequest, db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_owner)):
    if gym.whatsapp_mode.value != "self":
        raise HTTPException(status_code=400, detail="Only for self WhatsApp mode")
    if not gym.whatsapp_api_key or not gym.whatsapp_app_name or not gym.whatsapp_number:
        raise HTTPException(status_code=400, detail="WhatsApp config incomplete")
    if not await test_whatsapp_config(gym.whatsapp_api_key, gym.whatsapp_app_name, gym.whatsapp_number, body.test_number):
        raise HTTPException(status_code=502, detail="WhatsApp test failed")
    return MessageResponse(message="WhatsApp is working!")

@router.put("/sheet", response_model=MessageResponse)
async def set_sheet(body: SheetUrlUpdate, db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_active_owner)):
    await save_sheet_url(db, gym.id, body.sheet_url)
    return MessageResponse(message="Sheet URL saved")

@router.post("/sheet/sync")
async def sync_sheet(db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_active_owner)):
    url = await get_sheet_url(db, gym.id)
    if not url:
        raise HTTPException(status_code=400, detail="No Google Sheet linked. Set sheet URL first.")
    return await sync_google_sheet(db, gym.id, url)

@router.get("/sheet")
async def get_sheet(db: AsyncSession = Depends(get_db), gym: Gym = Depends(require_owner)):
    return {"sheet_url": await get_sheet_url(db, gym.id)}
