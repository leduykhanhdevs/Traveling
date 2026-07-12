# Architecture

## System Overview

```text
                   User (Browser)
                        |
                   Next.js (SSR/SSG)
                   apps/web (Vercel)
                        |
                    HTTPS/JWT
                        |
              Express API (backend)
              Clerk JWT auth, Zod validation
              Rate limiting (Redis)
                        |
           +------------+------------+
           |                         |
      PostgreSQL 16            Redis 7
      (Prisma ORM)          (caching/rate-limit)
           |
      External Services:
      - OpenAI (AI features)
      - Google Places (discovery)
      - DeepL (translation)
      - Clerk (auth)
      - RevenueCat (subscriptions)
```

## Communication Flow

1. **Public pages** (/) — Next.js SSR/SSG, no auth needed
2. **Authenticated pages** (/app/*) — Clerk middleware protects routes at Edge level
3. **API calls** — Frontend sends JWT token from Clerk; backend verifies token
4. **Webhooks** — Clerk webhooks sync user data to PostgreSQL via backend API

## Key Design Decisions

### Why Next.js + Express (not monolithic Next.js API)
- The existing Express backend is well-established with integration-heavy features (OpenAI streaming, Redis, complex middleware)
- Separating concerns allows independent scaling
- Mobile app already uses the same API

### Why Clerk for auth
- Already implemented for mobile and backend
- Handles OAuth, MFA, session management out of the box
- Edge-friendly with Next.js middleware

### Why PostgreSQL + Prisma
- Existing architecture
- Strong migration system
- Type-safe queries with Prisma Client
- Excellent for complex queries with 20+ models

## Repository Structure

```text
Traveling/
├── apps/
│   ├── backend/     Express API (ports, controllers, middleware, routes, services)
│   ├── mobile/      Expo React Native (Expo Router, Clerk, NativeWind)
│   └── web/         Next.js App Router (public + app + admin)
├── packages/
│   └── shared/      Zod schemas, TypeScript types, constants
├── docs/
├── scripts/
├── docker-compose.yml
└── turbo.json
```

## Route Design

Public pages use `apps/web/src/app/(public)/` route group.
App pages use `apps/web/src/app/app/` with app layout.
Admin pages use `apps/web/src/app/admin/` with admin layout.
Auth pages are at root level (`/sign-in`, `/sign-up`).

## Authentication Flow

1. User visits protected route → Clerk middleware checks session
2. If no session → redirect to `/sign-in`
3. Sign-in/sign-up uses Clerk UI components
4. After auth → redirect to `/onboarding` (first time) or `/app/dashboard`
5. API calls include JWT in Authorization header
6. Backend verifies JWT via Clerk SDK
7. Webhook handler synchronizes user to database

## API Response Format

Success:
```json
{ "success": true, "data": {} }
```

Error:
```json
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }
```
