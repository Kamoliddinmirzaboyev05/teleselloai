from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class LeadRead(BaseModel):
    id: UUID
    account_id: UUID
    telegram_id: int
    telegram_username: str | None
    first_name: str | None
    phone: str | None
    product_interest: str | None
    status: str
    ai_paused: bool
    last_user_message_at: datetime | None
    last_ai_message_at: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LeadUpdate(BaseModel):
    first_name: str | None = None
    phone: str | None = None
    product_interest: str | None = None
    status: str | None = None
    ai_paused: bool | None = None
