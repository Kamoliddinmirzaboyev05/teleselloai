from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import SessionDep, require_superadmin
from app.schemas.user import CurrentUser, UserCreate, UserRead, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/api/users", tags=["users"], dependencies=[Depends(require_superadmin)])


@router.get("", response_model=list[UserRead])
async def list_all_users(session: SessionDep) -> list:
    return await user_service.list_users(session)


@router.post("", response_model=UserRead)
async def create_admin_user(payload: UserCreate, session: SessionDep) -> object:
    try:
        return await user_service.create_user(session, payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc


@router.patch("/{user_id}", response_model=UserRead)
async def patch_admin_user(
    user_id: UUID,
    payload: UserUpdate,
    session: SessionDep,
    current_user: CurrentUser = Depends(require_superadmin),
) -> object:
    user = await user_service.get_user(session, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id and payload.is_active is False:
        raise HTTPException(status_code=422, detail="Superadmin cannot deactivate self")
    if user.id == current_user.id and payload.role and payload.role != "superadmin":
        raise HTTPException(status_code=422, detail="Superadmin cannot demote self")
    try:
        return await user_service.update_user(session, user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
