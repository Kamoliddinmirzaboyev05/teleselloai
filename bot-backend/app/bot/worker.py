import asyncio
from uuid import UUID

from telethon import events
from sqlalchemy import select

from app.config import get_settings
from app.bot.handlers import build_new_message_handler, handle_new_message
from app.bot.session_manager import create_client, create_client_for_account
from app.database import AsyncSessionLocal
from app.models.account import Account


def should_start_worker(enabled: bool, telegram_api_id: str, telegram_api_hash: str) -> bool:
    return enabled and bool(telegram_api_id) and bool(telegram_api_hash)


def should_run_multi_account_worker() -> bool:
    return True


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


async def list_connected_accounts() -> list[Account]:
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Account).where(
                Account.is_active.is_(True),
                Account.telegram_status == "connected",
                Account.telegram_api_id != "",
                Account.telegram_api_hash != "",
            )
        )
        return list(result.scalars().all())


async def start_account_client(account: Account):
    client = create_client_for_account(account)
    await client.connect()
    if not await client.is_user_authorized():
        await client.disconnect()
        raise RuntimeError(f"Telegram session is not authorized for account {account.id}")
    client.add_event_handler(build_new_message_handler(account.id), events.NewMessage)
    print(f"Bot worker connected account {account.id} ({account.telegram_phone})")
    return client


async def multi_account_main() -> None:
    if not should_run_multi_account_worker():
        return
    clients: dict[UUID, object] = {}
    while True:
        accounts = await list_connected_accounts()
        for account in accounts:
            if account.id in clients:
                continue
            try:
                clients[account.id] = await start_account_client(account)
            except Exception as exc:
                print(f"Could not start Telegram account {account.id}: {exc}")
        if not clients:
            print("No connected Telegram accounts yet. Waiting...")
        await asyncio.sleep(30)


if __name__ == "__main__":
    asyncio.run(multi_account_main())
