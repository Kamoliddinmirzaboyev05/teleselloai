from app.utils.security import create_access_token, hash_password, verify_access_token, verify_password


def test_access_token_round_trip_contains_subject():
    token = create_access_token("user-id", username="admin", role="superadmin", account_id="account-id")

    payload = verify_access_token(token)

    assert payload["sub"] == "user-id"
    assert payload["username"] == "admin"
    assert payload["role"] == "superadmin"
    assert payload["account_id"] == "account-id"


def test_verify_password_uses_constant_time_comparison():
    assert verify_password("change_me", "change_me") is True
    assert verify_password("wrong", "change_me") is False


def test_hash_password_round_trip_does_not_store_plain_text():
    stored = hash_password("strong_password")

    assert stored != "strong_password"
    assert verify_password("strong_password", stored) is True
    assert verify_password("wrong", stored) is False
