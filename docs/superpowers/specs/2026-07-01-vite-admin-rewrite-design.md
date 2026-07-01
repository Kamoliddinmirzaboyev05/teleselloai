# Vite Admin Rewrite Design

## Goal

Replace the `frontend-admin` Next.js application with a Vite React application that deploys to Vercel as a normal static frontend and keeps the existing CRM behavior.

## Problem

The current Next.js deployment has repeatedly failed on Vercel because the repository is a multi-folder project and the app lives under `frontend-admin`. The user wants the admin frontend rebuilt with React/Vite to avoid `.next`, Next-specific routing, and Vercel monorepo output confusion.

The browser 404 errors are a separate backend deployment mismatch: production has `/api/telegram-account`, but does not yet have `/api/ai-settings/pause`. The frontend rewrite must keep calling that endpoint, and the backend changes already committed must be deployed to the VPS.

## Architecture

`frontend-admin` becomes a Vite React + TypeScript SPA. Routing moves from Next app routes to `react-router-dom`. Existing UI components, Tailwind styling, API helpers, auth token handling, and page logic are reused where possible.

Vercel builds the app with `npm --prefix frontend-admin ci && npm --prefix frontend-admin run build` and serves `frontend-admin/dist`.

## Pages

- `/login`
- `/dashboard`
- `/leads/:id`
- `/ai-settings`
- `/telegram`
- `/admins`
- `/settings`
- `/` redirects to `/dashboard`

## Constraints

- Keep the existing backend API contract.
- Keep the global AI pause endpoint `/api/ai-settings/pause`.
- Do not introduce server-side rendering.
- Use Vite output directory `dist`.
- Keep Tailwind and the current component styling.
- Vercel config must not rely on `.next`.

## Verification

- `npm --prefix frontend-admin ci`
- `npm --prefix frontend-admin run lint`
- `npm --prefix frontend-admin run build`
- `PYTHONPATH=. pytest` in `bot-backend` with Python 3.11
- Production backend routes must be checked after VPS deploy: `/api/health`, `/api/telegram-account`, `/api/ai-settings/pause`
