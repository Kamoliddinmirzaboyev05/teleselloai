from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chat_history import ChatHistory


async def add_message(
    session: AsyncSession,
    *,
    lead_id: UUID,
    role: str,
    content: str,
    telegram_message_id: int | None = None,
    is_audio: bool = False,
    audio_path: str | None = None,
) -> ChatHistory:
    message = ChatHistory(
        lead_id=lead_id,
        role=role,
        content=content,
        telegram_message_id=telegram_message_id,
        is_audio=is_audio,
        audio_path=audio_path,
    )
    session.add(message)
    await session.commit()
    await session.refresh(message)
    return message


async def add_message_if_missing(
    session: AsyncSession,
    *,
    lead_id: UUID,
    role: str,
    content: str,
    telegram_message_id: int | None = None,
    is_audio: bool = False,
    audio_path: str | None = None,
) -> bool:
    if telegram_message_id is not None:
        result = await session.execute(
            select(ChatHistory.id).where(
                ChatHistory.lead_id == lead_id,
                ChatHistory.telegram_message_id == telegram_message_id,
            )
        )
        if result.scalar_one_or_none():
            return False
    await add_message(
        session,
        lead_id=lead_id,
        role=role,
        content=content,
        telegram_message_id=telegram_message_id,
        is_audio=is_audio,
        audio_path=audio_path,
    )
    return True


async def get_history(session: AsyncSession, lead_id: UUID, limit: int = 50) -> list[ChatHistory]:
    result = await session.execute(
        select(ChatHistory)
        .where(ChatHistory.lead_id == lead_id)
        .order_by(ChatHistory.created_at.desc())
        .limit(limit)
    )
    return list(reversed(result.scalars().all()))
