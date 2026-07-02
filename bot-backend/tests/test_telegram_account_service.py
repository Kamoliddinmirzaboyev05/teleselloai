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


@pytest.mark.asyncio
async def test_import_private_chats_imports_only_user_dialogs_and_messages(monkeypatch):
    account = SimpleNamespace(id=uuid.uuid4(), telegram_status="connected")
    session = FakeSession()
    imported_leads = []
    imported_messages = []

    class FakeClient:
        async def connect(self):
            return None

        async def disconnect(self):
            return None

        async def is_user_authorized(self):
            return True

        async def iter_dialogs(self, limit):
            assert limit == 100
            yield SimpleNamespace(
                is_user=True,
                entity=SimpleNamespace(id=10, username="ali", first_name="Ali", bot=False),
            )
            yield SimpleNamespace(
                is_user=True,
                entity=SimpleNamespace(id=20, username="salesbot", first_name="Bot", bot=True),
            )
            yield SimpleNamespace(
                is_user=False,
                entity=SimpleNamespace(id=30, username="group", first_name="Group", bot=False),
            )

        async def iter_messages(self, entity, limit, reverse):
            assert entity.id == 10
            assert limit == 20
            assert reverse is True
            yield SimpleNamespace(id=1001, message="Salom", out=False, date=None)
            yield SimpleNamespace(id=1002, message="Assalomu alaykum, qanday yordam beramiz?", out=True, date=None)

    async def find_or_create_lead(_session, **payload):
        imported_leads.append(payload)
        return SimpleNamespace(id=uuid.uuid4(), account_id=payload["account_id"])

    async def add_message_if_missing(_session, **payload):
        imported_messages.append(payload)
        return True

    monkeypatch.setattr(telegram_account_service, "create_client_for_account", lambda _account: FakeClient())
    monkeypatch.setattr(telegram_account_service.lead_service, "find_or_create_lead", find_or_create_lead)
    monkeypatch.setattr(telegram_account_service.chat_service, "add_message_if_missing", add_message_if_missing)

    result = await telegram_account_service.import_private_chats(session, account)

    assert result == {"imported_chats": 1, "imported_messages": 2, "skipped_chats": 2}
    assert imported_leads == [
        {
            "account_id": account.id,
            "telegram_id": 10,
            "telegram_username": "ali",
            "first_name": "Ali",
        }
    ]
    assert [message["role"] for message in imported_messages] == ["user", "admin"]
    assert [message["telegram_message_id"] for message in imported_messages] == [1001, 1002]
