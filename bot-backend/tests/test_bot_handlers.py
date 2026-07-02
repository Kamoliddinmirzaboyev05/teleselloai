import uuid
from types import SimpleNamespace

import pytest

from app.bot import handlers


class FakeAsyncSessionContext:
    async def __aenter__(self):
        return object()

    async def __aexit__(self, *_args):
        return False


class FakeAction:
    async def __aenter__(self):
        return None

    async def __aexit__(self, *_args):
        return False


class FakeRedis:
    async def aclose(self):
        return None


@pytest.mark.asyncio
async def test_ai_reply_marks_incoming_message_as_read(monkeypatch):
    account_id = uuid.uuid4()
    lead = SimpleNamespace(id=uuid.uuid4(), account_id=account_id)
    message = SimpleNamespace(id=321)
    read_calls = []
    replies = []

    class FakeClient:
        def action(self, chat_id, action_name):
            assert chat_id == 555
            assert action_name == "typing"
            return FakeAction()

        async def send_read_acknowledge(self, entity, message=None, **_kwargs):
            read_calls.append((entity, message))
            return True

    class FakeEvent:
        def __init__(self):
            self.is_private = True
            self.out = False
            self.chat_id = 555
            self.raw_text = "salom"
            self.voice = None
            self.audio = None
            self.message = message
            self.client = FakeClient()

        async def get_sender(self):
            return SimpleNamespace(id=777, username="customer", first_name="Ali")

        async def reply(self, text):
            replies.append(text)

    async def allow_message(*_args, **_kwargs):
        return True

    async def find_or_create_lead(*_args, **_kwargs):
        return lead

    async def handle_customer_text(*_args, **_kwargs):
        return "Salom, qanday yordam beraman?"

    async def delay_before_reply():
        return None

    monkeypatch.setattr(handlers, "AsyncSessionLocal", lambda: FakeAsyncSessionContext())
    monkeypatch.setattr(handlers.redis_service, "get_redis", lambda: FakeRedis())
    monkeypatch.setattr(handlers.redis_service, "allow_message", allow_message)
    monkeypatch.setattr(handlers.lead_service, "find_or_create_lead", find_or_create_lead)
    monkeypatch.setattr(handlers.conversation_service, "handle_customer_text", handle_customer_text)
    monkeypatch.setattr(handlers.conversation_service, "delay_before_reply", delay_before_reply)

    await handlers.handle_account_message(FakeEvent(), account_id)

    assert read_calls == [(555, message)]
    assert replies == ["Salom, qanday yordam beraman?"]
