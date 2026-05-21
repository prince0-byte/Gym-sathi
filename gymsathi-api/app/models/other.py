from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from app.models.base import Base

class ReminderLog(Base):
    __tablename__ = "reminders_log"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    member_id     = Column(Integer, ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_date = Column(String(10), nullable=False)
    reminder_type = Column(String(50), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    __table_args__ = (UniqueConstraint("member_id", "reminder_type", "reminder_date", name="uq_reminder_member_day"),)
    member = relationship("Member", back_populates="reminder_logs")

class GymSubscriptionLog(Base):
    __tablename__ = "gym_subscription_log"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    gym_id        = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    reminder_date = Column(String(10), nullable=False)
    reminder_type = Column(String(50), nullable=False)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    __table_args__ = (UniqueConstraint("gym_id", "reminder_type", "reminder_date", name="uq_sub_reminder_gym_day"),)
    gym = relationship("Gym", back_populates="subscription_logs")

class SubscriptionPayment(Base):
    __tablename__ = "subscription_payments"
    id           = Column(Integer, primary_key=True, autoincrement=True)
    gym_id       = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    plan_type    = Column(String(20), nullable=False)
    amount       = Column(Float, nullable=False)
    payment_date = Column(String(10), nullable=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    gym = relationship("Gym", back_populates="subscription_payments")

class WhatsappErrorLog(Base):
    __tablename__ = "whatsapp_error_logs"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    gym_id        = Column(Integer, ForeignKey("gyms.id", ondelete="CASCADE"), nullable=False, index=True)
    failed_number = Column(String(20), nullable=True)
    error_message = Column(Text, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    gym = relationship("Gym", back_populates="whatsapp_error_logs")

class AdminDailyReport(Base):
    __tablename__ = "admin_daily_reports"
    id          = Column(Integer, primary_key=True, autoincrement=True)
    report_date = Column(String(10), unique=True, nullable=False)
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class OwnerDailyExpiredLog(Base):
    __tablename__ = "owner_daily_expired_logs"
    id         = Column(Integer, primary_key=True, autoincrement=True)
    sent_date  = Column(String(10), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
