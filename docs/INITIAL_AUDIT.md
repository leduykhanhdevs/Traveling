# Initial Audit Report

**Date:** 2026-07-12
**Auditor:** Production Web Platform Build

---

## 1. Repository Structure

```text
Traveling/
├── apps/
│   ├── backend/          Express + TypeScript REST API
│   │   ├── src/
│   │   │   ├── config/         env.ts (Zod-validated env)
│   │   │   ├── controllers/    HTTP controllers
│   │   │   ├── middleware/     auth, rate-limit, error-handler, correlation-id, request-logger
│   │   │   ├── prisma/        schema.prisma + migrations
│   │   │   ├── routes/        12 route modules
│   │   │   ├── services/      prisma, redis, openai, places, deepl, etc.
│   │   │   └── utils/         errors, hash, http-response, logger
│   │   ├── Dockerfile
│   │   └── package.json       @traveling/backend
│   └── mobile/               Expo React Native app
│       ├── app/              Expo Router (auth, tabs, screens)
│       ├── components/       Glass UI components
│       ├── hooks/            Location, haptics, voice
│       ├── services/         API clients, analytics, RevenueCat
│       ├── stores/           Zustand state
│       └── package.json      @traveling/mobile
├── packages/
│   └── shared/               @traveling/shared
│       └── src/
│           ├── constants/    app.ts, languages.ts
│           ├── schemas/      api.ts (Zod request schemas)
│           └── types/        user, budget, community, discovery, itinerary, translation
├── docker-compose.yml        PostgreSQL 16 + Redis 7
├── turbo.json               Turborepo config
└── package.json             Root workspace config
```

## 2. Technologies and Versions

| Technology | Version | Usage |
|---|---|---|
| Node.js | 20+ | Runtime |
| TypeScript | ~5.5.4 | All packages |
| Express | ^4.19.2 | Backend API |
| Prisma | ^5.19.1 | ORM + migrations |
| PostgreSQL | 16 | Database |
| Redis | 7 | Caching + rate limiting |
| Clerk | Backend ^1.14.1, Expo ^2.19.41 | Authentication |
| Expo | ~54.0.0 | Mobile framework |
| React Native | 0.81.5 | Mobile UI |
| React | 19.1.0 | UI library |
| Zod | ^3.23.8 | Validation |
| Turborepo | ^2.0.14 | Monorepo build |
| Tailwind CSS | ^3.4.10 | Mobile styling (NativeWind) |
| Zustand | ^4.5.5 | Mobile state |
| TanStack Query | ^5.56.2 | Mobile data fetching |
| Sentry | ^8.0.0 (backend), ~7.2.0 (mobile) | Error monitoring |
| RevenueCat | ^8.2.4 | Subscription management |
| PostHog | ^5.39.4 | Analytics |
| Twilio | ^6.0.2 | SOS SMS |
| OpenAI | ^4.58.1 | AI features |

## 3. Database Models (Prisma Schema)

| Model | Description |
|---|---|
| User | Core user with Clerk ID, preferences, dietary, travel style, subscription tier |
| Budget | Travel budget with currency and total |
| BudgetItem | Individual expense within a budget |
| BudgetItemSplit | Split expense between users |
| DeviceToken | Push notification tokens |
| EmergencyContact | User's emergency contacts |
| SearchHistory | Discovery search logs |
| SavedPlace | Bookmarked places |
| Review | Place reviews with ratings, photos, tags |
| Translation | Cached translations (hash-indexed) |
| Itinerary | AI-generated travel itineraries (JSON content) |
| Follow | User follow relationships |
| Post | Community posts with images |
| Comment | Post comments |
| Story | Ephemeral stories with expiration |
| Like | Post likes (unique per user+post) |
| ActivityLog | User activity tracking |
| ViewedPlace | Place view history |
| BankTransferOrder | VND bank transfer payment orders |
| PremiumGrant | Manual premium grants |
| SharedBudget | Budget sharing with roles |
| SharedItinerary | Itinerary sharing with roles |

## 4. API Routes

