from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas.user import CurrentUser
from app.utils.security import verify_access_token

bearer = HTTPBearer()
SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def require_admin(credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)]) -> CurrentUser:
    try:
        payload = verify_access_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    try:
        return CurrentUser(
            id=payload["sub"],
            username=payload["username"],
            role=payload["role"],
            account_id=payload["account_id"],
        )
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload") from exc


async def require_superadmin(current_user: Annotated[CurrentUser, Depends(require_admin)]) -> CurrentUser:
    if current_user.role != "superadmin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Superadmin role required")
    return current_user
