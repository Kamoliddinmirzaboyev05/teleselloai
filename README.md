# Telegram AI Sales Agent

Docker-ready MVP scaffold for a Telegram AI sales assistant and CRM admin panel.

## Structure

- `bot-backend/`: Python FastAPI API, Telethon userbot worker, PostgreSQL models, Redis config, Groq integration, Alembic migrations.
- `frontend-admin/`: Vite React admin CRM with login, Kanban dashboard, chat detail panel, Telegram connection, and AI settings editor.

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

`BOT_WORKER_ENABLED=false` is the default so the full Compose stack can be
smoke-tested before Telegram credentials are configured. Set it to `true` after
`TELEGRAM_API_ID`, `TELEGRAM_API_HASH`, and `TELEGRAM_PHONE` are filled.

## Frontend Quick Start

```bash
cd frontend-admin
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:5173`.

The login request goes to `VITE_API_URL/api/auth/login`. Production
frontend uses same-origin `/api` by default. Vercel rewrites `/api/*` to the
backend at `http://13.60.104.64`.
The frontend also lets the admin edit the backend base URL from the login page
and from `/settings`; that browser-specific value overrides `VITE_API_URL`.

Admin login credentials are checked by the backend env values
`ADMIN_USERNAME` and `ADMIN_PASSWORD`. The frontend only needs
`VITE_API_URL`.

Use `/ai-settings` in the admin panel to teach the assistant about the
business, services, prices, tone, forbidden topics, escalation rules, and FAQ
answers. Saved settings are used by the bot on the next customer message.

Use `/admins` as the superadmin to create and block admins. Use `/telegram` as
any admin to connect that admin's Telegram account with `api_id`, `api_hash`,
phone, Telegram code, and optional 2FA password. Regular admins can only see
their own leads, AI settings, and Telegram connection. Superadmin can see all
leads and manage users.

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
- `GET /api/ai-settings`
- `PUT /api/ai-settings`
- `GET /api/auth/me`
- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/{user_id}`
- `GET /api/telegram-account`
- `PUT /api/telegram-account`
- `POST /api/telegram-account/login/start`
- `POST /api/telegram-account/login/verify`

## Notes

The MVP supports one Telegram account from env values. The database schema and
service boundaries already include `accounts` so more sessions can be added
without replacing the core model.
