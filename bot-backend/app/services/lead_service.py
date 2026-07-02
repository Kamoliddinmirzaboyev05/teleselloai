import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.account import Account
from app.models.lead import Lead
from app.schemas.lead import LeadUpdate

VALID_STATUSES = {"new", "thinking", "won", "lost"}
VALID_AI_FILTERS = {"default", "allow", "block"}


async def get_or_create_default_account(session: AsyncSession) -> Account:
    result = await session.execute(select(Account).where(Account.is_active.is_(True)).limit(1))
    account = result.scalar_one_or_none()
    if account:
        return account

    from app.config import get_settings

    settings = get_settings()
    account = Account(
        name="Main Telegram Account",
        telegram_api_id=settings.telegram_api_id,
        telegram_api_hash=settings.telegram_api_hash,
        telegram_phone=settings.telegram_phone,
        session_name=settings.telegram_session_name,
    )
    session.add(account)
    await session.commit()
    await session.refresh(account)
    return account


async def find_or_create_lead(
    session: AsyncSession,
    *,
    account_id: uuid.UUID,
    telegram_id: int,
    telegram_username: str | None,
    first_name: str | None,
) -> Lead:
    result = await session.execute(
        select(Lead).where(Lead.account_id == account_id, Lead.telegram_id == telegram_id)
    )
    lead = result.scalar_one_or_none()
    if lead:
        if telegram_username:
            lead.telegram_username = telegram_username
        if first_name and not lead.first_name:
            lead.first_name = first_name
        return lead

    lead = Lead(
        account_id=account_id,
        telegram_id=telegram_id,
        telegram_username=telegram_username,
        first_name=first_name,
        last_user_message_at=datetime.utcnow(),
    )
    session.add(lead)
    await session.commit()
    await session.refresh(lead)
    return lead


async def list_leads(session: AsyncSession, account_id: uuid.UUID | None = None) -> list[Lead]:
    statement = select(Lead).order_by(Lead.updated_at.desc())
    if account_id:
        statement = statement.where(Lead.account_id == account_id)
    result = await session.execute(statement)
    return list(result.scalars().all())


async def get_lead(session: AsyncSession, lead_id: uuid.UUID, account_id: uuid.UUID | None = None) -> Lead | None:
    statement = select(Lead).where(Lead.id == lead_id)
    if account_id:
        statement = statement.where(Lead.account_id == account_id)
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def find_lead_by_telegram_id(session: AsyncSession, *, account_id: uuid.UUID, telegram_id: int) -> Lead | None:
    result = await session.execute(
        select(Lead).where(Lead.account_id == account_id, Lead.telegram_id == telegram_id)
    )
    return result.scalar_one_or_none()


async def update_lead(session: AsyncSession, lead: Lead, patch: LeadUpdate | dict[str, Any]) -> Lead:
    data = patch.model_dump(exclude_unset=True) if isinstance(patch, LeadUpdate) else patch
    if "status" in data and data["status"] is not None and data["status"] not in VALID_STATUSES:
        raise ValueError("Invalid lead status")
    if "ai_filter" in data and data["ai_filter"] is not None and data["ai_filter"] not in VALID_AI_FILTERS:
        raise ValueError("Invalid AI filter")
    for key, value in data.items():
        if value is not None:
            setattr(lead, key, value)
    await session.commit()
    await session.refresh(lead)
    return lead


async def apply_captured_data(session: AsyncSession, lead: Lead, data: dict[str, Any]) -> Lead:
    allowed = {key: data.get(key) for key in ("first_name", "phone", "product_interest", "status") if data.get(key)}
    return await update_lead(session, lead, allowed)
