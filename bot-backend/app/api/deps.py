from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.utils.security import verify_access_token

bearer = HTTPBearer()
SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def require_admin(credentials: Annotated[HTTPAuthorizationCredentials, Depends(bearer)]) -> str:
    try:
        payload = verify_access_token(credentials.credentials)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc
    return str(payload["sub"])
