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


async def should_ai_reply_to_lead(session: AsyncSession, lead: Lead, *, sender_is_bot: bool = False) -> bool:
    mode = await ai_settings_service.get_ai_chat_filter(session, lead.account_id)
    lead_filter = getattr(lead, "ai_filter", "default") or "default"
    if mode == "none":
        return False
    if mode == "humans":
        return not sender_is_bot
    if mode == "new":
        return lead.status == "new"
    if mode == "selected":
        return lead_filter == "allow"
    if mode == "exclude":
        return lead_filter != "block"
    return True


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
        sender_is_bot: bool = False,
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
        if lead.ai_paused or await ai_settings_service.get_ai_pause_status(session, lead.account_id):
            return None
        if not await should_ai_reply_to_lead(session, lead, sender_is_bot=sender_is_bot):
            return None

        history = await chat_service.get_history(session, lead.id, limit=10)
        ai_settings = await ai_settings_service.get_ai_settings(session, lead.account_id)
        groq_api_key = await ai_settings_service.get_groq_api_key(session, lead.account_id)
        raw_reply = await self.groq.generate_reply(build_messages(history, ai_settings), api_key=groq_api_key)
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
