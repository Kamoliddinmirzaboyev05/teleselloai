from fastapi import APIRouter, Depends

from app.api.deps import SessionDep, require_admin
from app.schemas.ai_settings import AIChatFilterSettings, AISettings, AIPauseStatus, GroqKeyRead, GroqKeyUpdate
from app.schemas.user import CurrentUser
from app.services import ai_settings_service

router = APIRouter(prefix="/api/ai-settings", tags=["ai-settings"], dependencies=[Depends(require_admin)])


@router.get("/pause", response_model=AIPauseStatus)
async def read_ai_pause_status(session: SessionDep, current_user: CurrentUser = Depends(require_admin)) -> AIPauseStatus:
    return AIPauseStatus(ai_paused=await ai_settings_service.get_ai_pause_status(session, current_user.account_id))


@router.put("/pause", response_model=AIPauseStatus)
async def save_ai_pause_status(
    payload: AIPauseStatus,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> AIPauseStatus:
    ai_paused = await ai_settings_service.update_ai_pause_status(session, payload.ai_paused, current_user.account_id)
    return AIPauseStatus(ai_paused=ai_paused)


@router.get("/chat-filter", response_model=AIChatFilterSettings)
async def read_ai_chat_filter(session: SessionDep, current_user: CurrentUser = Depends(require_admin)) -> AIChatFilterSettings:
    return AIChatFilterSettings(mode=await ai_settings_service.get_ai_chat_filter(session, current_user.account_id))


@router.put("/chat-filter", response_model=AIChatFilterSettings)
async def save_ai_chat_filter(
    payload: AIChatFilterSettings,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> AIChatFilterSettings:
    try:
        mode = await ai_settings_service.update_ai_chat_filter(session, payload.mode, current_user.account_id)
    except ValueError as exc:
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail=str(exc)) from exc
    return AIChatFilterSettings(mode=mode)


@router.get("/groq-key", response_model=GroqKeyRead)
async def read_groq_key_status(session: SessionDep, current_user: CurrentUser = Depends(require_admin)) -> GroqKeyRead:
    return GroqKeyRead(groq_api_key_set=await ai_settings_service.is_groq_api_key_set(session, current_user.account_id))


@router.put("/groq-key", response_model=GroqKeyRead)
async def save_groq_key(
    payload: GroqKeyUpdate,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> GroqKeyRead:
    is_set = await ai_settings_service.update_groq_api_key(session, payload.groq_api_key, current_user.account_id)
    return GroqKeyRead(groq_api_key_set=is_set)


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
