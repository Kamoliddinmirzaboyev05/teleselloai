import asyncio
import random
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.lead import Lead
from app.services import ai_settings_service, chat_service, lead_service
from app.services.groq_service import GroqService
from app.services.prompt_service import build_messages
from app.utils.parser import parse_ai_response


class TelegramConversationService:
    def __init__(self, groq_service: GroqService | None = None) -> None:
        self.settings = get_settings()
        self.groq = groq_service or GroqService()

    async def handle_customer_text(
        self,
        session: AsyncSession,
        lead: Lead,
        message_id: int | None,
        content: str,
        *,
        is_audio: bool = False,
        audio_path: str | None = None,
    ) -> str | None:
        lead.last_user_message_at = datetime.utcnow()
        await chat_service.add_message(
            session,
            lead_id=lead.id,
            role="user",
            content=content,
            telegram_message_id=message_id,
            is_audio=is_audio,
            audio_path=audio_path,
        )
        if lead.ai_paused:
            return None

        history = await chat_service.get_history(session, lead.id, limit=10)
        ai_settings = await ai_settings_service.get_ai_settings(session, lead.account_id)
        raw_reply = await self.groq.generate_reply(build_messages(history, ai_settings))
        clean_reply, captured = parse_ai_response(raw_reply)
        if captured:
            await lead_service.apply_captured_data(session, lead, captured)
        lead.last_ai_message_at = datetime.utcnow()
        await chat_service.add_message(session, lead_id=lead.id, role="assistant", content=clean_reply)
        return clean_reply

    async def delay_before_reply(self) -> None:
        minimum = self.settings.default_ai_delay_min_seconds
        maximum = max(minimum, self.settings.default_ai_delay_max_seconds)
        await asyncio.sleep(random.uniform(minimum, maximum))
