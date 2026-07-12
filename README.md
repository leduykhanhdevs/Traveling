# Traveling

A cross-platform travel assistant with AI-powered discovery, real-time translation, itinerary planning, budget management, community features, and a complete public web platform.

## Architecture

```text
Traveling Monorepo
├── apps/
│   ├── backend/      Express + TypeScript REST API (PostgreSQL, Redis, Clerk)
│   ├── mobile/       Expo React Native mobile app (iOS + Android)
│   └── web/          Next.js App Router public website + web application
├── packages/
│   └── shared/       Shared Zod schemas, TypeScript types, constants
├── docker-compose.yml
├── turbo.json
└── docs/
```

## Repository

```bash
git clone https://github.com/leduykhanhdevs/Traveling D:\DuAn\Traveling
cd D:\DuAn\Traveling
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+ (or `docker compose up -d postgres`)
- Redis 7+ (or `docker compose up -d redis`)
- Clerk account (free tier)
- API keys for external services (see environment setup)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Environment setup

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/web/.env.example apps/web/.env
cp apps/mobile/.env.example apps/mobile/.env
```

Edit each `.env` file with your credentials. See [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) for details.

### 3. Start database and Redis

```bash
docker compose up -d postgres redis
```

### 4. Setup database

```bash
npm run db:generate
npm run db:migrate
```

### 5. Start development

```bash
# All apps (backend, web, mobile)
npm run dev

# Or individually:
npm run dev --workspace=@traveling/backend   # API on :4000
npm run dev --workspace=@traveling/web       # Web app on :3000
npm run dev --workspace=@traveling/mobile    # Expo on :8081
```

## What's Included

### Public Website (`apps/web`)
- Home page, About, Features, Pricing, Destinations, Discover, Community
- Help Center with user guides
- Privacy, Terms, Cookies, Security, Accessibility, Contact pages
- SEO-optimized with SSR/SSG, Open Graph, sitemap, structured data
- Vietnamese and English support

### Web Application (`apps/web/app`)
- User dashboard with real data overview
- AI-powered place discovery
- Itinerary planning and management
- Text translation center
- Budget tracking with expense management
- Saved places management
- Community feed with posts, likes, and comments
- Profile and settings

### Admin Portal (`apps/web/admin`)
- Admin dashboard with platform analytics
- User management
- Content, reports, subscriptions management
- Role-protected routes (USER, ADMIN, SUPER_ADMIN)

### Backend API (`apps/backend`)
- RESTful API at `/api/v1/*`
- Clerk JWT authentication
- PostgresQL with Prisma ORM
- Redis caching and rate limiting
- OpenAI, DeepL, Google Places integrations
- Comprehensive error handling and logging

### Mobile App (`apps/mobile`)
- Expo React Native (iOS + Android)
- All core features with native UI
- Expo Router navigation
- Clerk authentication
- RevenueCat subscriptions

## Validation Commands

```bash
npm run typecheck
npm run lint
npm run build
npm test
npm run env:audit
```

## Environment Variables

See [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) for the complete matrix of all environment variables across all applications.

## Database

- PostgreSQL 16 with Prisma ORM
- 20+ models covering users, budgets, itineraries, community, payments, and admin
- See [docs/DATABASE.md](docs/DATABASE.md) for schema details

## Documentation

| Document | Description |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture and design decisions |
| [docs/ENVIRONMENT_VARIABLES.md](docs/ENVIRONMENT_VARIABLES.md) | All environment variables with descriptions |
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema, models, and migrations |
| [docs/API.md](docs/API.md) | API endpoints and usage |
| [docs/WEB_GUIDE.md](docs/WEB_GUIDE.md) | Web application guide |
| [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md) | Admin portal guide |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deployment instructions |
| [docs/SECURITY.md](docs/SECURITY.md) | Security architecture |
| [docs/TESTING.md](docs/TESTING.md) | Testing guide |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues |
| [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) | Pre-launch checklist |

## Features

- **Smart Discovery** — AI-powered place recommendations with dietary, budget, and preference filters
- **Itinerary Planning** — AI-generated day-by-day travel itineraries
- **Real-time Translation** — 50+ languages via DeepL and Google
- **OCR Translation** — Camera translation for menus and signs (Premium)
- **Voice Translation** — Speech-to-text and translation (Premium)
- **Budget Management** — Track expenses, split costs, manage currencies
- **Saved Places** — Bookmark and organize your favorite spots
- **Travel Community** — Posts, reviews, likes, comments, follows
- **Weather & Currency** — Real-time weather and exchange rates
- **Safety Tools** — Emergency contacts and SOS alerts
- **Premium Subscriptions** — Unlimited access to advanced features

## Security

- Clerk enterprise authentication
- JWT-based API authorization
- Role-based access control (USER, MODERATOR, ADMIN, SUPER_ADMIN)
- Rate limiting via Redis
- Input validation via Zod
- Helmet security headers
- Audit logging for admin actions
- CORS allowlist
- No secrets in code

See `SECURITY.md` for responsible disclosure.

## Deployment

- **Web:** Vercel with `vercel.json`
- **Backend:** Docker container on Railway / Render / Fly.io
- **Database:** Supabase / Neon PostgreSQL
- **Redis:** Upstash / any Redis provider
- **Storage:** Supabase Storage / Cloudinary

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

## License

Private — internal project.
