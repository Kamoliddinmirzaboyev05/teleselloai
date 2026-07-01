from app.utils.security import create_access_token, verify_access_token, verify_password


def test_access_token_round_trip_contains_subject():
    token = create_access_token("admin")

    payload = verify_access_token(token)

    assert payload["sub"] == "admin"


def test_verify_password_uses_constant_time_comparison():
    assert verify_password("change_me", "change_me") is True
    assert verify_password("wrong", "change_me") is False
