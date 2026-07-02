import json
import sys
import uuid
from types import SimpleNamespace

import pytest

from app.services import telegram_service
from app.services.ai_settings_service import DEFAULT_AI_SETTINGS, normalize_ai_settings
from app.services.prompt_service import build_conversation_style_profile, build_system_prompt
from app.services.telegram_service import TelegramConversationService


def test_normalize_ai_settings_keeps_known_fields_and_faq_pairs():
    raw = {
        "business_name": "Telesello AI",
        "business_description": "Telegram sales automation",
        "unknown": "ignored",
        "faq": [
            {"question": "Narxi qancha?", "answer": "Basic 500 mingdan"},
            {"question": "", "answer": "empty ignored"},
        ],
    }

    settings = normalize_ai_settings(raw)

    assert settings["business_name"] == "Telesello AI"
    assert settings["business_description"] == "Telegram sales automation"
    assert settings["faq"] == [{"question": "Narxi qancha?", "answer": "Basic 500 mingdan"}]
    assert "unknown" not in settings


def test_normalize_ai_settings_keeps_conversation_style():
    settings = normalize_ai_settings({"conversation_style": "Qisqa, samimiy, savol bilan davom ettir."})

    assert settings["conversation_style"] == "Qisqa, samimiy, savol bilan davom ettir."


def test_build_system_prompt_includes_business_settings_and_data_capture_contract():
    settings = dict(DEFAULT_AI_SETTINGS)
    settings.update(
        {
            "business_name": "Telesello AI",
            "services": "AI sales bot, CRM dashboard",
            "pricing": "Basic 500 ming, Pro 1.5 mln",
            "tone": "samimiy, qisqa, professional",
            "conversation_style": "Javoblar 1-2 gap bo'lsin, mijozga Aka deb murojaat qilsin.",
            "faq": [{"question": "Demo bormi?", "answer": "Ha, demo ko'rsatamiz."}],
        }
    )

    prompt = build_system_prompt(settings)

    assert "Telesello AI" in prompt
    assert "AI sales bot, CRM dashboard" in prompt
    assert "Basic 500 ming, Pro 1.5 mln" in prompt
    assert "samimiy, qisqa, professional" in prompt
    assert "Javoblar 1-2 gap bo'lsin" in prompt
    assert "Demo bormi?" in prompt
    assert "DATA_CAPTURE" in prompt
    assert json.dumps({"first_name": None, "phone": None, "product_interest": None, "status": "new"}) in prompt


def test_build_conversation_style_profile_prefers_assistant_and_admin_messages():
    history = [
        SimpleNamespace(role="user", content="Narxi qancha?"),
        SimpleNamespace(role="assistant", content="Salom aka, narx loyiha hajmiga qarab aytiladi. Avval qaysi xizmat kerakligini bilsam bo'ladimi?"),
        SimpleNamespace(role="admin", content="Aka, sizga 1 kunda demo ko'rsatamiz. Telefon raqamingizni qoldirasizmi?"),
    ]

    profile = build_conversation_style_profile(history)

    assert "Chatdan olingan gaplashish uslubi" in profile
    assert "Salom aka" in profile
    assert "Telefon raqamingizni qoldirasizmi?" in profile
    assert "Narxi qancha?" not in profile


@pytest.mark.asyncio
@pytest.mark.parametrize(
        ("mode", "lead_filter", "lead_status", "sender_is_bot", "expected"),
        [
            ("all", "default", "thinking", False, True),
            ("all", "default", "thinking", True, False),
            ("humans", "default", "thinking", True, False),
            ("new", "default", "new", False, True),
            ("new", "default", "new", True, False),
            ("new", "default", "thinking", False, False),
            ("selected", "allow", "thinking", False, True),
            ("selected", "allow", "thinking", True, False),
            ("selected", "default", "thinking", False, False),
            ("exclude", "block", "thinking", False, False),
            ("exclude", "default", "thinking", False, True),
            ("exclude", "default", "thinking", True, False),
            ("none", "allow", "new", False, False),
        ],
)
async def test_ai_chat_filter_modes(monkeypatch, mode, lead_filter, lead_status, sender_is_bot, expected):
    async def get_ai_chat_filter(_session, _account_id):
        return mode

    monkeypatch.setattr(telegram_service.ai_settings_service, "get_ai_chat_filter", get_ai_chat_filter, raising=False)

    lead = SimpleNamespace(account_id=uuid.uuid4(), ai_filter=lead_filter, status=lead_status)

    allowed = await telegram_service.should_ai_reply_to_lead(object(), lead, sender_is_bot=sender_is_bot)

    assert allowed is expected


