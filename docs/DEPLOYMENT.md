# Deployment Guide

## Prerequisites

- Vercel account (for web)
- Railway/Render/Fly.io account (for backend)
- PostgreSQL database (Supabase, Neon, or self-hosted)
- Redis instance (Upstash or self-hosted)
- Clerk application (production keys)
- All required API keys

## Backend Deployment

### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and create project
railway login
railway init

# Add PostgreSQL and Redis
railway add --plugin postgresql
railway add --plugin redis

# Set environment variables
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
# ... set all other variables

# Deploy
railway up
```

### Option 2: Docker

```bash
docker build -f apps/backend/Dockerfile -t traveling-backend .
docker run -p 4000:4000 --env-file apps/backend/.env traveling-backend
```

### Option 3: Render

1. Connect GitHub repository
2. Create new Web Service
3. Set build command: `npm ci && npm run build --workspace=@traveling/backend`
4. Set start command: `npm run start --workspace=@traveling/backend`
5. Add environment variables

## Web Deployment (Vercel)

1. Connect GitHub repository
2. Root directory: `apps/web`
3. Framework preset: Next.js
4. Build command: `npm run build`
5. Output directory: `.next`
6. Add environment variables:
   - `NEXT_PUBLIC_API_URL` = your backend URL
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = Clerk production key
   - `CLERK_SECRET_KEY` = Clerk production secret

## Database Migrations

Run migrations before deploying new code:

```bash
# Set production DATABASE_URL
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy --schema apps/backend/src/prisma/schema.prisma
```

## Clerk Configuration

1. Create production application in Clerk Dashboard
2. Configure allowed redirect URLs:
   - `https://yourdomain.com/**`
   - `https://yourdomain.com/app/**`
3. Configure webhook endpoint:
   - URL: `https://api.yourdomain.com/api/v1/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`
4. Copy production keys to environment variables

## Post-Deployment Checklist

- [ ] Backend health check returns 200: `GET /health`
- [ ] Web loads without errors
- [ ] Sign up creates user in database
- [ ] Sign in works correctly
- [ ] Protected routes redirect when not authenticated
- [ ] API calls include authentication
- [ ] Rate limiting is working
- [ ] Error logging to Sentry
- [ ] Analytics tracking to PostHog

## Monitoring

- **Sentry**: Error tracking and performance
- **PostHog**: Product analytics
- **Vercel**: Web deployment logs and analytics
- **Railway/Render**: Backend logs and metrics
