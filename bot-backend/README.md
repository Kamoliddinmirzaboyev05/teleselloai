# Bot Backend

Python FastAPI + Telethon backend for the Telegram AI Sales Agent MVP.

## Setup

```bash
cp .env.example .env
```

Fill Telegram and Groq credentials in `.env`.

## Run With Docker

```bash
docker compose up --build
```

Run migrations after Postgres starts:

```bash
docker compose run --rm api alembic upgrade head
```

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
