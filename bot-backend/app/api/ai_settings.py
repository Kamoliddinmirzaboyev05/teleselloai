from fastapi import APIRouter, Depends

from app.api.deps import SessionDep, require_admin
from app.schemas.ai_settings import AISettings
from app.schemas.user import CurrentUser
from app.services import ai_settings_service

router = APIRouter(prefix="/api/ai-settings", tags=["ai-settings"], dependencies=[Depends(require_admin)])


@router.get("", response_model=AISettings)
async def read_ai_settings(session: SessionDep, current_user: CurrentUser = Depends(require_admin)) -> dict:
    return await ai_settings_service.get_ai_settings(session, current_user.account_id)


@router.put("", response_model=AISettings)
async def save_ai_settings(
    payload: AISettings,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> dict:
    return await ai_settings_service.update_ai_settings(session, payload.model_dump(), current_user.account_id)
