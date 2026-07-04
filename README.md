# Traveling

Traveling is a cross-platform Expo React Native travel assistant with real-time translation, AI-ranked local discovery, itinerary planning, community reviews, utility widgets, and a freemium upgrade path.

## Architecture

```text
              +-----------------------------+
              |  Expo RN app (Expo Router)  |
              |  Clerk, NativeWind, Zustand |
              +--------------+--------------+
                             |
                       HTTPS / JWT
                             |
       +---------------------v---------------------+
       |       Node 20 Express API (TypeScript)    |
       | Zod, Winston, Clerk JWT, rate limiting    |
       +------+---------+---------+---------+------+
              |         |         |         |
        +-----v--+ +----v----+ +--v----+ +--v-----+
        | Prisma | | Redis   | | GPT-4o| | DeepL  |
        | Postgres| caching | | AI    | | Google |
        +-----+--+ +----+----+ +---+---+ +---+----+
              |         |          |         |
              |   +-----v----------v---------v----------------+
              |   | Google Places, SerpAPI, Apify, Speech,    |
              |   | Vision OCR, ExchangeRate, OpenWeather     |
              |   +-------------------------------------------+
```

## File Tree

```text
traveling/
  apps/
    backend/
      src/
        config/          Environment validation
        controllers/     HTTP controllers
        middleware/      Clerk auth, rate limit, logging, errors
        prisma/          Prisma schema and migration
        routes/          /api/v1 routers
        services/        OpenAI, Places, SerpAPI, Apify, DeepL, Redis, Prisma
        utils/           Errors, hashing, responses
      Dockerfile
      package.json
    mobile/
      app/               Expo Router auth, tabs, screens, paywall
      components/        Glass UI, buttons, cards, controls
      constants/         Theme and options
      hooks/             Location, haptics, voice, document vault
      services/          Backend API clients, analytics, RevenueCat wrapper
      stores/            Zustand preferences, subscription, offline packs
      utils/             Formatters and offline phrase pack generator
      app.json
      eas.json
  packages/
    shared/
      src/
        constants/       App constants and 50+ languages
        schemas/         Zod API contracts
        types/           Shared discovery, translation, itinerary, user types
  .github/workflows/     CI and EAS build workflows
  docker-compose.yml
  turbo.json
```

## First Run

1. Install dependencies:

```bash
npm install
```

2. Create environment files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/mobile/.env.example apps/mobile/.env
```

3. Start local PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

4. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate --workspace @traveling/backend
npm run prisma:migrate --workspace @traveling/backend
```

5. Build the shared package:

```bash
npm run build --workspace @traveling/shared
```

6. Start the backend:

```bash
npm run dev --workspace @traveling/backend
```

7. Start Expo:

```bash
npm run start --workspace @traveling/mobile
```

Expo Go can run the app for core screens. RevenueCat purchases require an EAS development or production build because Expo Go cannot load that native SDK.

## Validation Commands

```bash
npm run typecheck
npm run lint
npm run build
```

Verified locally in this workspace:

```text
npm run typecheck  -> pass
npm run lint       -> pass
npm run build      -> pass
```

## API Overview

Base URL: `http://localhost:4000`

All API responses are structured:

```json
{ "success": true, "data": {} }
```

or:

```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "Human readable", "details": {} } }
```

### Health

`GET /health`

Returns service status and timestamp.

### Discovery

`POST /api/v1/discover`

```json
{
  "query": "lẩu bò",
  "lat": 10.7769,
  "lng": 106.7009,
  "filters": {
    "radiusMeters": 2000,
    "priceRange": [1, 2],
    "dietaryRestrictions": ["halal"],
    "openNow": true
  },
  "surpriseMe": false
}
```

Pipeline: GPT-4o intent parsing, Google Places expanding radius search, SerpAPI Google Maps signals, Apify TikTok/Facebook signals, GPT summaries, composite scoring, Redis caching.

`GET /api/v1/places/:placeId`

Returns Google details plus community reviews.

`POST /api/v1/places/save`

Saves a place for the authenticated user.

### Translation

`POST /api/v1/translate`

```json
{
  "sourceText": "Xin chào",
  "sourceLang": "auto",
  "targetLang": "en"
}
```

DeepL is primary and Google Cloud Translation is fallback. Redis TTL is 24 hours.

`POST /api/v1/translate/ocr`

```json
{
  "imageBase64": "...",
  "targetLang": "en"
}
```

Uses Google Cloud Vision OCR, then translates each text block.

`POST /api/v1/speech/transcribe`

```json
{
  "audioBase64": "...",
  "languageCode": "vi-VN"
}
```

### Itinerary

`POST /api/v1/itineraries/generate`

Generates a GPT-4o day-by-day itinerary and links slots to Places API results.

### Community

`GET /api/v1/community?nationality=Vietnamese&city=Ho%20Chi%20Minh%20City&foodCategory=hotpot`

`POST /api/v1/community/reviews`

`POST /api/v1/community/follow`

### Utilities

`GET /api/v1/utilities/currency?base=USD`

`GET /api/v1/utilities/weather?city=Ho%20Chi%20Minh%20City`

### Profile

`GET /api/v1/profile`

`PUT /api/v1/profile`

Creates or updates the Clerk-linked Traveling profile.

## Deployment

Backend:

```bash
docker build -f apps/backend/Dockerfile -t traveling-backend .
docker run --env-file apps/backend/.env -p 4000:4000 traveling-backend
```

Mobile EAS:

```bash
cd apps/mobile
eas build --platform android --profile production
eas build --platform ios --profile production
```

GitHub Actions includes:

- `ci.yml`: install, Prisma generate/deploy, typecheck, lint, build.
- `eas-build.yml`: manual EAS Android/iOS/all build dispatch.

## Environment Variables

See:

- `apps/backend/.env.example`
- `apps/mobile/.env.example`

No secrets are hardcoded in the project.
