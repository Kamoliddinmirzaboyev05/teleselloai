# Bot Backend

Python FastAPI + Telethon backend for the Telegram AI Sales Agent MVP.

## Setup

```bash
cp .env.example .env
```

Fill Telegram and Groq credentials in `.env`.

By default `BOT_WORKER_ENABLED=false`, which keeps the Docker stack running even
before Telegram credentials are configured. Set it to `true` after adding
`TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and `TELEGRAM_PHONE`.

## Run With Docker

```bash
docker compose up --build
```

Run migrations after Postgres starts:

```bash
docker compose run --rm api alembic upgrade head
```

Check PostgreSQL and Redis:

```bash
docker compose exec postgres pg_isready -U postgres -d telegram_ai_crm
docker compose exec redis redis-cli ping
```

Incoming Telegram messages are rate-limited through Redis with
`MESSAGE_RATE_LIMIT_PER_MINUTE`.

API health check:

```bash
curl http://localhost:8000/api/health
```

## Local Development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
uvicorn app.main:app --reload
```

Start the worker locally:

```bash
python -m app.bot.worker
```
