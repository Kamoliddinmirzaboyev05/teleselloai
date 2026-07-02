from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, require_admin
from app.schemas.ai_settings import AISettings
from app.schemas.chat import ChatMessageRead
from app.schemas.lead import LeadRead, LeadUpdate
from app.schemas.user import CurrentUser
from app.services import ai_settings_service, chat_service, lead_service

router = APIRouter(prefix="/api/leads", tags=["leads"], dependencies=[Depends(require_admin)])


def _scoped_account_id(current_user: CurrentUser) -> UUID | None:
    return None if current_user.role == "superadmin" else current_user.account_id


@router.get("", response_model=list[LeadRead])
async def list_all_leads(session: SessionDep, current_user: CurrentUser = Depends(require_admin)) -> list:
    return await lead_service.list_leads(session, account_id=_scoped_account_id(current_user))


@router.get("/{lead_id}", response_model=LeadRead)
async def get_one_lead(lead_id: UUID, session: SessionDep, current_user: CurrentUser = Depends(require_admin)):
    lead = await lead_service.get_lead(session, lead_id, account_id=_scoped_account_id(current_user))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{lead_id}", response_model=LeadRead)
async def patch_lead(
    lead_id: UUID,
    payload: LeadUpdate,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
):
    lead = await lead_service.get_lead(session, lead_id, account_id=_scoped_account_id(current_user))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    try:
        return await lead_service.update_lead(session, lead, payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.get("/{lead_id}/chat", response_model=list[ChatMessageRead])
async def get_lead_chat(lead_id: UUID, session: SessionDep, current_user: CurrentUser = Depends(require_admin)) -> list:
    lead = await lead_service.get_lead(session, lead_id, account_id=_scoped_account_id(current_user))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return await chat_service.get_history(session, lead_id)


@router.post("/{lead_id}/style-profile", response_model=AISettings)
async def save_lead_chat_as_style_profile(
    lead_id: UUID,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> dict:
    lead = await lead_service.get_lead(session, lead_id, account_id=_scoped_account_id(current_user))
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    history = await chat_service.get_history(session, lead_id, limit=80)
    try:
        return await ai_settings_service.update_conversation_style_from_history(session, history, lead.account_id)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
