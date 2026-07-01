import json
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import Setting
from app.schemas.ai_settings import AISettings

AI_SETTINGS_KEY = "ai_settings"

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


async def get_ai_settings(session: AsyncSession) -> dict[str, Any]:
    result = await session.execute(select(Setting).where(Setting.account_id.is_(None), Setting.key == AI_SETTINGS_KEY))
    setting = result.scalar_one_or_none()
    if not setting:
        return dict(DEFAULT_AI_SETTINGS)
    try:
        raw = json.loads(setting.value)
    except json.JSONDecodeError:
        return dict(DEFAULT_AI_SETTINGS)
    return normalize_ai_settings(raw)


async def update_ai_settings(session: AsyncSession, payload: dict[str, Any]) -> dict[str, Any]:
    data = normalize_ai_settings(payload)
    result = await session.execute(select(Setting).where(Setting.account_id.is_(None), Setting.key == AI_SETTINGS_KEY))
    setting = result.scalar_one_or_none()
    encoded = json.dumps(data, ensure_ascii=False)
    if setting:
        setting.value = encoded
    else:
        session.add(Setting(account_id=None, key=AI_SETTINGS_KEY, value=encoded))
    await session.commit()
    return data
