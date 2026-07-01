import asyncio

from telethon import events

from app.bot.handlers import handle_new_message
from app.bot.session_manager import create_client


async def main() -> None:
    client = create_client()
    client.add_event_handler(handle_new_message, events.NewMessage)
    await client.start()
    print("Bot worker started")
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
