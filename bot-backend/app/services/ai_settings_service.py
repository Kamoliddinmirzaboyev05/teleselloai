import json
from typing import Any
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting
from app.schemas.ai_settings import AISettings
from app.services.prompt_service import build_conversation_style_profile

AI_SETTINGS_KEY = "ai_settings"
AI_PAUSE_KEY = "ai_paused"
AI_CHAT_FILTER_KEY = "ai_chat_filter"
GROQ_API_KEY = "groq_api_key"
VALID_AI_CHAT_FILTER_MODES = {"all", "humans", "new", "selected", "exclude", "none"}

DEFAULT_AI_SETTINGS = AISettings().model_dump()


def normalize_ai_settings(raw: dict[str, Any] | None) -> dict[str, Any]:
    if not raw:
        return dict(DEFAULT_AI_SETTINGS)

    data = dict(DEFAULT_AI_SETTINGS)
    for key in data:
        if key == "faq":
            continue
        value = raw.get(key)
        if isinstance(value, str):
            data[key] = value.strip()

    faq_items: list[dict[str, str]] = []
    for item in raw.get("faq", []):
        if not isinstance(item, dict):
            continue
        question = str(item.get("question", "")).strip()
        answer = str(item.get("answer", "")).strip()
        if question and answer:
            faq_items.append({"question": question, "answer": answer})
    data["faq"] = faq_items
    return data


async def get_ai_settings(session: AsyncSession, account_id: UUID | None = None) -> dict[str, Any]:
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == AI_SETTINGS_KEY))
    setting = result.scalar_one_or_none()
    if not setting and account_id is not None:
        result = await session.execute(select(Setting).where(Setting.account_id.is_(None), Setting.key == AI_SETTINGS_KEY))
        setting = result.scalar_one_or_none()
    if not setting:
        return dict(DEFAULT_AI_SETTINGS)
    try:
        raw = json.loads(setting.value)
    except json.JSONDecodeError:
        return dict(DEFAULT_AI_SETTINGS)
    return normalize_ai_settings(raw)


async def update_ai_settings(session: AsyncSession, payload: dict[str, Any], account_id: UUID | None = None) -> dict[str, Any]:
    data = normalize_ai_settings(payload)
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == AI_SETTINGS_KEY))
    setting = result.scalar_one_or_none()
    encoded = json.dumps(data, ensure_ascii=False)
    if setting:
        setting.value = encoded
    else:
        session.add(Setting(account_id=account_id, key=AI_SETTINGS_KEY, value=encoded))
    await session.commit()
    return data


async def update_conversation_style_from_history(
    session: AsyncSession,
    history: list[Any],
    account_id: UUID | None = None,
) -> dict[str, Any]:
    profile = build_conversation_style_profile(history)
    if not profile:
        raise ValueError("Chatda uslub chiqarish uchun yetarli xabar yo'q")
    settings = await get_ai_settings(session, account_id)
    settings["conversation_style"] = profile
    return await update_ai_settings(session, settings, account_id)


def parse_ai_pause_status(value: str | None) -> bool:
    if not value:
        return False
    try:
        parsed = json.loads(value)
    except json.JSONDecodeError:
        return value.strip().lower() == "true"
    return bool(parsed)


async def get_ai_pause_status(session: AsyncSession, account_id: UUID | None = None) -> bool:
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == AI_PAUSE_KEY))
    setting = result.scalar_one_or_none()
    return parse_ai_pause_status(setting.value if setting else None)


async def update_ai_pause_status(session: AsyncSession, ai_paused: bool, account_id: UUID | None = None) -> bool:
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == AI_PAUSE_KEY))
    setting = result.scalar_one_or_none()
    encoded = json.dumps(bool(ai_paused))
    if setting:
        setting.value = encoded
    else:
        session.add(Setting(account_id=account_id, key=AI_PAUSE_KEY, value=encoded))
    await session.commit()
    return bool(ai_paused)


async def get_ai_chat_filter(session: AsyncSession, account_id: UUID | None = None) -> str:
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == AI_CHAT_FILTER_KEY))
    setting = result.scalar_one_or_none()
    if not setting and account_id is not None:
        result = await session.execute(select(Setting).where(Setting.account_id.is_(None), Setting.key == AI_CHAT_FILTER_KEY))
        setting = result.scalar_one_or_none()
    mode = setting.value.strip() if setting and setting.value else "all"
    return mode if mode in VALID_AI_CHAT_FILTER_MODES else "all"


async def update_ai_chat_filter(session: AsyncSession, mode: str, account_id: UUID | None = None) -> str:
    cleaned = mode.strip()
    if cleaned not in VALID_AI_CHAT_FILTER_MODES:
        raise ValueError("Invalid AI chat filter")
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == AI_CHAT_FILTER_KEY))
    setting = result.scalar_one_or_none()
    if setting:
        setting.value = cleaned
    else:
        session.add(Setting(account_id=account_id, key=AI_CHAT_FILTER_KEY, value=cleaned))
    await session.commit()
    return cleaned


async def get_groq_api_key(session: AsyncSession, account_id: UUID | None = None) -> str:
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == GROQ_API_KEY))
    setting = result.scalar_one_or_none()
    if not setting and account_id is not None:
        result = await session.execute(select(Setting).where(Setting.account_id.is_(None), Setting.key == GROQ_API_KEY))
        setting = result.scalar_one_or_none()
    return setting.value.strip() if setting and setting.value else ""


async def is_groq_api_key_set(session: AsyncSession, account_id: UUID | None = None) -> bool:
    return bool(await get_groq_api_key(session, account_id))


async def update_groq_api_key(session: AsyncSession, groq_api_key: str, account_id: UUID | None = None) -> bool:
    cleaned = groq_api_key.strip()
    result = await session.execute(select(Setting).where(Setting.account_id == account_id, Setting.key == GROQ_API_KEY))
    setting = result.scalar_one_or_none()
    if setting:
        if cleaned:
            setting.value = cleaned
        else:
            await session.delete(setting)
    elif cleaned:
        session.add(Setting(account_id=account_id, key=GROQ_API_KEY, value=cleaned))
    await session.commit()
    return bool(cleaned)
