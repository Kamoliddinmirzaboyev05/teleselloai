from app.utils.parser import parse_ai_response


def test_parse_ai_response_strips_data_capture_json():
    raw = 'Salom, albatta yordam beraman.\nDATA_CAPTURE: {"first_name":"Ali","phone":"+998901112233","product_interest":"CRM","status":"thinking"}'

    clean_text, captured = parse_ai_response(raw)

    assert clean_text == "Salom, albatta yordam beraman."
    assert captured == {
        "first_name": "Ali",
        "phone": "+998901112233",
        "product_interest": "CRM",
        "status": "thinking",
    }


def test_parse_ai_response_handles_missing_capture():
    clean_text, captured = parse_ai_response("Oddiy javob")

    assert clean_text == "Oddiy javob"
    assert captured == {}
