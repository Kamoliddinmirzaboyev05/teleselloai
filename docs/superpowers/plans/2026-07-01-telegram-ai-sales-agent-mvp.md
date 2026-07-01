# Telegram AI Sales Agent MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Docker-ready MVP scaffold for a Telegram AI Sales Agent with backend, bot worker, database, Redis, Groq integration, and admin CRM frontend.

**Architecture:** A Python backend provides shared models/services for both FastAPI and Telethon worker processes. A Next.js frontend talks to the FastAPI API and presents a CRM Kanban plus chat detail panel. Docker Compose runs PostgreSQL, Redis, API, and worker.

**Tech Stack:** Python 3.11, FastAPI, Telethon, SQLAlchemy async, Alembic, PostgreSQL, Redis, Groq SDK, Next.js 14, Tailwind CSS, TypeScript, Docker Compose.

## Global Constraints

- Supabase must not be used.
- The MVP supports one Telegram account now and keeps model/service structure ready for multiple accounts.
- Telegram groups and channels must be ignored.
- Audio messages must be downloaded and transcribed through Groq Whisper when credentials are present.
- AI replies must strip hidden `DATA_CAPTURE: {...}` JSON before sending to Telegram.
- Every user and assistant message must be stored in PostgreSQL.
- Admin/manual outbound messages must pause AI for the lead.
- Both apps must include `.env.example`.
- Docker Compose must include `postgres`, `redis`, `api`, and `bot-worker`.

---

## File Structure

- `bot-backend/app/config.py`: environment-backed settings.
- `bot-backend/app/database.py`: async engine/session helpers.
- `bot-backend/app/models/`: SQLAlchemy models for required tables.
- `bot-backend/app/schemas/`: Pydantic request/response schemas.
- `bot-backend/app/api/`: FastAPI routers for auth, health, and leads.
- `bot-backend/app/services/`: Groq, Telegram orchestration, lead, chat, prompt services.
- `bot-backend/app/bot/`: Telethon worker, handlers, session manager.
- `bot-backend/app/utils/`: logger, parser, security utilities.
- `bot-backend/alembic/`: migration environment and initial schema.
- `frontend-admin/app/`: Next.js routes for login, dashboard, and leads.
- `frontend-admin/components/`: Kanban, chat, layout, and UI primitives.
- `frontend-admin/lib/`: API client, auth helpers, and shared types.

## Tasks

### Task 1: Backend Foundation

**Files:**
- Create backend package, config, database, models, schemas, utilities, requirements, Dockerfile, Alembic config, and tests.

**Produces:**
- Importable FastAPI app and async SQLAlchemy models.
- Parser tests for `DATA_CAPTURE` extraction.
- Security tests for JWT helpers.

- [ ] Add backend files.
- [ ] Run `python -m pytest`.

### Task 2: Backend API And Bot Worker

**Files:**
- Create FastAPI routers and service layer.
- Create Telethon session manager, handlers, and worker entrypoint.
- Add Docker Compose and backend README.

**Produces:**
- `/api/auth/login`, `/api/health`, `/api/leads`, `/api/leads/{id}`, `/api/leads/{id}/chat`.
- `python -m app.bot.worker` starts the worker.

- [ ] Add API and bot files.
- [ ] Run `python -m pytest`.

### Task 3: Frontend Admin

**Files:**
- Create Next.js app structure, Tailwind config, UI primitives, API client, login, dashboard, Kanban, and chat panel.

**Produces:**
- `npm run lint` and `npm run build` scripts.
- CRM admin UI consuming backend endpoints.

- [ ] Add frontend files.
- [ ] Run `npm install` if dependencies are unavailable.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.

### Task 4: Root Documentation And Verification

**Files:**
- Create root README.
- Verify backend tests, frontend checks, git status, and Docker config syntax where possible.

**Produces:**
- A clear install/run path for `docker compose up --build` and Alembic migrations.

- [ ] Add root README.
- [ ] Run final verification commands.
- [ ] Report exact results and any credential-dependent limitations.

## Self-Review

The plan covers backend, worker, database, frontend, Docker, env examples, and README requirements from the approved design. It intentionally keeps implementation tasks broad enough for a scaffold but ensures each area has a verification command.
