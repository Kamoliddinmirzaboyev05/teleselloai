import asyncio

from app.bot.session_manager import create_client
from app.config import get_settings


async def main() -> None:
    settings = get_settings()
    if not settings.telegram_phone:
        raise RuntimeError("TELEGRAM_PHONE is required for first login")

    client = create_client()
    await client.start(phone=settings.telegram_phone)
    me = await client.get_me()
    print(f"Telegram session is ready for @{me.username or me.id}")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
