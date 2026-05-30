# Backend Environment Setup

`env.ts` validates backend environment variables at startup with Zod.

## Setup Steps

1. Copy `apps/backend/.env.example` to `apps/backend/.env`.
2. Fill in the required variables with values from each provider dashboard.
3. Start the backend from `apps/backend` or with the backend workspace scripts.
4. If a required variable is missing or empty, startup fails before the API server listens.

## Failure Format

Missing variables are reported by name only:

```txt
Environment validation failed.
Missing required env var: OPENAI_API_KEY
```

Values are never logged.

## Required Backend Variables

- `DATABASE_URL`
- `REDIS_URL`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`
- `DEEPL_API_KEY`
- `GOOGLE_CLOUD_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `SERPAPI_KEY`
- `APIFY_API_KEY`
- `EXCHANGERATE_API_KEY`
- `OPENWEATHER_API_KEY`
- `REVENUECAT_API_KEY`

`APIFY_TOKEN` is accepted as an alias when `APIFY_API_KEY` is not set, but `APIFY_API_KEY` remains the internal config property used by the backend.

## Optional Variables

- `NODE_ENV`
- `PORT`
- `APP_URL`
- `CLERK_WEBHOOK_SECRET`
- `SENTRY_DSN`
- `APIFY_TIKTOK_ACTOR_ID`
- `APIFY_FACEBOOK_ACTOR_ID`
- `FCM_SERVER_KEY`
