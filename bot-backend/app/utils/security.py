from datetime import datetime, timedelta, timezone
import base64
import hashlib
import hmac
import os
from typing import Any

import jwt

from app.config import get_settings

ALGORITHM = "HS256"
PASSWORD_PREFIX = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 260_000


def verify_password(candidate: str, expected: str) -> bool:
    if expected.startswith(f"{PASSWORD_PREFIX}$"):
        try:
            _, iterations, salt, digest = expected.split("$", 3)
            candidate_digest = _hash_password(candidate, base64.b64decode(salt), int(iterations))
            return hmac.compare_digest(candidate_digest, digest)
        except Exception:
            return False
    return hmac.compare_digest(candidate.encode("utf-8"), expected.encode("utf-8"))


def _hash_password(password: str, salt: bytes, iterations: int = PASSWORD_ITERATIONS) -> str:
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return base64.b64encode(digest).decode("ascii")


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    encoded_salt = base64.b64encode(salt).decode("ascii")
    digest = _hash_password(password, salt)
    return f"{PASSWORD_PREFIX}${PASSWORD_ITERATIONS}${encoded_salt}${digest}"


def create_access_token(subject: str, expires_minutes: int = 60 * 8, **claims: Any) -> str:
    settings = get_settings()
    payload = {
        "sub": subject,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=expires_minutes),
        **claims,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def verify_access_token(token: str) -> dict[str, Any]:
    settings = get_settings()
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
