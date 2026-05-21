import enum
from sqlalchemy import Column, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from app.models.base import Base

class MemberStatus(str, enum.Enum):
    active  = "active"
    expired = "expired"

class Member(Base):
    __tablename__ = "members"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    gym_id      = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    name        = Column(String(255), nullable=False)
    phone       = Column(String(20),  nullable=False, index=True)
    plan_name   = Column(String(100), nullable=True)
    join_date   = Column(String(10),  nullable=True)
    expiry_date = Column(String(10),  nullable=False)
    fees_amount = Column(Float, nullable=True, default=0.0)
    status      = Column(Enum(MemberStatus), nullable=False, default=MemberStatus.active, index=True)
    last_renewal_notified = Column(String(10), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at  = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    gym           = relationship("Gym",         back_populates="members")
    reminder_logs = relationship("ReminderLog", back_populates="member", cascade="all, delete-orphan")
