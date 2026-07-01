from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, CreatedAtMixin, UUIDPrimaryKeyMixin


class Account(UUIDPrimaryKeyMixin, CreatedAtMixin, Base):
    __tablename__ = "accounts"

    name: Mapped[str] = mapped_column(String(255))
    telegram_api_id: Mapped[str] = mapped_column(String(100))
    telegram_api_hash: Mapped[str] = mapped_column(String(255))
    telegram_phone: Mapped[str] = mapped_column(String(50))
    session_name: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    leads: Mapped[list["Lead"]] = relationship(back_populates="account")
