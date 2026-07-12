# Production Checklist

## Environment & Secrets

- [ ] All required environment variables configured
- [ ] Production Clerk keys (not development keys)
- [ ] Production database credentials
- [ ] Production Redis URL
- [ ] All API keys are production keys
- [ ] No test/placeholder credentials
- [ ] `.env` files not in git
- [ ] Secrets scanned from git history

## Database

- [ ] Migrations applied successfully
- [ ] Connection pooling configured
- [ ] Database backups enabled
- [ ] Indexes created for common queries
- [ ] Seed data loaded (destinations, FAQs, help content)

## Authentication

- [ ] Clerk production app created
- [ ] Redirect URLs configured
- [ ] Webhook endpoint configured and verified
- [ ] Email templates customized (optional)
- [ ] OAuth providers configured (if used)

## Security

- [ ] HTTPS enforced everywhere
- [ ] CORS allowlist configured for production domains
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] No stack traces in error responses
- [ ] Admin roles assigned correctly
- [ ] Webhook signatures verified

## Performance

- [ ] Redis caching enabled
- [ ] Static pages use SSG where possible
- [ ] Images optimized
- [ ] Code splitting configured
- [ ] Lighthouse scores acceptable (Performance > 85, Accessibility > 90)

## Monitoring

- [ ] Sentry configured and receiving errors
- [ ] PostHog analytics tracking events
- [ ] Uptime monitoring configured
- [ ] Database health checks enabled

## SEO

- [ ] Sitemap generated
- [ ] Robots.txt configured
- [ ] Open Graph tags on public pages
- [ ] Structured data on appropriate pages
- [ ] Canonical URLs set

## Legal

- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Contact email configured
- [ ] Cookie policy published (if cookies used beyond auth)

## Content

- [ ] Homepage complete
- [ ] All public pages complete
- [ ] Help center populated
- [ ] FAQ content added
- [ ] Testimonials are real or marked as editorial samples

## Functionality

- [ ] Sign up flow works end-to-end
- [ ] Sign in flow works
- [ ] Password reset works
- [ ] Email verification works
- [ ] Dashboard loads user data
- [ ] Discovery search returns results
- [ ] Translation works
- [ ] Itinerary creation works
- [ ] Budget creation works
- [ ] Saved places works
- [ ] Community posts work
- [ ] Admin panel access restricted to admins

## Mobile App (if deploying)

- [ ] EAS build configured
- [ ] App Store assets prepared
- [ ] TestFlight/Internal testing complete
- [ ] Production build tested

## Rollback Plan

- [ ] Database backup before deployment
- [ ] Previous version tagged in git
- [ ] Vercel instant rollback available
- [ ] Backend container versioned
