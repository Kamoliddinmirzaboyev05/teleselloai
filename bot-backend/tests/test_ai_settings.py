import json

from app.services.ai_settings_service import DEFAULT_AI_SETTINGS, normalize_ai_settings
from app.services.prompt_service import build_system_prompt


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


def test_build_system_prompt_includes_business_settings_and_data_capture_contract():
    settings = dict(DEFAULT_AI_SETTINGS)
    settings.update(
        {
            "business_name": "Telesello AI",
            "services": "AI sales bot, CRM dashboard",
            "pricing": "Basic 500 ming, Pro 1.5 mln",
            "tone": "samimiy, qisqa, professional",
            "faq": [{"question": "Demo bormi?", "answer": "Ha, demo ko'rsatamiz."}],
        }
    )

    prompt = build_system_prompt(settings)

    assert "Telesello AI" in prompt
    assert "AI sales bot, CRM dashboard" in prompt
    assert "Basic 500 ming, Pro 1.5 mln" in prompt
    assert "samimiy, qisqa, professional" in prompt
    assert "Demo bormi?" in prompt
    assert "DATA_CAPTURE" in prompt
    assert json.dumps({"first_name": None, "phone": None, "product_interest": None, "status": "new"}) in prompt
