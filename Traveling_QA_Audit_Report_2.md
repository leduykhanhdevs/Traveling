# Traveling — QA Audit Report

Repo: `leduykhanhdevs/Traveling` · Commit at audit time: `d9b140d` (branch `master`)
Stack: Turborepo · Expo Router (RN 0.81 / Expo ~54) · Express/TypeScript backend · Prisma/PostgreSQL · Redis · Clerk auth

Everything below was **verified by actually running the project** (`npm install`, `npm run typecheck`, `npm run lint`, `npm test` in both workspaces) and by reading the referenced source files — this is not a static guess from the README.

## Ground truth right now

| Check | Backend | Mobile |
|---|---|---|
| `npm run typecheck` | ❌ 5 errors | ✅ pass |
| `npm run lint` | ❌ 1 error | ❌ 24 errors, 1 warning |
| `npm test` | ✅ 71/71 pass | ✅ 41/41 pass |

The README's "Verified locally... typecheck/lint/build -> pass" section is stale and currently false. CI (`.github/workflows/ci.yml`) would fail on any real push right now — see P1-6 below for why it also silently never runs on `master`.

---

## P0 — Critical (safety, security, money-loss risk)

**P0-1. The SOS button does not actually contact anyone.**
`sendSOSAlert()` in `apps/backend/src/services/utility.service.ts` (~L390-437) builds the alert message and location link, then does this:
```ts
console.info('[WIRE_UP_TWILIO_LATER] SOS alert queued', { ... });
```
No SMS, call, or push notification is ever sent. It still returns `sent: true`, and the mobile `SOSButton.tsx` shows the user *"SOS alert queued for N emergency contact(s)."* A traveler in a real emergency will believe help was contacted when nothing left the server. This is the single highest-risk item in the app and must not ship as-is — either wire up a real channel (Twilio SMS, Expo Push to the contact if they're also a user, etc.) or the UI must not claim success.

**P0-2. Broken access control: any user can push-notify any other user.**
`POST /api/v1/utilities/push/send` → `postPushNotification` (`controllers/utility.controller.ts` ~L127) only checks that *a* valid token was supplied (`requireUserId(req.auth?.userId, ...)`). It never checks that `body.userId` (the target) equals `req.auth.userId`. Any logged-in user can send an arbitrary title/body push notification to **any other user** by guessing/knowing their Clerk user id. This is a harassment/phishing vector through the app's own trusted push channel.

**P0-3. IDOR on itineraries — no ownership checks.**
In `apps/backend/src/controllers/itinerary.controller.ts`:
- `getItineraryById` — `prisma.itinerary.findUnique({ where: { id } })`, no `userId` filter.
- `putItinerary` — `prisma.itinerary.update({ where: { id }, data: { content } })`, no ownership check, and `content` is taken from `req.body` with **zero schema validation**.
- `deleteItinerary` — `prisma.itinerary.delete({ where: { id } })`, no ownership check.
- `postExportItinerary` — exports a PDF for any itinerary id, no ownership check.

Any authenticated user can view, silently overwrite, delete, or export-as-PDF **any other user's itinerary** just by knowing/guessing its id. The fix pattern already exists correctly elsewhere in this same codebase — see `getOwnedBudget(budgetId, userId)` in `services/budget.service.ts` — it just wasn't applied to itineraries.

**P0-4. Unauthenticated + spoofable `userId` on `/discover`.**
`discover.routes.ts` has no `requireAuth`. `postDiscover` does:
```ts
userId: req.auth?.userId ?? body.userId,
```
`discoverRequestSchema` allows an optional client-supplied `userId`. When the caller is unauthenticated, `persistSearchHistory()` (`services/recommendation.service.ts` ~L118-148) will happily write a fake `SearchHistory` row under **whatever Clerk user id the request body contains** — a spoofing/IDOR path with no auth at all. (The same fallback pattern exists in `postGenerateItinerary`, but that route sits behind `itineraryRouter.use(requireAuth)`, so it's currently dead code there rather than exploitable — still worth cleaning up for consistency.)

**P0-5. Cost-incurring AI endpoints are wide open to the internet.**
None of these require login, and are only covered by a shared 60 req/min-per-IP limiter:
- `POST /api/v1/discover` — triggers GPT-4o intent parsing + Google Places + SerpAPI + Apify per call.
- `POST /api/v1/translate` and `POST /api/v1/translate/ocr` — DeepL/Google Translate + Vision OCR.
- `POST /api/v1/speech/transcribe` — Speech-to-Text.

Combined with the global `express.json({ limit: '20mb' })` body limit (OCR/speech payloads are base64 images/audio), this is a real financial-DoS surface once production API keys are live: an anonymous script can run up your OpenAI/Google/SerpAPI/Apify bill indefinitely.

**P0-6. The freemium paywall is not enforced anywhere.**
`QUERY_TIERS` (`packages/shared/src/constants/app.ts`) is defined and correctly returned by `getEntitlementStatus()` (which does call the real RevenueCat REST API), but **no controller ever checks it**. `discover`, `translate`, and `itinerary/generate` never look at tier or track a usage counter. Today, every user — free or not — has unlimited AI usage. This needs a request-count-per-day (Redis is already in the stack) gate before launch, or the subscription model has no teeth.

---

## P1 — High (release blockers / compliance / correctness)

**P1-1. Legal pages are placeholder text, served live.**
`apps/backend/src/routes/legal.routes.ts` serves `/legal/privacy-policy` and `/legal/terms` — the exact URLs the in-app Privacy/Terms screens open — and they still contain literal `[YOUR_COMPANY_NAME]`, `[YOUR_EMAIL]`, `[EFFECTIVE_DATE]`, `[REPLACE_BEFORE_SUBMIT]` tokens. This will fail App Store/Play Store review and is not a valid legal document as-is.

**P1-2. Apple Team ID placeholder breaks universal links.**
`server.ts` serves `/.well-known/apple-app-site-association` with `appID: 'YOUR_TEAM_ID.com.traveling.app'`. Deep links (`applinks:traveling.app` for `/discover/*`, `/itinerary/*`) will not work on iOS until the real Apple Developer Team ID is filled in.

**P1-3. EAS / App Store Connect are not configured.**
- `apps/mobile/app.json` → `extra.eas.projectId = "replace-with-eas-project-id"`
- `apps/mobile/eas.json` → `submit.production.ios.ascAppId = "replace-with-app-store-connect-id"`

These require Khanh's own Expo and Apple Developer accounts — an AI agent cannot generate real values here. Flagged as a **stop-and-ask** item.

**P1-4. CI never runs on the real default branch.**
`.github/workflows/ci.yml` triggers on `push: branches: [main]`, but `git remote show origin` confirms the actual default/only branch is `master`. Every push to `master` silently skips CI; only pull requests trigger it. This is the same class of bug noted in earlier WanderAI audits and is still present.

**P1-5. No production app icon / splash / adaptive icon.**
`apps/mobile/app.json` has no `icon`, `splash`, or Android `adaptiveIcon` keys at all — a store submission today ships with Expo's default icon.

**P1-6. Backend TypeScript errors (5), real bugs, not noise:**
- `profile.controller.ts:85,88` — implicit `any` on `it`/`pl` params.
- `services/utility.service.ts:414,511` — implicit `any` on `recipient`/`deviceToken` params.
- `prisma/seed.ts:70` — references `Prisma.InputJsonObject`, which no longer exists on the generated client (seed script is currently broken).

**P1-7. Backend + mobile ESLint errors (25 total):**
- Backend: 1 explicit `any` in `services/activity.service.ts:7`.
- Mobile: 24 errors across 9 files — dead mock leftovers (`MockPost`, `initialComments`, unused `TravelerBadge`/`TripCard`/`LanguagePicker` imports) and 13 `no-explicit-any` violations, including `post.author as any` in `community/index.tsx`, which is masking a real type mismatch between the API response shape and the UI's expected author type.

**P1-8. Duplicate Prisma migration.**
`migrations/20260601000000_add_device_token` and `migrations/20260606000000_add_device_token` create the same `DeviceToken` table — the second one wraps everything in `IF NOT EXISTS`/`DO $$ ... END $$` guards purely to avoid erupting on databases where the first migration already ran. This is migration-history damage that should be squashed before locking a production baseline, or fresh environments and drift-detection tooling will behave inconsistently.

---

## P2 — Medium (features that exist for show / are not actually usable yet)

**P2-1. "Edit Profile" cannot edit anything.**
`apps/mobile/app/(tabs)/profile/edit.tsx` is a static card with descriptive text ("...you can configure them securely during onboarding or directly update them on this page in future updates.") — there is no form, no input, no save action.

**P2-2. "Account Settings" and "Notifications" screens are the same pattern** — static informational text only, no working toggles, no way to actually change any setting from inside the app.

**P2-3. Community "Stories" bar is fully fake.**
The horizontal stories row at the top of the Community tab is a hardcoded array of 6 fictional travelers (Maya Chen, Leo Martin, An Nguyen, Sara Kim, Noah Wells, Lina Ortiz) shown identically to every user, and the "Add Story" button has no `onPress` handler at all — tapping it does nothing.

**P2-4. "Adventure Seeker" badge on the profile screen is a hardcoded string**, not derived from any real user activity or preference data.

**P2-5. Rate limiter won't survive horizontal scaling.**
`express-rate-limit` uses its default in-memory store. Fine for one process; once the backend runs as 2+ instances behind a load balancer, each instance tracks its own counters, so the effective global rate limit multiplies by instance count — quietly weakening every limit in P0-5.

**P2-6. Document Vault isn't actually safe or durable at scale.**
`useDocumentVault.ts` stores a growing JSON array of document metadata inside `expo-secure-store`, which is backed by iOS Keychain / Android Keystore and has a small practical per-key size ceiling — this will start throwing write errors once a traveler saves several passport/visa photos. The actual image files are copied to plain, unencrypted app storage (`FileSystem.documentDirectory`) — for a feature marketed as a secure vault for ID documents, that's a meaningful gap.

---

## P3 — Low (tech debt / forward compatibility, not urgent but will bite later)

- `expo-file-system/legacy` and `expo-av` are used directly (`useDocumentVault.ts`, `useVoiceRecorder.ts`). Both are deprecated compatibility shims in Expo SDK 54 and are on Expo's removal path — migrate to the modern `expo-file-system` API and `expo-audio` before the next SDK bump breaks the build.
- `react-test-renderer` is deprecated upstream (React team warning shown in every mobile test run); plan a migration to `@testing-library/react-native`.
- Backend `Dockerfile` runs the final container as root (no `USER` directive) — minor hardening gap for a production image.

---

## What's already solid (don't let an agent "fix" these)

- Clerk JWT verification in `middleware/auth.ts` is done correctly via `@clerk/backend`'s `verifyToken` — not hand-rolled, no algorithm-confusion risk.
- Prisma schema has consistent `onDelete: Cascade` and indexes across all relations.
- `services/budget.service.ts` already implements the *correct* per-user ownership pattern (`getOwnedBudget`) — this is the template to copy for the itinerary fix in P0-3.
- Community post/comment/like endpoints correctly scope every write to `req.auth.userId`, not a client-supplied id.
- The Expo Push notification *mechanism* itself (`sendPushNotification`) is a real, correct integration with Expo's push API — P0-2 is purely a missing authorization check, not a missing feature.
- All 71 backend tests and all 41 mobile tests currently pass.

---

## What's still missing / worth adding for a real launch (not bugs, but gaps)

- No per-user daily/monthly usage counters backing the freemium tiers (needed to make P0-6 enforceable — Redis is already available for this).
- No RevenueCat webhook receiver for real-time entitlement changes (current design polls RevenueCat's REST API on profile fetch only — acceptable, but note it for when you add active subscription-lifecycle emails/notifications).
- No automated E2E test coverage (only unit/service-level Jest tests exist today).
- No structured onboarding flow to actually collect the dietary/travel-style preferences that the Edit Profile screen claims will "shape your AI itinerary recommendation signals."
