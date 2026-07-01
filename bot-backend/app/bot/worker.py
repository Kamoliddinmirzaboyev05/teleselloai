import asyncio

from telethon import events

from app.config import get_settings
from app.bot.handlers import handle_new_message
from app.bot.session_manager import create_client


def should_start_worker(enabled: bool, telegram_api_id: str, telegram_api_hash: str) -> bool:
    return enabled and bool(telegram_api_id) and bool(telegram_api_hash)


async def main() -> None:
    settings = get_settings()
    if not settings.bot_worker_enabled:
        print("Bot worker disabled. Set BOT_WORKER_ENABLED=true after Telegram credentials are configured.")
        while True:
            await asyncio.sleep(3600)

    if not should_start_worker(True, settings.telegram_api_id, settings.telegram_api_hash):
        raise RuntimeError("BOT_WORKER_ENABLED=true requires TELEGRAM_API_ID and TELEGRAM_API_HASH")

    client = create_client()
    client.add_event_handler(handle_new_message, events.NewMessage)
    await client.start()
    print("Bot worker started")
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
