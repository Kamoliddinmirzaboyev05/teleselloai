from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ChatMessageRead(BaseModel):
    id: UUID
    lead_id: UUID
    telegram_message_id: int | None
    role: str
    content: str
    is_audio: bool
    audio_path: str | None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
