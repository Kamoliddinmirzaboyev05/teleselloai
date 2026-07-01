# Multi Admin Telegram Design

## Goal

Allow multiple people to use the CRM at the same time. The owner is a
superadmin. Other users are admins with their own Telegram account, leads, AI
settings, and chat history.

## Roles

- `superadmin`: can create, view, update, and deactivate admins. Can view all
  leads.
- `admin`: can view and operate only their own account data.

## Data Model

Add a `users` table. Each user owns one `accounts` row. Existing `accounts`
continue to store Telegram credentials and session metadata. Lead and settings
queries are scoped by the current user's account unless the user is superadmin.

The first login seeds the superadmin from `ADMIN_USERNAME` and
`ADMIN_PASSWORD` if no database users exist.

## Telegram Connection

Admins configure Telegram credentials from the admin panel. The backend stores
`telegram_api_id`, `telegram_api_hash`, `telegram_phone`, and a generated
session name on their account. The panel starts login, sends the Telegram code,
then verifies the code and optional two-step password.

## Worker

The worker starts one Telethon client per active connected account and polls for
newly connected accounts. Incoming and outgoing messages are handled with the
account id captured in the event handler, so leads and AI settings stay isolated.

## Frontend

Add:

- `/admins` for superadmin user management.
- `/telegram` for each user to connect their Telegram account.
- Sidebar navigation gated by role.

## Verification

Backend unit tests cover password hashing, role checks, and account-scoped lead
queries. Frontend lint and build must pass.
