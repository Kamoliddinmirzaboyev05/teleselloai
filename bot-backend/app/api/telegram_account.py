from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, require_admin
from app.schemas.telegram_account import (
    TelegramAccountRead,
    TelegramChatImportResponse,
    TelegramAccountUpdate,
    TelegramLoginStartResponse,
    TelegramLoginVerifyRequest,
    TelegramLoginVerifyResponse,
)
from app.schemas.user import CurrentUser
from app.services import telegram_account_service

router = APIRouter(prefix="/api/telegram-account", tags=["telegram-account"], dependencies=[Depends(require_admin)])


async def _current_account(session: SessionDep, current_user: CurrentUser):
    account = await telegram_account_service.get_account(session, current_user.account_id)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.get("", response_model=TelegramAccountRead)
async def read_telegram_account(
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> TelegramAccountRead:
    account = await _current_account(session, current_user)
    return telegram_account_service.serialize_account(account)


@router.put("", response_model=TelegramAccountRead)
async def save_telegram_account(
    payload: TelegramAccountUpdate,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> TelegramAccountRead:
    account = await _current_account(session, current_user)
    account = await telegram_account_service.update_account(session, account, payload)
    return telegram_account_service.serialize_account(account)


@router.post("/login/start", response_model=TelegramLoginStartResponse)
async def start_telegram_login(
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> TelegramLoginStartResponse:
    account = await _current_account(session, current_user)
    try:
        await telegram_account_service.start_login(session, account)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return TelegramLoginStartResponse(status="code_sent", message="Telegram kod yuborildi")


@router.post("/login/verify", response_model=TelegramLoginVerifyResponse)
async def verify_telegram_login(
    payload: TelegramLoginVerifyRequest,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> TelegramLoginVerifyResponse:
    account = await _current_account(session, current_user)
    try:
        connected = await telegram_account_service.verify_login(session, account, payload.code, payload.password)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    if not connected:
        return TelegramLoginVerifyResponse(
            status="password_required",
            message="Telegram 2FA parolini kiriting",
            requires_password=True,
        )
    return TelegramLoginVerifyResponse(status="connected", message="Telegram account ulandi")


@router.post("/dialogs/import", response_model=TelegramChatImportResponse)
async def import_telegram_dialogs(
    session: SessionDep,
    current_user: CurrentUser = Depends(require_admin),
) -> TelegramChatImportResponse:
    account = await _current_account(session, current_user)
    if account.telegram_status != "connected":
        raise HTTPException(status_code=422, detail="Telegram account avval ulanishi kerak")
    try:
        result = await telegram_account_service.import_private_chats(session, account)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        account.telegram_status = "error"
        account.telegram_last_error = str(exc)
        await session.commit()
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    return TelegramChatImportResponse(**result)
