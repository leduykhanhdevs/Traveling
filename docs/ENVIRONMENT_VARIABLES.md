# Environment Variables

## Backend (`apps/backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Runtime: `development`, `test`, `production` |
| `PORT` | Yes | Express port (default: 4000) |
| `APP_URL` | Yes | Public backend URL |
| `CORS_ALLOWED_ORIGINS` | No | Comma-separated production origins |
| `DATABASE_URL` | Yes | PostgreSQL pooled connection |
| `DIRECT_URL` | Yes | PostgreSQL direct connection (migrations) |
| `REDIS_URL` | Yes | Redis connection URL |
| `CLERK_SECRET_KEY` | Yes | Clerk backend secret |
| `CLERK_WEBHOOK_SECRET` | No | Clerk webhook signing secret |
| `SENTRY_DSN` | No | Sentry error monitoring |
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `DEEPL_API_KEY` | Yes | DeepL translation API |
| `GOOGLE_CLOUD_API_KEY` | Yes | Google Cloud (Speech, Vision, Translation) |
| `GOOGLE_PLACES_API_KEY` | Yes | Google Places API |
| `SERPAPI_KEY` | Yes | SerpAPI for Google Maps data |
| `APIFY_API_KEY` | Yes | Apify for social signals |
| `EXCHANGERATE_API_KEY` | Yes | Currency exchange rates |
| `OPENWEATHER_API_KEY` | Yes | Weather data |
| `REVENUECAT_API_KEY` | Yes | RevenueCat subscription API |
| `SEPAY_WEBHOOK_SECRET` | Yes | SePay webhook HMAC secret (32+ chars) |
| `INVITE_TOKEN_SECRET` | Yes | Invite token HMAC secret (32+ chars) |
| `SUPABASE_URL` | No | Supabase Storage URL |
| `SUPABASE_SERVICE_KEY` | No | Supabase service role key |
| `POSTHOG_API_KEY` | No | PostHog analytics |
| `POSTHOG_HOST` | No | PostHog host URL |
| `APPLE_TEAM_ID` | No | Apple Developer Team ID |
| `APPLE_BUNDLE_ID` | No | Apple bundle ID |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Yes | Twilio phone number |

## Web (`apps/web/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend API URL (default: http://localhost:4000) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key (server-side) |
| `CLERK_WEBHOOK_SECRET` | No | Clerk webhook secret |
| `NEXT_PUBLIC_APP_URL` | Yes | Public web app URL |

## Mobile (`apps/mobile/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `EXPO_PUBLIC_API_URL` | Yes | Backend API URL |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `EXPO_PUBLIC_REVENUECAT_API_KEY` | No | RevenueCat API key |

## Security Notes

- **Never** commit `.env` files to git
- Public variables (`NEXT_PUBLIC_*`) are embedded in client bundles — never include secrets
- Backend secrets should only exist server-side
- Use different credentials for development, staging, and production
