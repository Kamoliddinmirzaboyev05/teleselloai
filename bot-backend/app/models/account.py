import uuid

from sqlalchemy import Boolean, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class Account(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "accounts"

    name: Mapped[str] = mapped_column(String(255))
    telegram_api_id: Mapped[str] = mapped_column(String(100))
    telegram_api_hash: Mapped[str] = mapped_column(String(255))
    telegram_phone: Mapped[str] = mapped_column(String(50))
    session_name: Mapped[str] = mapped_column(String(255))
    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    telegram_status: Mapped[str] = mapped_column(String(50), default="disconnected")
    telegram_last_error: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    leads: Mapped[list["Lead"]] = relationship(back_populates="account")
    users: Mapped[list["User"]] = relationship(back_populates="account", foreign_keys="User.account_id")
