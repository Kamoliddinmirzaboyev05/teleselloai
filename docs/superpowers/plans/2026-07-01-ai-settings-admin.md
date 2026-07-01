# AI Settings Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-controlled AI training settings to backend prompt generation and frontend admin UI.

**Architecture:** Store a JSON AI settings document in the existing `settings` table. FastAPI exposes protected GET/PUT endpoints. The bot reads the document when building Groq messages, and Next.js exposes a structured editor.

**Tech Stack:** FastAPI, SQLAlchemy async, Pydantic, Next.js, TypeScript, Tailwind CSS.

## Global Constraints

- No new database table is required.
- Preserve `DATA_CAPTURE` output requirements.
- Keep frontend compatible with Vercel by using `NEXT_PUBLIC_API_URL`.
- Push final code to the existing GitHub repository.

---

## Tasks

### Task 1: Backend Settings API

- [x] Add failing tests for settings normalization and prompt rendering.
- [x] Add schemas and service helpers for `ai_settings`.
- [x] Add protected `GET /api/ai-settings` and `PUT /api/ai-settings`.
- [x] Include the router in FastAPI.

### Task 2: Bot Prompt Integration

- [x] Load AI settings in `TelegramConversationService`.
- [x] Pass settings into `build_messages`.
- [x] Keep hidden `DATA_CAPTURE` JSON instruction unchanged.

### Task 3: Frontend Editor

- [x] Add AI settings types and API client helpers.
- [x] Add `/ai-settings` page with structured form and FAQ editor.
- [x] Add sidebar navigation.

### Task 4: Verification And Push

- [x] Run backend tests.
- [x] Run frontend lint/build/audit.
- [ ] Commit and push to GitHub.
