# Vite Admin Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Next.js admin panel with a Vite React SPA that deploys cleanly to Vercel and still talks to the existing FastAPI backend.

**Architecture:** Keep `frontend-admin` as the frontend folder, but replace Next app routing with `react-router-dom`. Reuse existing Tailwind components and API helpers. Configure Vercel to install/build the Vite app and serve `frontend-admin/dist`.

**Tech Stack:** React 19, TypeScript, Vite, React Router, Tailwind CSS, FastAPI backend.

## Global Constraints

- Keep existing backend API paths and payloads.
- Keep `/api/ai-settings/pause` support for global AI pause.
- Do not use Next.js or `.next` output.
- Vercel output directory is `frontend-admin/dist`.
- Verify frontend install, lint, and build before push.
- Verify backend tests before push.

---

### Task 1: Replace Frontend Tooling

**Files:**
- Modify: `frontend-admin/package.json`
- Modify: `frontend-admin/tsconfig.json`
- Modify: `frontend-admin/eslint.config.mjs`
- Create: `frontend-admin/index.html`
- Create: `frontend-admin/vite.config.ts`
- Delete: `frontend-admin/next.config.mjs`
- Delete: `frontend-admin/next-env.d.ts`

**Interfaces:**
- Produces Vite scripts: `dev`, `build`, `preview`, `lint`.
- Produces TypeScript path alias `@/*`.

- [x] Replace `next` scripts with Vite scripts.
- [x] Replace Next dependencies with Vite dependencies.
- [x] Add Vite HTML entry.
- [x] Add Vite config with React plugin and `@` alias.
- [x] Remove Next-only config files.

### Task 2: Add SPA Entry And Routing

**Files:**
- Create: `frontend-admin/src/main.tsx`
- Create: `frontend-admin/src/App.tsx`
- Move/adapt page code from `frontend-admin/app/*/page.tsx`.

**Interfaces:**
- Produces React Router routes for `/`, `/login`, `/dashboard`, `/leads/:id`, `/ai-settings`, `/telegram`, `/admins`, `/settings`.

- [x] Add root React entry.
- [x] Add app router.
- [x] Replace `next/navigation` usage with React Router hooks.
- [x] Redirect `/` to `/dashboard`.

### Task 3: Move Styles And Components

**Files:**
- Move/adapt: `frontend-admin/app/globals.css` to `frontend-admin/src/globals.css`
- Modify imports that referenced Next paths.

**Interfaces:**
- Produces one global stylesheet imported by `src/main.tsx`.

- [x] Move global CSS into Vite source tree.
- [x] Preserve Tailwind directives and design tokens.
- [x] Keep existing component API stable.

### Task 4: Configure Vercel For Vite

**Files:**
- Modify: `vercel.json`

**Interfaces:**
- Produces build output at `frontend-admin/dist`.

- [x] Set install command to `npm --prefix frontend-admin ci`.
- [x] Set build command to `npm --prefix frontend-admin run build`.
- [x] Set output directory to `frontend-admin/dist`.

### Task 5: Verify And Push

**Files:**
- No new source files.

**Interfaces:**
- Produces a pushed GitHub commit ready for Vercel redeploy.

- [x] Run backend tests with Python 3.11.
- [x] Run frontend `npm ci`.
- [x] Run frontend lint.
- [x] Run frontend build.
- [x] Commit and push to `master`.
