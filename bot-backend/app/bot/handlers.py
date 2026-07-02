from pathlib import Path
from uuid import UUID

from telethon import events

from app.config import get_settings
from app.database import AsyncSessionLocal
from app.services import ai_settings_service, chat_service, lead_service, redis_service
from app.services.telegram_service import TelegramConversationService
from app.utils.logger import log_error

conversation_service = TelegramConversationService()


async def handle_new_message(event: events.NewMessage.Event) -> None:
    async with AsyncSessionLocal() as session:
        account = await lead_service.get_or_create_default_account(session)
    await handle_account_message(event, account.id)


def build_new_message_handler(account_id: UUID):
    async def _handler(event: events.NewMessage.Event) -> None:
        await handle_account_message(event, account_id)

    return _handler


async def handle_account_message(event: events.NewMessage.Event, account_id: UUID) -> None:
    if not event.is_private:
        return

    settings = get_settings()
    async with AsyncSessionLocal() as session:
        try:
            if event.out:
                lead = await lead_service.find_lead_by_telegram_id(
                    session,
                    account_id=account_id,
                    telegram_id=int(event.chat_id),
                )
                if lead:
                    lead.ai_paused = True
                    await chat_service.add_message(
                        session,
                        lead_id=lead.id,
                        role="admin",
                        content=event.raw_text or "",
                        telegram_message_id=event.message.id,
                    )
                return

            sender = await event.get_sender()
            telegram_id = int(sender.id)

            if telegram_id in settings.blacklist_ids:
                return
            if settings.whitelist_ids and telegram_id not in settings.whitelist_ids:
                return
            redis = redis_service.get_redis()
            try:
                allowed = await redis_service.allow_message(
                    redis,
                    f"telegram:{account_id}:{telegram_id}",
                    limit=settings.message_rate_limit_per_minute,
                )
                if not allowed:
                    return
            except Exception as exc:
                await log_error(session, "redis.rate_limit", str(exc), {"telegram_id": telegram_id})
            finally:
                await redis.aclose()

            lead = await lead_service.find_or_create_lead(
                session,
                account_id=account_id,
                telegram_id=telegram_id,
                telegram_username=getattr(sender, "username", None),
                first_name=getattr(sender, "first_name", None),
            )

            content = event.raw_text or ""
            audio_path = None
            is_audio = bool(event.voice or event.audio)
            if is_audio:
                Path("downloads").mkdir(exist_ok=True)
                audio_path = await event.download_media(file="downloads/")
                groq_api_key = await ai_settings_service.get_groq_api_key(session, account_id)
                content = await conversation_service.groq.transcribe_audio(str(audio_path), api_key=groq_api_key)

            reply = await conversation_service.handle_customer_text(
                session,
                lead,
                event.message.id,
                content,
                is_audio=is_audio,
                audio_path=str(audio_path) if audio_path else None,
            )
            if not reply:
                return

            try:
                await event.client.send_read_acknowledge(event.chat_id, message=event.message)
            except Exception as exc:
                await log_error(session, "telegram.read_ack", str(exc), {"chat_id": event.chat_id})

            async with event.client.action(event.chat_id, "typing"):
                await conversation_service.delay_before_reply()
            await event.reply(reply)
        except Exception as exc:
            await session.rollback()
            await log_error(session, "bot.handlers", str(exc), {"chat_id": event.chat_id})
