# Security Notice

Sensitive environment files were accidentally present in the repository working tree and may have been tracked or exposed before being removed from Git tracking.

Do not commit real secrets. Keep only `.env.example` files in Git.

## Rotate Before Further Use

Rotate or revoke and recreate every credential that may have appeared in `apps/backend/.env` or `apps/mobile/.env`:

- OpenAI API key
- Google Places API key
- Clerk publishable key and secret key
- RevenueCat API key
- SerpAPI key
- Apify API key
- Redis URL or password
- PostgreSQL connection string

## Recommended Follow-Up

1. Rotate the keys in each provider dashboard.
2. Update local `.env` files with the new values.
3. Update deployment environment variables in the hosting provider.
4. Review Git history and hosted remotes for prior exposure.
5. If these secrets were pushed to any remote repository, treat them as compromised even after removal from tracking.

No keys were rotated or modified by this cleanup.
