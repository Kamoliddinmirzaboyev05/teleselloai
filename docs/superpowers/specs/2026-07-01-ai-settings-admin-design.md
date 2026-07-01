# AI Settings Admin Design

## Goal

Let the admin train the sales agent from the admin panel without editing code.

## Scope

The feature stores one global AI settings document in the existing `settings`
table under the key `ai_settings`. The MVP does not add multiple prompt
versions, per-account settings, or file uploads.

## Backend

Add protected endpoints:

- `GET /api/ai-settings`
- `PUT /api/ai-settings`

The settings document contains business name, business description, services,
pricing, target customers, tone, languages, required lead fields, forbidden
phrases, escalation rules, custom instructions, and FAQ pairs.

The bot loads the settings before each Groq call and injects them into the
system prompt while preserving the required hidden `DATA_CAPTURE` JSON contract.

## Frontend

Add `/ai-settings` to the admin panel. The page has structured fields and a FAQ
editor so the admin can add question/answer examples. Saving writes to the
backend API. The sidebar gets an AI settings navigation button.

## Verification

Backend tests cover prompt rendering and settings normalization. Frontend lint
and build must pass.
