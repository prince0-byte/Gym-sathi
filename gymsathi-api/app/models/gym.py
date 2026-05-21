import enum
from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import relationship
from app.models.base import Base

class GymRole(str, enum.Enum):
    admin = "admin"
    owner = "owner"

class WhatsappMode(str, enum.Enum):
    admin = "admin"
    self  = "self"

class SubscriptionStatus(str, enum.Enum):
    active  = "active"
    expired = "expired"

class Gym(Base):
    __tablename__ = "gyms"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    name           = Column(String(255), nullable=False)
    owner_name     = Column(String(255), nullable=True)
    phone          = Column(String(20),  nullable=True)
    city           = Column(String(100), nullable=True)
    username       = Column(String(100), unique=True, nullable=False, index=True)
    password       = Column(String(255), nullable=False)
    role           = Column(Enum(GymRole), nullable=False, default=GymRole.owner)
    subscription_plan    = Column(String(50), nullable=True)
    subscription_start   = Column(String(10), nullable=True)
    subscription_expiry  = Column(String(10), nullable=True)
    subscription_status  = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.active)
    is_active      = Column(Boolean, nullable=False, default=True)
    whatsapp_mode  = Column(Enum(WhatsappMode), nullable=False, default=WhatsappMode.admin)
    whatsapp_number   = Column(String(20),  nullable=True)
    whatsapp_api_key  = Column(String(255), nullable=True)
    whatsapp_app_name = Column(String(100), nullable=True)
    sheet_url      = Column(Text, nullable=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at     = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    members               = relationship("Member",              back_populates="gym", cascade="all, delete-orphan")
    subscription_payments = relationship("SubscriptionPayment", back_populates="gym", cascade="all, delete-orphan")
    whatsapp_error_logs   = relationship("WhatsappErrorLog",    back_populates="gym", cascade="all, delete-orphan")
    subscription_logs     = relationship("GymSubscriptionLog",  back_populates="gym", cascade="all, delete-orphan")
