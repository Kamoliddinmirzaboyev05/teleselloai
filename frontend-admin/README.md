# Frontend Admin

Next.js CRM admin panel for Telegram AI Sales Agent.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open `http://localhost:3000`.

The frontend expects the backend at `NEXT_PUBLIC_API_URL`, defaulting to
`http://localhost:8000`.

For Vercel, set:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain
```

Login username and password are configured in the backend `.env` with
`ADMIN_USERNAME` and `ADMIN_PASSWORD`.

The AI training page is available at `/ai-settings` after login.

## Scripts

```bash
npm run lint
npm run build
```
