from __future__ import annotations
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator
import re

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    gym_id: int
    gym_name: str
    subscription_status: str

class RefreshRequest(BaseModel):
    refresh_token: str

class GymCreate(BaseModel):
    name: str
    owner_name: str
    phone: str
    city: str
    username: str
    password: str
    subscription_plan: str = "Basic"
    subscription_expiry: Optional[str] = None
    whatsapp_mode: str = "admin"
    whatsapp_number: Optional[str] = None
    whatsapp_api_key: Optional[str] = None
    whatsapp_app_name: Optional[str] = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        d = re.sub(r"\D", "", v)
        if len(d) == 10: return "91" + d
        if len(d) == 12 and d.startswith("91"): return d
        raise ValueError("Enter a valid 10-digit Indian mobile number")

class GymOut(BaseModel):
    id: int
    name: str
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    username: str
    role: str
    subscription_plan: Optional[str] = None
    subscription_expiry: Optional[str] = None
    subscription_status: str
    is_active: bool
    whatsapp_mode: str
    created_at: datetime
    model_config = {"from_attributes": True}

class GymRenewRequest(BaseModel):
    plan_type: str
    @field_validator("plan_type")
    @classmethod
    def validate(cls, v):
        if v not in ("monthly", "quarterly", "yearly"):
            raise ValueError("plan_type must be monthly, quarterly, or yearly")
        return v

class WhatsappConfigUpdate(BaseModel):
    whatsapp_mode: str
    whatsapp_number: Optional[str] = None
    whatsapp_api_key: Optional[str] = None
    whatsapp_app_name: Optional[str] = None

class SheetUrlUpdate(BaseModel):
    sheet_url: str

class MemberCreate(BaseModel):
    name: str
    phone: str
    plan_name: str
    join_date: str
    expiry_date: str
    fees_amount: float

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v):
        d = re.sub(r"\D", "", v)
        if len(d) == 10: return "91" + d
        if len(d) == 12 and d.startswith("91"): return d
        raise ValueError("Enter a valid 10-digit Indian mobile number")

class MemberOut(BaseModel):
    id: int
    gym_id: int
    name: str
    phone: str
    plan_name: Optional[str] = None
    join_date: Optional[str] = None
    expiry_date: str
    fees_amount: Optional[float] = None
    status: str
    created_at: datetime
    model_config = {"from_attributes": True}

class MemberRenewRequest(BaseModel):
    plan_type: str
    @field_validator("plan_type")
    @classmethod
    def validate(cls, v):
        if v not in ("monthly", "quarterly", "yearly"):
            raise ValueError("plan_type must be monthly, quarterly, or yearly")
        return v

class OwnerDashboardOut(BaseModel):
    active_members: int
    expired_members: int
    total_revenue: float
    expiring_soon: int
    today_expired: int

class AdminDashboardOut(BaseModel):
    total_owners: int
    active_owners: int
    expired_owners: int
    members_expired_today: int
    month_revenue: float
    lifetime_revenue: float

class WhatsappTestRequest(BaseModel):
    test_number: str

class BulkMessageRequest(BaseModel):
    template_id: str

class MessageResponse(BaseModel):
    message: str
    success: bool = True
