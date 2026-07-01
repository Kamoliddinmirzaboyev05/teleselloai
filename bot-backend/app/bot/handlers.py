from pathlib import Path

from telethon import events

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.services import lead_service
from app.services.telegram_service import TelegramConversationService
from app.utils.logger import log_error

conversation_service = TelegramConversationService()


async def handle_new_message(event: events.NewMessage.Event) -> None:
    if not event.is_private:
        return

    settings = get_settings()
    sender = await event.get_sender()
    telegram_id = int(sender.id)

    if telegram_id in settings.blacklist_ids:
        return
    if settings.whitelist_ids and telegram_id not in settings.whitelist_ids:
        return

    async with AsyncSessionLocal() as session:
        try:
            account = await lead_service.get_or_create_default_account(session)
            lead = await lead_service.find_or_create_lead(
                session,
                account_id=account.id,
                telegram_id=telegram_id,
                telegram_username=getattr(sender, "username", None),
                first_name=getattr(sender, "first_name", None),
            )

            if event.out:
                lead.ai_paused = True
                await session.commit()
                return

            content = event.raw_text or ""
            is_audio = bool(event.voice or event.audio)
            if is_audio:
                Path("downloads").mkdir(exist_ok=True)
                audio_path = await event.download_media(file="downloads/")
                content = await conversation_service.groq.transcribe_audio(str(audio_path))

            reply = await conversation_service.handle_customer_text(session, lead, event.message.id, content)
            if not reply:
                return

            async with event.client.action(event.chat_id, "typing"):
                await conversation_service.delay_before_reply()
            await event.reply(reply)
        except Exception as exc:
            await log_error(session, "bot.handlers", str(exc), {"telegram_id": telegram_id})
