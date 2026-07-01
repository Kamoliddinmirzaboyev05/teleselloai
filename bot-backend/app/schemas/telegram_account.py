from pydantic import BaseModel, Field


class TelegramAccountRead(BaseModel):
    account_id: str
    name: str
    telegram_api_id: str
    telegram_api_hash_set: bool
    telegram_phone: str
    telegram_status: str
    telegram_last_error: str | None


class TelegramAccountUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    telegram_api_id: str | None = Field(default=None, max_length=100)
    telegram_api_hash: str | None = Field(default=None, max_length=255)
    telegram_phone: str | None = Field(default=None, max_length=50)


class TelegramLoginStartResponse(BaseModel):
    status: str
    message: str


class TelegramLoginVerifyRequest(BaseModel):
    code: str = Field(min_length=2, max_length=20)
    password: str | None = Field(default=None, max_length=255)


class TelegramLoginVerifyResponse(BaseModel):
    status: str
    message: str
    requires_password: bool = False
