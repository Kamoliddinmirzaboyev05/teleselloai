from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CurrentUser(BaseModel):
    id: UUID
    username: str
    role: str
    account_id: UUID


class UserRead(BaseModel):
    id: UUID
    username: str
    full_name: str | None
    role: str
    account_id: UUID
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=6, max_length=200)
    full_name: str | None = Field(default=None, max_length=255)
    role: str = "admin"


class UserUpdate(BaseModel):
    password: str | None = Field(default=None, min_length=6, max_length=200)
    full_name: str | None = Field(default=None, max_length=255)
    role: str | None = None
    is_active: bool | None = None
