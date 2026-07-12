# SECURITY.md

## Security Architecture

Traveling implements multiple layers of security to protect user data and platform integrity.

## Authentication

- **Clerk** handles all authentication (email, Google, Apple OAuth)
- JWT tokens are verified using Clerk's backend SDK
- No passwords are stored in the Traveling database
- Session management is handled by Clerk
- Clerk webhooks are verified using HMAC-SHA256 (Svix)

## Authorization

- **Role-based access control** with roles: USER, MODERATOR, EDITOR, ADMIN, SUPER_ADMIN
- Roles are stored in the database (not client-side)
- Backend enforces permissions on every protected operation
- Ownership checks for user-owned resources
- Admin routes protected by role middleware

## API Security

- Rate limiting via `express-rate-limit` backed by Redis
  - Authenticated: 300 requests/minute
  - Unauthenticated: 60 requests/minute
- Helmet security headers
- CORS allowlist for production origins
- Request validation using Zod schemas
- Request correlation IDs for tracing
- Structured logging with Winston
- No stack traces in production error responses

## Database Security

- PostgreSQL with connection pooling
- Prisma ORM prevents SQL injection
- No secrets stored in database tables
- Soft deletion for content auditability
- Migrations use `prisma migrate` (never `prisma db push` in production)

## Data Protection

- All API traffic should use HTTPS in production
- Sensitive environment variables never exposed to client code
- Uploaded files validated for type and size
- Supabase Storage with signed URLs (when configured)
- No sensitive data in client-side bundles

## Rate Limits

- API: 60 req/min (anonymous), 300 req/min (authenticated)
- Admin operations monitored and logged
- Contact form spam protection

## Audit Logging

- Admin actions create audit log entries
- User activity logged for security review
- PostHog analytics for product events (anonymized when possible)

## Responsible Disclosure

If you discover a security vulnerability in Traveling, please report it privately:

1. **Email:** support@traveling.app
2. **Do not** create a public GitHub issue
3. Include details about the vulnerability and steps to reproduce

We will acknowledge receipt within 48 hours and work toward a resolution.

## Security Checklist

- [ ] All API routes use proper authentication
- [ ] Admin routes use role middleware
- [ ] User-owned resources checked for ownership
- [ ] CORS allowlist configured for production
- [ ] Rate limiting enabled
- [ ] Helmet security headers enabled
- [ ] Database credentials never in code
- [ ] No `.env` files in repository
- [ ] Webhook signatures verified
- [ ] File uploads validated
- [ ] Error responses do not leak stack traces
- [ ] Secrets scanned in git history
