import pytest

from app.services.redis_service import allow_message


class FakeRedis:
    def __init__(self, values):
        self.values = list(values)
        self.expirations = []

    async def incr(self, key):
        return self.values.pop(0)

    async def expire(self, key, seconds):
        self.expirations.append((key, seconds))


@pytest.mark.asyncio
async def test_allow_message_sets_expiry_for_first_message():
    redis = FakeRedis([1])

    allowed = await allow_message(redis, "lead:42", limit=2, window_seconds=60)

    assert allowed is True
    assert redis.expirations == [("rate:lead:42", 60)]


@pytest.mark.asyncio
async def test_allow_message_blocks_after_limit():
    redis = FakeRedis([3])

    allowed = await allow_message(redis, "lead:42", limit=2, window_seconds=60)

    assert allowed is False