@pytest.mark.asyncio
async def test_global_ai_pause_skips_ai_reply(monkeypatch):
    messages = []
    groq_calls = []

    async def add_message(_session, **payload):
        messages.append(payload)

    async def get_history(_session, _lead_id, limit=10):
        return []

    async def get_ai_pause_status(_session, _account_id):
        return True

    async def get_ai_settings(_session, _account_id):
        return dict(DEFAULT_AI_SETTINGS)

    class FakeGroq:
        async def generate_reply(self, _messages, api_key=None):
            groq_calls.append("called")
            return "Bu javob ketmasligi kerak"

    monkeypatch.setattr(telegram_service.chat_service, "add_message", add_message)
    monkeypatch.setattr(telegram_service.chat_service, "get_history", get_history)
    monkeypatch.setattr(telegram_service.ai_settings_service, "get_ai_settings", get_ai_settings)
    monkeypatch.setattr(telegram_service.ai_settings_service, "get_ai_pause_status", get_ai_pause_status, raising=False)

    lead = SimpleNamespace(id=uuid.uuid4(), account_id=uuid.uuid4(), ai_paused=False)
    service = TelegramConversationService(groq_service=FakeGroq())

    reply = await service.handle_customer_text(object(), lead, 101, "salom")

    assert reply is None
    assert groq_calls == []
    assert [message["role"] for message in messages] == ["user"]


@pytest.mark.asyncio
async def test_conversation_service_uses_account_groq_api_key(monkeypatch):
    captured_api_keys = []

    async def add_message(_session, **_payload):
        return None

    async def get_history(_session, _lead_id, limit=10):
        return []

    async def get_ai_pause_status(_session, _account_id):
        return False

    async def get_ai_settings(_session, _account_id):
        return dict(DEFAULT_AI_SETTINGS)

    async def get_groq_api_key(_session, _account_id):
        return "account-groq-key"

    async def get_ai_chat_filter(_session, _account_id):
        return "all"

    class FakeGroq:
        async def generate_reply(self, _messages, api_key=None):
            captured_api_keys.append(api_key)
            return 'Salom!\nDATA_CAPTURE: {"first_name": null, "phone": null, "product_interest": null, "status": "new"}'

    monkeypatch.setattr(telegram_service.chat_service, "add_message", add_message)
    monkeypatch.setattr(telegram_service.chat_service, "get_history", get_history)
    monkeypatch.setattr(telegram_service.ai_settings_service, "get_ai_settings", get_ai_settings)
    monkeypatch.setattr(telegram_service.ai_settings_service, "get_ai_pause_status", get_ai_pause_status, raising=False)
    monkeypatch.setattr(telegram_service.ai_settings_service, "get_groq_api_key", get_groq_api_key, raising=False)
    monkeypatch.setattr(telegram_service.ai_settings_service, "get_ai_chat_filter", get_ai_chat_filter, raising=False)
    async def apply_captured_data(*_args, **_kwargs):
        return None

    monkeypatch.setattr(telegram_service.lead_service, "apply_captured_data", apply_captured_data)

    lead = SimpleNamespace(id=uuid.uuid4(), account_id=uuid.uuid4(), ai_paused=False, last_user_message_at=None, last_ai_message_at=None)
    service = TelegramConversationService(groq_service=FakeGroq())

    reply = await service.handle_customer_text(object(), lead, 102, "salom")

    assert reply == "Salom!"
    assert captured_api_keys == ["account-groq-key"]


@pytest.mark.asyncio
async def test_groq_service_prefers_explicit_api_key(monkeypatch):
    from app.services.groq_service import GroqService

    used_keys = []

    class FakeCompletion:
        choices = [SimpleNamespace(message=SimpleNamespace(content="ok"))]

    class FakeCompletions:
        def create(self, **_kwargs):
            return FakeCompletion()

    class FakeChat:
        completions = FakeCompletions()

    class FakeGroqClient:
        def __init__(self, api_key):
            used_keys.append(api_key)
            self.chat = FakeChat()

    monkeypatch.setitem(sys.modules, "groq", SimpleNamespace(Groq=FakeGroqClient))

    service = GroqService()
    reply = await service.generate_reply([{"role": "user", "content": "salom"}], api_key="explicit-key")

    assert reply == "ok"
    assert used_keys == ["explicit-key"]
