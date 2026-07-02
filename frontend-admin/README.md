# Frontend Admin

Vite React CRM admin panel for Telegram AI Sales Agent.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:5173`.

The frontend expects the backend at `VITE_API_URL`, defaulting to same-origin
`/api`. Vercel rewrites `/api/*` to `http://13.60.104.64`.

For Vercel, set:

```env
VITE_API_URL=
```

Login username and password are configured in the backend `.env` with
`ADMIN_USERNAME` and `ADMIN_PASSWORD`.

The same backend base URL can also be edited from the login page or from
`/settings` after login. The browser stores that override in localStorage.

The AI training page is available at `/ai-settings` after login.

Superadmins can manage users at `/admins`. Every admin can connect their own
Telegram account at `/telegram`.

## Scripts

```bash
npm run lint
npm run build
```
