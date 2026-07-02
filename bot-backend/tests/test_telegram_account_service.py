import uuid
from types import SimpleNamespace

import pytest
from telethon.errors import SessionPasswordNeededError

from app.services import telegram_account_service


class FakeScalarResult:
    def __init__(self, value):
        self.value = value

    def scalar_one_or_none(self):
        return self.value


class FakeSession:
    def __init__(self, setting_value="phone-code-hash"):
        self.setting = SimpleNamespace(value=setting_value)
        self.commits = 0

    async def execute(self, _statement):
        return FakeScalarResult(self.setting)

    async def commit(self):
        self.commits += 1


@pytest.mark.asyncio
async def test_verify_login_marks_password_required_when_2fa_is_raised_during_connect(monkeypatch):
    account = SimpleNamespace(
        id=uuid.uuid4(),
        telegram_phone="+998901112233",
        telegram_status="code_sent",
        telegram_last_error=None,
    )
    session = FakeSession()

    class FakeClient:
        async def connect(self):
            raise SessionPasswordNeededError(request="GetStateRequest")

        async def disconnect(self):
            return None

    monkeypatch.setattr(telegram_account_service, "create_client_for_account", lambda _account: FakeClient())

    connected = await telegram_account_service.verify_login(session, account, code="12345")

    assert connected is False
    assert account.telegram_status == "password_required"
    assert account.telegram_last_error is None
    assert session.commits == 1
