from sqlalchemy.ext.asyncio import AsyncSession

from app.models.error_log import ErrorLog


async def log_error(session: AsyncSession, source: str, message: str, payload: dict | None = None) -> None:
    session.add(ErrorLog(source=source, message=message, payload=payload))
    await session.commit()
