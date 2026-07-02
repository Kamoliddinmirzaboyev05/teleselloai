from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from telethon.errors import SessionPasswordNeededError

from app.bot.session_manager import create_client_for_account
from app.models.account import Account
from app.models.setting import Setting
from app.schemas.telegram_account import TelegramAccountRead, TelegramAccountUpdate
from app.services import chat_service, lead_service

PHONE_CODE_HASH_KEY = "telegram_phone_code_hash"


def serialize_account(account: Account) -> TelegramAccountRead:
    return TelegramAccountRead(
        account_id=str(account.id),
        name=account.name,
        telegram_api_id=account.telegram_api_id,
        telegram_api_hash_set=bool(account.telegram_api_hash),
        telegram_phone=account.telegram_phone,
        telegram_status=account.telegram_status,
        telegram_last_error=account.telegram_last_error,
    )


async def get_account(session: AsyncSession, account_id: UUID) -> Account | None:
    result = await session.execute(select(Account).where(Account.id == account_id))
    return result.scalar_one_or_none()


async def update_account(session: AsyncSession, account: Account, payload: TelegramAccountUpdate) -> Account:
    data = payload.model_dump(exclude_unset=True)
    credentials_changed = False
    if data.get("name") is not None:
        account.name = data["name"].strip()
    if data.get("telegram_api_id") is not None:
        next_value = data["telegram_api_id"].strip()
        credentials_changed = credentials_changed or next_value != account.telegram_api_id
        account.telegram_api_id = next_value
    if data.get("telegram_api_hash"):
        next_value = data["telegram_api_hash"].strip()
        credentials_changed = credentials_changed or next_value != account.telegram_api_hash
        account.telegram_api_hash = next_value
    if data.get("telegram_phone") is not None:
        next_value = data["telegram_phone"].strip()
        credentials_changed = credentials_changed or next_value != account.telegram_phone
        account.telegram_phone = next_value
    if not account.session_name:
        account.session_name = f"account_{account.id.hex}"
    if credentials_changed or account.telegram_status == "disconnected":
        account.telegram_status = "credentials_saved"
    account.telegram_last_error = None
    await session.commit()
    await session.refresh(account)
    return account


async def _set_account_setting(session: AsyncSession, account_id: UUID, key: str, value: str) -> None:
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == key))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = value
    else:
        session.add(Setting(account_id=account_id, key=key, value=value))


async def _get_account_setting(session: AsyncSession, account_id: UUID, key: str) -> str | None:
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == key))
    setting = result.scalar_one_or_none()
    return setting.value if setting else None


async def start_login(session: AsyncSession, account: Account) -> None:
    if not account.telegram_api_id or not account.telegram_api_hash or not account.telegram_phone:
        raise ValueError("Telegram API ID, API hash, and phone are required")

    client = create_client_for_account(account)
    try:
        await client.connect()
        sent = await client.send_code_request(account.telegram_phone)
        await _set_account_setting(session, account.id, PHONE_CODE_HASH_KEY, sent.phone_code_hash)
        account.telegram_status = "code_sent"
        account.telegram_last_error = None
        await session.commit()
    except Exception as exc:
        account.telegram_status = "error"
        account.telegram_last_error = str(exc)
        await session.commit()
        raise
    finally:
        await client.disconnect()


async def verify_login(session: AsyncSession, account: Account, code: str, password: str | None = None) -> bool:
    phone_code_hash = await _get_account_setting(session, account.id, PHONE_CODE_HASH_KEY)
    if not phone_code_hash:
        raise ValueError("Start Telegram login first")

    client = create_client_for_account(account)
    try:
        try:
            await client.connect()
        except SessionPasswordNeededError:
            if not password:
                account.telegram_status = "password_required"
                account.telegram_last_error = None
                await session.commit()
                return False
            await client.sign_in(password=password)
            account.telegram_status = "connected"
            account.telegram_last_error = None
            await session.commit()
            return True
        try:
            await client.sign_in(account.telegram_phone, code=code, phone_code_hash=phone_code_hash)
        except SessionPasswordNeededError:
            if not password:
                account.telegram_status = "password_required"
                account.telegram_last_error = None
                await session.commit()
                return False
            await client.sign_in(password=password)

        account.telegram_status = "connected"
        account.telegram_last_error = None
        await session.commit()
        return True
    except Exception as exc:
        account.telegram_status = "error"
        account.telegram_last_error = str(exc)
        await session.commit()
        raise
    finally:
        await client.disconnect()


async def import_private_chats(
    session: AsyncSession,
    account: Account,
    *,
    dialog_limit: int = 100,
    message_limit: int = 20,
) -> dict[str, int]:
    client = create_client_for_account(account)
    imported_chats = 0
    imported_messages = 0
    skipped_chats = 0
    try:
        await client.connect()
        if hasattr(client, "is_user_authorized") and not await client.is_user_authorized():
            raise ValueError("Telegram account avval ulanishi kerak")

        async for dialog in client.iter_dialogs(limit=dialog_limit):
            entity = getattr(dialog, "entity", None)
            is_user_dialog = bool(getattr(dialog, "is_user", False))
            telegram_id = getattr(entity, "id", None)
            if not is_user_dialog or not telegram_id or bool(getattr(entity, "bot", False)):
                skipped_chats += 1
                continue

            lead = await lead_service.find_or_create_lead(
                session,
                account_id=account.id,
                telegram_id=int(telegram_id),
                telegram_username=getattr(entity, "username", None),
                first_name=getattr(entity, "first_name", None),
            )
            imported_chats += 1

            async for message in client.iter_messages(entity, limit=message_limit, reverse=True):
                content = (getattr(message, "message", None) or "").strip()
                if not content:
                    continue
                role = "admin" if bool(getattr(message, "out", False)) else "user"
                created = await chat_service.add_message_if_missing(
                    session,
                    lead_id=lead.id,
                    role=role,
                    content=content,
                    telegram_message_id=getattr(message, "id", None),
                )
                if created:
                    imported_messages += 1
                if role == "user" and getattr(message, "date", None):
                    lead.last_user_message_at = message.date
            await session.commit()
    finally:
        await client.disconnect()
    return {
        "imported_chats": imported_chats,
        "imported_messages": imported_messages,
        "skipped_chats": skipped_chats,
    }
