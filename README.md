# Telegram AI Sales Agent

Docker-ready MVP scaffold for a Telegram AI sales assistant and CRM admin panel.

## Structure

- `bot-backend/`: Python FastAPI API, Telethon userbot worker, PostgreSQL models, Redis config, Groq integration, Alembic migrations.
- `frontend-admin/`: Next.js 14 admin CRM with login, Kanban dashboard, and chat detail panel.

Supabase is not used. The stack is designed for VPS deployment with Docker Compose.

## Backend Quick Start

```bash
cd bot-backend
cp .env.example .env
docker compose up --build
```

Run migrations:

```bash
docker compose run --rm api alembic upgrade head
```

Required live credentials:

- `GROQ_API_KEY`
- `TELEGRAM_API_ID`
- `TELEGRAM_API_HASH`
- `TELEGRAM_PHONE`
- Strong `JWT_SECRET`
- Strong `ADMIN_PASSWORD`

## Frontend Quick Start

```bash
cd frontend-admin
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local Backend Tests

```bash
cd bot-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pytest
```

## API

- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/leads`
- `GET /api/leads/{lead_id}`
- `PATCH /api/leads/{lead_id}`
- `GET /api/leads/{lead_id}/chat`

## Notes

The MVP supports one Telegram account from env values. The database schema and
service boundaries already include `accounts` so more sessions can be added
without replacing the core model.
