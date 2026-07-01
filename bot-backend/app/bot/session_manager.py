from pathlib import Path

from telethon import TelegramClient

from app.config import get_settings
from app.models.account import Account


def get_session_path(session_name: str) -> str:
    sessions_dir = Path("sessions")
    sessions_dir.mkdir(exist_ok=True)
    return str(sessions_dir / session_name)


def create_client() -> TelegramClient:
    settings = get_settings()
    if not settings.telegram_api_id or not settings.telegram_api_hash:
        raise RuntimeError("TELEGRAM_API_ID and TELEGRAM_API_HASH are required")
    return TelegramClient(
        get_session_path(settings.telegram_session_name),
        int(settings.telegram_api_id),
        settings.telegram_api_hash,
    )


def create_client_for_account(account: Account) -> TelegramClient:
    if not account.telegram_api_id or not account.telegram_api_hash:
        raise RuntimeError("Telegram API ID and hash are required")
    return TelegramClient(
        get_session_path(account.session_name),
        int(account.telegram_api_id),
        account.telegram_api_hash,
    )
