import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models.account import Account
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.utils.security import hash_password, verify_password

VALID_ROLES = {"admin", "superadmin"}


def _validate_role(role: str) -> str:
    if role not in VALID_ROLES:
        raise ValueError("Invalid user role")
    return role


async def count_users(session: AsyncSession) -> int:
    result = await session.execute(select(func.count(User.id)))
    return int(result.scalar_one())


async def get_user_by_username(session: AsyncSession, username: str) -> User | None:
    result = await session.execute(select(User).where(User.username == username))
    return result.scalar_one_or_none()


async def get_user(session: AsyncSession, user_id: uuid.UUID) -> User | None:
    result = await session.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()


async def create_user(session: AsyncSession, payload: UserCreate) -> User:
    role = _validate_role(payload.role)
    existing = await get_user_by_username(session, payload.username)
    if existing:
        raise ValueError("Username already exists")

    account = Account(
        name=payload.full_name or payload.username,
        telegram_api_id="",
        telegram_api_hash="",
        telegram_phone="",
        session_name=f"account_{uuid.uuid4().hex}",
        telegram_status="disconnected",
        is_active=True,
    )
    session.add(account)
    await session.flush()

    user = User(
        username=payload.username,
        full_name=payload.full_name,
        password_hash=hash_password(payload.password),
        role=role,
        account_id=account.id,
        is_active=True,
    )
    session.add(user)
    await session.flush()
    account.owner_user_id = user.id
    await session.commit()
    await session.refresh(user)
    return user


async def update_user(session: AsyncSession, user: User, payload: UserUpdate) -> User:
    data = payload.model_dump(exclude_unset=True)
    if "role" in data and data["role"] is not None:
        user.role = _validate_role(data["role"])
    if "full_name" in data:
        user.full_name = data["full_name"]
    if "is_active" in data and data["is_active"] is not None:
        user.is_active = data["is_active"]
    if data.get("password"):
        user.password_hash = hash_password(data["password"])
    await session.commit()
    await session.refresh(user)
    return user


async def list_users(session: AsyncSession) -> list[User]:
    result = await session.execute(select(User).order_by(User.created_at.desc()))
    return list(result.scalars().all())


async def ensure_initial_superadmin(session: AsyncSession) -> User | None:
    if await count_users(session) > 0:
        return None

    settings = get_settings()
    result = await session.execute(
        select(Account)
        .where(Account.is_active.is_(True))
        .order_by((Account.session_name == settings.telegram_session_name).desc(), Account.created_at.asc())
        .limit(1)
    )
    account = result.scalar_one_or_none()
    if not account:
        account = Account(
            name="Superadmin Account",
            telegram_api_id=settings.telegram_api_id,
            telegram_api_hash=settings.telegram_api_hash,
            telegram_phone=settings.telegram_phone,
            session_name=settings.telegram_session_name,
            telegram_status="connected" if settings.telegram_api_id and settings.telegram_api_hash else "disconnected",
            is_active=True,
        )
        session.add(account)
        await session.flush()
    else:
        account.name = account.name or "Superadmin Account"
        account.telegram_api_id = account.telegram_api_id or settings.telegram_api_id
        account.telegram_api_hash = account.telegram_api_hash or settings.telegram_api_hash
        account.telegram_phone = account.telegram_phone or settings.telegram_phone
        account.session_name = account.session_name or settings.telegram_session_name
        if account.telegram_api_id and account.telegram_api_hash and account.telegram_phone:
            account.telegram_status = "connected"

    user = User(
        username=settings.admin_username,
        full_name="Superadmin",
        password_hash=hash_password(settings.admin_password),
        role="superadmin",
        account_id=account.id,
        is_active=True,
    )
    session.add(user)
    await session.flush()
    account.owner_user_id = user.id
    await session.commit()
    await session.refresh(user)
    return user


async def authenticate_user(session: AsyncSession, username: str, password: str) -> User | None:
    await ensure_initial_superadmin(session)
    user = await get_user_by_username(session, username)
    if not user or not user.is_active:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