| Route | Methods | Auth | Description |
|---|---|---|---|
| `/health` | GET | No | Health check |
| `/legal/privacy-policy` | GET | No | Privacy policy HTML |
| `/legal/terms` | GET | No | Terms of service HTML |
| `/api/v1/discover` | POST | Yes | AI-powered place discovery |
| `/api/v1/places/:placeId` | GET | No | Place details |
| `/api/v1/places/save` | POST | No* | Save a place (ISSUE: no auth) |
| `/api/v1/translate` | POST | Yes | Text translation |
| `/api/v1/translate/ocr` | POST | Yes | OCR translation |
| `/api/v1/speech/transcribe` | POST | Yes | Speech transcription |
| `/api/v1/itineraries` | GET, POST, PUT, DELETE | Yes | Itinerary CRUD |
| `/api/v1/itineraries/generate` | POST | Yes | AI itinerary generation |
| `/api/v1/itineraries/:id/share` | POST | Yes | Share itinerary |
| `/api/v1/itineraries/accept-invite` | POST | Yes | Accept itinerary invite |
| `/api/v1/itineraries/:id/replan-weather` | POST | Yes | Weather-based replan |
| `/api/v1/itineraries/:id/export` | POST | Yes | Export itinerary |
| `/api/v1/budget` | GET, POST | Yes | Budget CRUD |
| `/api/v1/budget/:id` | GET | Yes | Budget details |
| `/api/v1/budget/:id/items` | POST | Yes | Add budget item |
| `/api/v1/budget/:id/items/:itemId` | DELETE | Yes | Delete budget item |
| `/api/v1/budget/:id/settlement` | GET | Yes | Budget settlement |
| `/api/v1/budget/:id/share` | POST | Yes | Share budget |
| `/api/v1/budget/accept-invite` | POST | Yes | Accept budget invite |
| `/api/v1/budget/shared` | GET | Yes | Shared budgets |
| `/api/v1/community` | GET | No | Community feed |
| `/api/v1/community/posts` | GET, POST | Mixed | Posts (POST requires auth) |
| `/api/v1/community/posts/:id/comments` | GET, POST | Yes | Post comments |
| `/api/v1/community/posts/:id/like` | POST | Yes | Toggle like |
| `/api/v1/community/reviews` | POST | No* | Create review (ISSUE: no auth) |
| `/api/v1/community/follow` | POST | No* | Follow user (ISSUE: no auth) |
| `/api/v1/community/stories` | GET, POST | Mixed | Stories |
| `/api/v1/profile` | GET, PUT | Yes | User profile |
| `/api/v1/profile/stats` | GET | Yes | Profile statistics |
| `/api/v1/activity/log` | POST | Yes | Log activity |
| `/api/v1/activity/history` | GET | Yes | Activity history |
| `/api/v1/activity/viewed` | POST | Yes | Track viewed place |
| `/api/v1/activity/viewed/history` | GET | Yes | View history |
| `/api/v1/utilities/currency` | GET | No | Currency rates |
| `/api/v1/utilities/currency/convert` | GET | No | Currency conversion |
| `/api/v1/utilities/weather` | GET | No | Weather data |
| `/api/v1/utilities/emergency-contacts` | GET | No | Country emergency contacts |
| `/api/v1/utilities/emergency-contacts/personal` | GET, POST | Yes | Personal emergency contacts |
| `/api/v1/utilities/sos` | POST | Yes | SOS alert |
| `/api/v1/utilities/device-token` | POST | Yes | Register push token |
| `/api/v1/utilities/push/send` | POST | Yes | Send push notification |
| `/api/v1/utilities/sos/push` | POST | Yes | SOS push notification |
| `/api/v1/payments/bank-transfer/create` | POST | Yes | Create bank transfer order |
| `/api/v1/payments/bank-transfer` | GET | Yes | List bank transfer orders |
| `/api/v1/payments/bank-transfer/webhook` | POST | No | SePay webhook |
| `/api/v1/upload/url` | POST | Yes | Get upload URL |

## 5. Security Issues Found

1. **`/api/v1/places/save`** — No `requireAuth` middleware; any request can save places
2. **`/api/v1/community/reviews`** — No `requireAuth`; unauthenticated review creation
3. **`/api/v1/community/follow`** — No `requireAuth`; unauthenticated follow action
4. **No admin role system** — No role field on User model, no admin middleware
5. **No webhook signature verification visible** in routes (webhook.routes uses raw body but controller verification needs review)
6. **Twilio credentials required** even when SOS may not work properly
7. **Many env vars marked required** that are optional services (SERPAPI, APIFY, etc.)

## 6. Missing for Web Platform

- No `apps/web` directory
- No user roles (USER, ADMIN, MODERATOR, etc.)
- No admin panel or admin API routes
- No public content models (Destination, Blog, FAQ, Guide, Contact, Newsletter)
- No Clerk webhook handler for user sync
- No account deletion endpoint
- No user data export
- No content moderation system
- No audit logging for admin actions
- No feature flags
- No notification system
- No SEO infrastructure

## 7. What Can Be Reused

- ✅ Prisma schema (extend with new models)
- ✅ Clerk authentication (add web SDK)
- ✅ Express backend structure
- ✅ Zod validation schemas
- ✅ Shared types package
- ✅ Redis caching infrastructure
- ✅ Rate limiting
- ✅ Error handling patterns
- ✅ Docker Compose setup
- ✅ CI workflow (extend)
- ✅ APP_COLORS design tokens
- ✅ SUPPORTED_LANGUAGES for i18n
- ✅ QUERY_TIERS for entitlement checks

## 8. Proposed Architecture for Web

```text
apps/web (Next.js 15 + App Router)
  ├── Public marketing pages (SSR/SSG)
  ├── Clerk authentication (sign-in, sign-up, etc.)
  ├── Protected /app/* routes
  ├── Admin /admin/* routes
  ├── i18n (vi + en)
  ├── shadcn/ui component system
  └── Tailwind CSS styling

Backend API additions:
  ├── /api/v1/admin/* (role-protected)
  ├── /api/v1/destinations (public content)
  ├── /api/v1/blog (public content)
  ├── /api/v1/faq (public content)
  ├── /api/v1/contact (form submission)
  ├── /api/v1/newsletter (subscription)
  └── /api/v1/webhooks/clerk (user sync)
```
