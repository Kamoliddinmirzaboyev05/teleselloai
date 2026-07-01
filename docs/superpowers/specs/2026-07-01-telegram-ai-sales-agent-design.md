# Telegram AI Sales Agent MVP Design

## Goal

Create a Docker-ready monorepo for a Telegram AI Sales Agent with a Python
Telethon/FastAPI backend, PostgreSQL, Redis, Groq AI integration, and a Next.js
admin CRM dashboard.

## Scope

The MVP provides a complete working scaffold, not a fully hardened production
system. It supports one Telegram account from environment variables while keeping
the database and service boundaries ready for multiple accounts later.

## Architecture

The project has two top-level applications:

- `bot-backend/`: FastAPI API server plus a separate Telethon bot worker.
- `frontend-admin/`: Next.js 14 admin panel with CRM Kanban and lead chat view.

Docker Compose runs PostgreSQL, Redis, the API server, and the bot worker. The
API and bot worker share the same database models and service layer.

## Backend Design

The backend uses Python 3.11, FastAPI, SQLAlchemy async ORM, Alembic, Redis, and
Groq. It defines the requested tables: `accounts`, `leads`, `chat_history`,
`settings`, and `error_logs`.

Telegram message flow:

1. Telethon receives a private message and ignores groups/channels.
2. The worker checks blacklist and whitelist settings from environment/config.
3. It finds or creates the lead for the active account.
4. It stores incoming user content in `chat_history`.
5. For voice/audio, it downloads the file and transcribes it through Groq
   Whisper before generating a reply.
6. It builds a prompt from the system prompt and the last 10 messages.
7. It calls Groq text generation and parses hidden `DATA_CAPTURE: {...}` JSON.
8. It updates lead fields from captured data and strips the JSON from the
   customer-facing reply.
9. It waits 2-5 seconds while showing Telegram typing action, sends the clean
   reply, and stores the assistant message.

Manual outbound messages from the account/admin mark the matching lead as
`ai_paused=true`. When paused, customer messages are stored but not auto-replied.

## API Design

FastAPI exposes:

- `POST /api/auth/login`
- `GET /api/leads`
- `GET /api/leads/{lead_id}`
- `PATCH /api/leads/{lead_id}`
- `GET /api/leads/{lead_id}/chat`
- `GET /api/health`

Authentication is MVP username/password with JWT using env-configured
`ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `JWT_SECRET`.

## Frontend Design

The admin app uses Next.js App Router, Tailwind CSS, and local shadcn-style UI
components. It includes:

- Login page.
- CRM dashboard with Kanban columns: `new`, `thinking`, `won`, `lost`.
- Lead cards showing name, Telegram username, phone, product interest, status,
  and last user message time.
- Lead detail/chat panel with separate user, assistant, admin, and system
  message styling.
- Status update and AI pause/unpause controls backed by the API.

The UI should look like a focused SaaS CRM: dense, readable, and operational.

## Error Handling

Backend errors are logged to the `error_logs` table with source, message, and
optional JSON payload. Worker code catches per-message failures so one failed
conversation does not stop the process.

## Testing And Verification

Backend tests cover parser/security/service behavior that can run without live
Telegram or Groq credentials. Frontend verification uses package scripts for
lint/build checks. Docker and README instructions document the live credential
setup needed for full end-to-end operation.
