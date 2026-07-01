from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_env: str = "development"
    database_url: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/telegram_ai_crm"
    redis_url: str = "redis://redis:6379/0"
    groq_api_key: str = ""
    groq_text_model: str = "llama-3.3-70b-versatile"
    groq_stt_model: str = "whisper-large-v3-turbo"
    telegram_api_id: str = ""
    telegram_api_hash: str = ""
    telegram_phone: str = ""
    telegram_session_name: str = "main_session"
    admin_telegram_ids: str = ""
    blacklist_telegram_ids: str = ""
    whitelist_telegram_ids: str = ""
    default_ai_delay_min_seconds: int = 2
    default_ai_delay_max_seconds: int = 5
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    jwt_secret: str = Field(default="change_me", min_length=8)
    admin_username: str = "admin"
    admin_password: str = "change_me"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def csv_ints(self, value: str) -> set[int]:
        return {int(item.strip()) for item in value.split(",") if item.strip()}

    @property
    def admin_ids(self) -> set[int]:
        return self.csv_ints(self.admin_telegram_ids)

    @property
    def blacklist_ids(self) -> set[int]:
        return self.csv_ints(self.blacklist_telegram_ids)

    @property
    def whitelist_ids(self) -> set[int]:
        return self.csv_ints(self.whitelist_telegram_ids)


@lru_cache
def get_settings() -> Settings:
    return Settings()
