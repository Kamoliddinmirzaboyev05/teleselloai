from redis.asyncio import Redis

from app.config import get_settings


def get_redis() -> Redis:
    return Redis.from_url(get_settings().redis_url, decode_responses=True)


async def allow_message(redis: Redis, subject: str, *, limit: int, window_seconds: int = 60) -> bool:
    key = f"rate:{subject}"
    count = await redis.incr(key)
    if count == 1:
        await redis.expire(key, window_seconds)
    return count <= limit
