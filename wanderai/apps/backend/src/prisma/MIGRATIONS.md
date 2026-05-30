# Prisma Migration Strategy

This project uses Prisma Migrate with PostgreSQL. Migrations are append-only history once they may have been applied outside a local throwaway database.

## Naming Convention

Use timestamped snake case names:

```txt
YYYYMMDDHHMMSS_description_snake_case
```

Examples:

```txt
20260604143000_add_trip_budget_indexes
20260605110000_add_saved_place_notes
```

## Migration Boundaries

Prefer small domain-focused migrations instead of broad mixed changes:

- `user_*` for identity, profile, and preferences
- `discovery_*` for search history and saved places
- `itinerary_*` for itinerary planning data
- `community_*` for reviews and follows
- `translation_*` for translation cache data
- `utility_*` for emergency contacts, device tokens, weather, and currency utility data
- `billing_*` for subscription and entitlement changes

Avoid combining unrelated domains in one migration unless the change is intentionally atomic.

## Creating a New Migration

1. Update `src/prisma/schema.prisma`.
2. Review the diff and decide the domain name.
3. Create the migration locally:

```bash
npm run prisma:migrate --workspace @wanderai/backend -- --name YYYYMMDDHHMMSS_description_snake_case
```

4. Inspect the generated SQL before committing.
5. Run:

```bash
npm run prisma:generate --workspace @wanderai/backend
npm run typecheck --workspace @wanderai/backend
```

Never edit an existing migration after it may have been applied by another developer or environment.

## Applying Migrations

Development:

```bash
npm run prisma:migrate --workspace @wanderai/backend
```

Production or deployed environments:

```bash
npm run prisma:deploy --workspace @wanderai/backend
```

## Rollback Strategy

Prisma migrations should be treated as forward-only in shared environments.

Preferred rollback approach:

1. Restore from a database backup when data or schema state must be fully reverted.
2. Create a new forward migration that reverses the schema change.
3. For risky releases, deploy additive migrations first, then deploy code that uses them.
4. Avoid destructive changes such as dropping columns until data has been migrated and the old code path is no longer active.

Local-only rollback:

- If a migration was created only on your machine and not shared, reset the local development database if acceptable:

```bash
npx prisma migrate reset --schema src/prisma/schema.prisma
```

Only use local reset when losing local data is acceptable.

## Seed Data

Development seed data lives in `src/prisma/seed.ts`.

Run:

```bash
npm run db:seed --workspace @wanderai/backend
```

Seed records must be fake, safe for development, and idempotent with `upsert`.
