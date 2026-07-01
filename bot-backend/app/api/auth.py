from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import SessionDep, require_admin
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import CurrentUser
from app.services import user_service
from app.utils.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: SessionDep) -> TokenResponse:
    user = await user_service.authenticate_user(session, payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    current_user = CurrentUser(id=user.id, username=user.username, role=user.role, account_id=user.account_id)
    token = create_access_token(
        str(user.id),
        username=user.username,
        role=user.role,
        account_id=str(user.account_id),
    )
    return TokenResponse(access_token=token, user=current_user)


@router.get("/me", response_model=CurrentUser)
async def me(current_user: CurrentUser = Depends(require_admin)) -> CurrentUser:
    return current_user
