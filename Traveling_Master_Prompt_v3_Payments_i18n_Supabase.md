tđ# Paste this into Antigravity IDE (Agent Manager, Agent-Assisted mode)

Before pasting: this prompt is self-contained and doesn't require the older audit files, though keeping them in the repo for history doesn't hurt.

```
## Role
You are a senior full-stack engineer (Node/TypeScript/Express/Prisma + Expo React Native) taking this app from "mostly working" to genuinely production-grade: correct, professional, and honest about what it does. This app has real money (subscriptions), a safety feature (SOS), and will have real users in multiple countries. Nothing in this pass may be fake, mocked, or hardcoded sample data — every feature you touch or add must read/write real data through the database. Do not invent business details (real legal text guarantees, real bank credentials beyond what's given below, real Apple/Google IDs). Where a real external value is required and you don't have it, insert a clearly marked placeholder AND add it to the Setup Checklist at the end.

## Context
- Monorepo: Turborepo, npm workspaces (`apps/backend`, `apps/mobile`, `packages/shared`).
- Backend: Express + TypeScript + Prisma/PostgreSQL + Redis + Clerk auth.
- Mobile: Expo Router + React Native 0.81 / Expo ~54.
- Existing patterns to reuse, don't reinvent: `checkAndIncrementUsage` (Redis daily quota, `billing.service.ts`) for usage limits; `findFirst({ where: { id, userId } })` ownership checks (see `itinerary.controller.ts`, `budget.service.ts`) for any per-user resource; `getEntitlementStatus()` for premium checks.
- The bank account for manual bank-transfer payments: **MB Bank, account number 190720060000**, account holder name to be confirmed by Khanh (put a placeholder and flag it in the Setup Checklist — don't guess the name).
- **Compliance constraint, non-negotiable:** in-app unlocking of VIP/premium via IAP (RevenueCat, Apple Pay/Google Pay included automatically) is the primary and only in-app purchase path. The bank-transfer/VietQR option must be presented as an external payment link that opens in the system browser (`Linking.openURL`), never a purchase flow embedded inside the compiled app UI. This keeps the app compliant with Apple/Google store policy. Do not blur this line even if it seems like it would be a smoother UX — flag it and ask instead of merging the two flows.

Produce an Artifact (task list / implementation plan) covering all phases below before writing code.

---

## Phase 0 — Hotfix leftover regressions
1. `apps/backend/src/services/utility.service.ts` line ~418: the `contact` parameter in the `recipients.map(async (contact) => ...)` callback inside `sendSOSAlert` is implicitly `any`. Give it the correct type (whatever `toEmergencyContactSummary` returns).
2. `apps/mobile/hooks/useDocumentVault.ts`: still calls the legacy `FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })` and `FileSystem.deleteAsync`, which don't exist on the modern `expo-file-system` API already imported in this file. Replace with the modern `File` class equivalent (read the installed `expo-file-system` type definitions to find the correct method — don't guess) to get a base64 string and delete the temp camera file. Also remove the now-unused `useMemo` import in the same file.
3. Confirm `npm run typecheck` and `npm run lint` are clean in both workspaces, and `npm test` passes in backend, before moving on. Output `✅ Phase 0 complete`.

## Phase 1 — Real purchase flow (prerequisite for everything else — nothing below matters if no one can actually pay)
1. `apps/mobile/services/revenuecat.ts` is currently a stub that never calls the SDK. Implement it for real using the already-installed `react-native-purchases`: `Purchases.configure({ apiKey, appUserID: clerkUserId })` on app start (skip gracefully in Expo Go, as the current stub already detects), fetch real offerings/packages, expose a function to purchase a package, and a function to restore purchases.
2. `apps/mobile/app/paywall.tsx`: wire the "Continue"/purchase button to actually call the purchase function from step 1, handle success (proceed) and failure/cancellation (show a clear error, stay on paywall) — it currently just calls `router.back()` and does nothing.
3. After a successful purchase (or on app foreground / profile screen mount), fetch real entitlement status from the backend (`GET /api/v1/profile` already calls `getEntitlementStatus`) and call `useSubscriptionStore.setTier(...)` with the real value — this is currently never called anywhere, so the app has no idea if a user is actually premium. Add a restore-purchases button somewhere reachable (e.g. account settings).
4. Fix the paywall's feature comparison table — it currently claims "Camera translate / Itinerary planner / Offline packs: No" for free users, but the backend actually allows free users a daily quota for the first two, and (until Phase 4 below) has zero gating on the third. Make the copy match what's actually enforced once you finish Phases 3-4, not before.
5. Checkpoint: `✅ Phase 1 complete`. This must genuinely work (test with a RevenueCat sandbox/test account) before Phase 2's premium features mean anything.

## Phase 2 — Bank-transfer payment option (Vietnam) — external web checkout, not embedded in-app purchase
This is an *additional* way to pay, alongside IAP from Phase 1 — not a replacement, and it must not be embedded as an in-app purchase flow per the compliance constraint above.
1. Sign up is a human step (Khanh's), but build the integration fully: use **SePay** or **PayOS/Casso** (research both briefly, pick one, state why in your summary — both support MB Bank, webhook-based auto-confirmation, and a free/cheap tier for low volume). Add the required env vars to `.env.example` (API key / webhook secret) — do not fabricate real keys.
2. New Prisma models: `BankTransferOrder` (`id`, `userId`, `planCode` (e.g. `monthly`, `yearly`), `amount`, `currency`, `transferContent` (unique code embedded in the transfer memo, e.g. `VIP-{userId-fragment}-{orderId-fragment}`), `status` (`pending`/`paid`/`expired`/`cancelled`), `paidAt`, `expiresAt`, `createdAt`) and `PremiumGrant` (`id`, `userId`, `source` (`revenuecat`/`bank_transfer`/`manual`), `expiresAt`, `createdAt`) — a bank-transfer purchase is a fixed-term grant, not an auto-renewing subscription, so it needs an explicit expiry you check, unlike RevenueCat.
3. `POST /api/v1/payments/bank-transfer/create` (authenticated): creates a `BankTransferOrder`, generates a VietQR image URL via the free `https://api.vietqr.io/image/<bankBin>-<accountNumber>-<template>.jpg?amount=<amount>&addInfo=<transferContent>&accountName=<name>` pattern (MB Bank's NAPAS BIN is `970422` — verify this against VietQR's bank list rather than assuming), and returns the QR image URL + raw transfer details (account number, content, amount) for display.
4. `POST /api/v1/payments/bank-transfer/webhook`: receives the provider's webhook, **verifies its signature** (per the provider's docs — do not accept unsigned webhooks), matches the incoming transfer's content/amount against a pending `BankTransferOrder`, and if it matches: mark the order `paid`, create/extend a `PremiumGrant` for that user, and (if you build push notifications for this) notify the user their VIP is active. Make this idempotent (unique constraint on the provider's transaction id, so retried webhooks don't double-grant).
5. `getEntitlementStatus()` in `billing.service.ts` must now check **both** RevenueCat *and* an unexpired `PremiumGrant` for that user, returning `premium` if either says so.
6. Mobile: on the paywall, add a second, clearly distinct option ("Thanh toán qua chuyển khoản ngân hàng") that calls the create-order endpoint and opens the returned checkout info in the system browser or a simple in-app screen showing the QR code + bank details (display only — no purchase SDK involved), then polls or lets the user manually refresh to see when their order is confirmed.
7. Add simple internal endpoints (reuse the `x-admin-key` pattern from any existing admin scaffolding, or add one if it doesn't exist yet) so Khanh can look up pending/paid bank-transfer orders without needing a full dashboard yet.
8. Checkpoint: `✅ Phase 2 complete`.

## Phase 3 — New premium features (must be real, backend-enforced, not client-only flags)
Build these on top of the tier check from Phase 1/2 (`getEntitlementStatus`), enforcing every cap server-side:
1. **Ad-free** — hide sponsored banners for premium users (if the sponsored-banner feature from an earlier pass exists in this codebase; if not, skip this bullet).
2. **Enhanced SOS** — add a free-tier cap on emergency contacts (e.g. 3; there is currently no cap for anyone), bypassed for premium. Never cap the basic "attempt to send" capability itself for free users, only the contact count.
3. **Unlimited saves** — remove/raise the free-tier cap on saved itineraries, document vault entries, and offline phrase packs (once Phase 4 makes phrase packs real) for premium users; enforce a sensible free-tier cap for each (e.g. 1 active itinerary, 3 vault documents, 1 phrase pack) if none exists yet.
4. **Group budget splitting** (new): allow a `Budget` to have multiple participants (new join table, e.g. `BudgetParticipant`), each `BudgetItem` optionally assigned to one or more participants with a split rule (equal / custom amounts), and a settlement summary endpoint ("who owes whom"). Premium-only to create a shared budget; anyone invited can view/contribute.
5. **Multi-trip collaboration** (new): allow an itinerary to have collaborators (new join table, e.g. `ItineraryCollaborator` with a role), invited by email/username, who can view and (if editor role) edit. Premium-only for the owner to invite collaborators.
6. **Weather-aware re-planning** (new): using the existing OpenWeather integration, add an endpoint that checks the weather for an itinerary's dates/location and flags days likely to be disrupted (rain/extreme heat), with a button to regenerate just the affected day via the existing itinerary-generation AI pipeline. Premium-only.
7. **Branded PDF export** — if itinerary PDF export already exists, make the premium version remove any "free tier" watermark/branding if one exists, or add one to the free version if none currently exists to distinguish the tiers.
8. **"Pro Traveler" badge** — shown next to the user's name in Community posts and on their profile, purely derived from `getEntitlementStatus`/the synced `useSubscriptionStore` tier, no new backend model needed.
9. Update the paywall screen to accurately list all of these.
10. Checkpoint: `✅ Phase 3 complete`.

## Phase 4 — Real, complete internationalization (i18n)
1. Add a proper i18n library (`i18next` + `react-i18next`, with `expo-localization` to detect device locale as the default) to the mobile app.
2. Support at least these 10 languages (adjust only if you find a strong reason, and say why): **Vietnamese, English, Chinese (Simplified), Spanish, Hindi, French, Arabic, Portuguese, Russian, Japanese.** Note Arabic needs RTL layout support — check that the app's layout doesn't hard-assume LTR in places that would break (flex directions, icon placement); Expo Router / React Native support `I18nManager.forceRTL`.
3. Add a language-selection step to the existing onboarding flow (`apps/mobile/app/(auth)/onboarding.tsx`), defaulting to the detected device locale, letting the user override. Persist the choice both locally (so it applies instantly on next launch) and to the backend: add an `appLocale` field to the `User` Prisma model (separate from the existing `preferredLanguage`, which is the default *translation target* language for the Translate feature — a different concept, don't conflate them) so the choice follows the user across devices.
4. Extract every hardcoded user-facing string in the app into translation keys, organized by screen/feature namespace (e.g. `common.json`, `profile.json`, `community.json`, `paywall.json`, `sos.json`, etc.), starting with the highest-traffic screens (tab bar, onboarding, paywall, profile, SOS) and working outward. This is the single largest task in this phase — budget real time for it and do it thoroughly rather than partially.
5. Translate the legal pages (`apps/backend/src/routes/legal.routes.ts`) into all 10 languages as well, served based on an `?lang=` param or `Accept-Language` header, defaulting to English. **Flag clearly in your final summary that AI-translated legal/Terms/Privacy content should get a human legal review before relying on it** — mistranslated legal text carries real risk, more than a mistranslated button label does.
6. Machine-translate the initial content for all 10 languages (you can reuse the existing DeepL/Google Translate service already integrated in this backend to generate first-draft translations programmatically rather than writing each by hand) but structure the translation files so a human can review/edit them file-by-file later — don't hardcode machine output in a way that's hard to revise.
7. Checkpoint: `✅ Phase 4 complete`, with an honest note on i18n coverage — if you didn't get to 100% string extraction, say exactly what's left rather than implying it's done.

## Phase 5 — No more fake data anywhere
1. **Offline phrasebook** (`apps/mobile/utils/offlinePhrases.ts`): `buildOfflinePhrasePack()` currently generates 500 template strings like "Essential food phrase 42" with no real translation. Replace this with real content: curate a list of ~50-100 genuinely essential travel phrases in English (arrival, food, emergency, shopping, transport, hotel, small talk — reuse the existing categories), then use the backend's existing translation service to pre-generate real translations into each of the 10 languages from Phase 4, cached/seeded so users don't re-hit the translation API every time they download a pack. Store these as real seed data, not generated at request time from a template.
2. **Community "Stories"** (`apps/mobile/app/(tabs)/community/index.tsx`): currently 5 hardcoded fictional travelers plus a local-only, non-persistent "Add Story" mock. Build this for real: a `Story` model on the backend (author, image/text content, expiry — e.g. 24h like typical stories features), real upload endpoint, and a feed query that returns stories from people the user follows (reuse existing follow data) plus their own. Remove every hardcoded fictional person.
3. Search the codebase for any other hardcoded arrays of fictional people/places/content you find while working through the other phases, and replace or remove them under the same standard — nothing user-facing should be fake data going forward.
4. Checkpoint: `✅ Phase 5 complete`.

## Phase 6 — Database: migrate to Supabase-hosted PostgreSQL + use Supabase Storage
Note for you (the agent) to explain back to Khanh, not to skip past: Supabase's database *is* PostgreSQL — this isn't "two databases," it's "use Supabase as the managed Postgres host," which needs zero Prisma schema changes, just a connection string swap. Actual project creation requires Khanh's own Supabase account login — you cannot provision it without that, so treat account creation as a stop-and-ask step, but do everything else end to end.
1. Document the exact steps for Khanh: create a Supabase project at supabase.com (free tier), copy the connection string (use the *pooled* connection string for the running app, and the *direct* connection string for running migrations), set `DATABASE_URL` (and `DIRECT_URL` if you set up Prisma's `directUrl` for migrations, which is the correct pattern for pooled Postgres providers) in `.env`.
2. Update `apps/backend/src/prisma/schema.prisma`'s datasource block to support both `url` (pooled, `?pgbouncer=true`) and `directUrl` (for migrations), per Prisma's documented pattern for PgBouncer-fronted Postgres.
3. Add all new models from Phases 2, 3, 5 (`BankTransferOrder`, `PremiumGrant`, `BudgetParticipant`, `ItineraryCollaborator`, `Story`) and the new `User.appLocale` field to the schema, generate the migration, and document the exact `npx prisma migrate deploy` command Khanh needs to run once his Supabase project exists (you can run `prisma migrate dev` locally against a local Postgres to generate and validate the migration file itself, even without live Supabase credentials).
4. For file storage (banner images if that feature exists, document vault cloud backups, story images from Phase 5, user avatars if not already handled by Clerk): use **Supabase Storage** instead of storing large blobs in Postgres or leaving them device-local only. Set up a storage bucket, and a small backend service module for upload/signed-URL generation using the Supabase service-role key (server-side only, never shipped to the client).
5. Note clearly in your summary: since Clerk remains the auth provider (not Supabase Auth), Supabase's Row Level Security won't automatically apply the way it would in a pure-Supabase-Auth app — access control continues to be enforced in the Express backend via Clerk-verified `req.auth.userId`, exactly as it is today. This is fine and correct, just worth Khanh understanding so he doesn't expect RLS to be doing anything here.
6. Checkpoint: `✅ Phase 6 complete`.

## Phase 7 — General professional polish
Use your judgment here, but at minimum:
1. Consistent loading states and error boundaries across screens that fetch data (no blank screens or unhandled promise rejections visible to the user).
2. Consistent empty states (e.g. "no itineraries yet" with a call to action) anywhere a list can be empty.
3. Double-check every new endpoint from this pass has proper Zod validation on input, matching the existing style in the codebase.
4. Double-check every new per-user resource (bank transfer orders, budget participants, itinerary collaborators, stories) has a proper ownership/authorization check, following the existing `findFirst({ where: { id, userId } })` pattern.

## Phase 8 — Verification
1. `npm run typecheck`, `npm run lint`, `npm test` clean in both workspaces.
2. Write tests for: the bank-transfer webhook (valid signature/match, invalid signature rejected, duplicate webhook doesn't double-grant), each new premium cap (free blocked, premium not blocked), and the i18n language-switch persisting correctly.
3. Produce a final Artifact summarizing every phase, files touched, what's real vs. deferred, and one consolidated, numbered Setup Checklist grouped by urgency, including at minimum: Supabase account/project creation, SePay/PayOS account + MB Bank linking + webhook secret, RevenueCat product/offering configuration in App Store Connect & Play Console, the account holder name for the MB Bank transfer display, and a recommendation to get the translated legal pages reviewed by someone fluent (or a professional translator) before relying on them.

## Allowed actions
- Edit/create files inside `apps/backend/src`, `apps/mobile`, `packages/shared/src`, add new Prisma migrations, add new npm dependencies needed for i18n/payments/storage from public registries already used in this project (explain each new dependency in your checkpoint output).
- Run `npm install`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, local `docker compose up -d postgres redis` for verification against a local Postgres before real Supabase credentials exist.

## Forbidden actions
- Do NOT embed the bank-transfer payment flow as an in-app purchase UI competing with IAP — external browser/QR-display only, per the compliance constraint at the top.
- Do NOT invent a real Supabase project, real SePay/PayOS API keys, a real App Store Connect/Play Console configuration, or a real bank account holder name. Placeholders only, always in the Setup Checklist.
- Do NOT accept an unsigned/unverified bank-transfer webhook as proof of payment.
- Do NOT ship any new "offline pack" or "story" content that isn't real, seeded, database-backed data.
- Do NOT touch `.env` files (only `.env.example`), `package-lock.json`, `node_modules`.
- Do NOT push to git or open a PR — leave changes local for Khanh to review.

## Stop and ask before
- Choosing SePay vs. PayOS if you can't find a clear enough reason to prefer one — state your default pick and proceed, but flag it.
- Any change that would affect real user data non-reversibly.
- Adding a paid dependency/service not implied by what's already in `.env.example` or this prompt.

## Output format
After each phase: `✅ Phase N complete` + bullet list of `[what changed] — [file(s)]`.
At the very end: the consolidated, numbered Setup Checklist described in Phase 8.3.
```

🎯 Target: Google Antigravity IDE (Gemini 3 Pro/3.5 Flash agent). This is a large, multi-day-scale prompt — consider letting the agent run phase-by-phase with your review between phases rather than unattended end-to-end, especially around Phase 1 (real purchases) and Phase 2 (real money via bank transfer).
