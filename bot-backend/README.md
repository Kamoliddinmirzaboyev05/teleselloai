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

Admin login uses `ADMIN_USERNAME` and `ADMIN_PASSWORD` from `.env`.
The first successful login creates the database superadmin user from those env
values. After that, users are managed from the admin panel.
After login, the admin panel can save AI training data through:

```bash
GET /api/ai-settings
PUT /api/ai-settings
```

The bot worker loads these settings before each AI reply, so changes apply to
new customer messages without restarting the worker.

Superadmin endpoints:

```bash
GET /api/users
POST /api/users
PATCH /api/users/{user_id}
```

Telegram account endpoints:

```bash
GET /api/telegram-account
PUT /api/telegram-account
POST /api/telegram-account/login/start
POST /api/telegram-account/login/verify
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

## First Telegram Login

Before enabling the worker, create the Telethon session once:

```bash
docker compose run --rm bot-worker python -m app.bot.login
```

Telegram will send a code to the configured account. Enter that code in the
terminal. If the account has two-step verification, enter the Telegram password
when prompted.

After login succeeds, set this in `.env`:

```env
BOT_WORKER_ENABLED=true
```

Then restart the worker:

```bash
docker compose up -d --build bot-worker
```
