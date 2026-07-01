# Multi Admin Telegram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add superadmin/admin users, account-scoped data, admin management, and per-admin Telegram connection from the admin panel.

**Architecture:** Persist users in PostgreSQL and issue JWTs with user id, role, and account id. Scope admin APIs by the authenticated user. Run one Telethon client per connected active account from the worker.

**Tech Stack:** FastAPI, SQLAlchemy async, Alembic, Telethon, Next.js, TypeScript, Tailwind CSS.

## Global Constraints

- The first superadmin is seeded from existing `ADMIN_USERNAME` and `ADMIN_PASSWORD`.
- Regular admins can only access their own account data.
- Superadmin can manage admins and view all leads.
- Telegram sessions remain file based under `sessions/`.
- Do not commit `.env` or Telegram session files.

---

## Tasks

### Task 1: Database Users And Auth

- [x] Add `User` model and migration.
- [x] Add password hashing helpers.
- [x] Seed the first superadmin from env on login.
- [x] Return JWTs with user id, role, and account id.
- [x] Add `/api/auth/me`.
- [x] Add tests for hashing and role payloads.

### Task 2: Scoped Backend APIs

- [x] Add `CurrentUser` dependency and `require_superadmin`.
- [x] Scope leads and chat APIs by account for admins.
- [x] Scope AI settings by current account.
- [x] Add superadmin admin-management endpoints.
- [x] Add tests for account-scoped lead listing.

### Task 3: Telegram Account Connect

- [x] Add Telegram account schemas and endpoints.
- [x] Add code request and code/2FA verification flow.
- [x] Store Telegram login state per account.
- [x] Avoid returning sensitive API hash values.

### Task 4: Multi Account Worker

- [x] Create Telethon clients from database accounts.
- [x] Attach account-specific event handlers.
- [x] Poll for newly connected accounts.
- [x] Keep the old env-based account as a fallback seed path.

### Task 5: Frontend Admin UX

- [x] Add current-user and admin-management API helpers.
- [x] Add `/admins` page for superadmin.
- [x] Add `/telegram` page for Telegram connection.
- [x] Gate sidebar navigation by role.
- [x] Update docs and env examples.

### Task 6: Verification, Commit, Push, Deploy

- [x] Run backend tests and import compile.
- [x] Run frontend lint and build.
- [x] Commit and push to GitHub.
- [x] Deploy backend to the VPS.
- [x] Verify health, auth, PostgreSQL, Redis, Alembic, worker, and new APIs.
