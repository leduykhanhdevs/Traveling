
# Traveling — Round 2 Audit (Delta Report)

Re-cloned and re-ran everything fresh: `1dbfb06` (branch `master`, commit msg: "fix: resolve EAS build errors..."). Compared against the Round 1 report line by line, verified in code, not assumed.

## Ground truth right now

| Check | Backend | Mobile |
|---|---|---|
| `npm run typecheck` | ❌ 1 error (new regression, see below) | ✅ pass |
| `npm run lint` | ✅ pass | ✅ pass |
| `npm test` | ❌ 12/71 failing (new regression) | not re-checked this round |

## 🆕 New regressions introduced by the Round 1 fix pass (fix these first — they block everything else)

**R2-1. Backend does not compile.** `apps/backend/src/controllers/discover.controller.ts` calls `checkAndIncrementUsage(...)` but never imports it — every other controller that added the same quota check (`translate.controller.ts`, `speech.controller.ts`, `itinerary.controller.ts`) imports it correctly; only `discover.controller.ts` is missing `import { checkAndIncrementUsage } from '../services/billing.service.js';`. Right now `npm run typecheck` and `npm run build` both fail on this — the backend literally cannot be built or deployed until this one-line import is added.

**R2-2. 12 backend tests now fail because a shared test mock wasn't updated.** `apps/backend/src/__tests__/external-service-mocks.ts` mocks `../services/redis.service.js` as:
```ts
jest.mock('../services/redis.service.js', () => ({
  closeRedis: jest.fn(),
  getCacheJson: jest.fn(),
  setCacheJson: jest.fn(),
}));
```
This mock predates the new `checkAndIncrementUsage()` quota logic, which needs the raw `redis` client (`redis.incr(...)`, `redis.expire(...)`). Since the mock doesn't export `redis` at all, every test that exercises a quota-checked controller now crashes with `Cannot read properties of undefined (reading 'incr')`. Affected suites: `discover.controller.test.ts`, `translate.controller.test.ts`, `speech.controller.test.ts`, `itinerary.controller.test.ts` (12 tests total). Fix: add `redis: { incr: jest.fn().mockResolvedValue(1), expire: jest.fn() }` (or similar) to this shared mock.

**R2-3. One stale test asserts the old, now-intentionally-blocked behavior.** `utility.controller.test.ts` → "sends a push notification to a target user" still expects `200` when sending to a different user than the authenticated caller. That's exactly the vulnerability that was correctly fixed (P0-2) — the code now correctly returns `403`, but this test wasn't updated to match and needs to be rewritten to assert the new, correct behavior (and ideally a second case should assert `200` when the target equals the caller).

**R2-4. Minor: Android adaptive icon has no safe-zone padding.** `assets/images/icon.png` and `assets/images/adaptive-icon.png` are byte-for-byte identical. Android masks adaptive icons into circles/squircles/rounded squares and expects the foreground layer's visible content confined to roughly the center 66%; reusing the full square icon as-is will likely get the logo cropped on many Android launchers. Not urgent, but easy to fix while other icon work is happening.

**R2-5. Minor: duplicate permission entries.** `apps/mobile/app.json` → `android.permissions` lists the same 5 permissions twice, once in short form (`"CAMERA"`) and once fully-qualified (`"android.permission.CAMERA"`). Harmless (Expo will likely de-dupe at prebuild) but should be cleaned to one form.

---

## ✅ Confirmed fixed since Round 1 (verified in code, not just trusted)

- **P0-2 (push notification authorization)** — fixed correctly; `postPushNotification` now rejects with `403` if `body.userId !== req.auth.userId`.
- **P0-3 (itinerary IDOR)** — fixed correctly; `getItineraryById`/`putItinerary`/`deleteItinerary` all now resolve the Prisma `User` row from the auth token and scope the query with `findFirst({ where: { id, userId } })` before acting.
- **P0-4 (discover/itinerary userId spoofing)** — fixed; the `req.auth?.userId ?? body.userId` fallback is gone, `discoverRouter` now requires auth, and the controller uses `req.auth!.userId` directly.
- **P0-5 (unauthenticated cost endpoints)** — fixed; `discover`, `translate`, `translate/ocr`, and `speech/transcribe` all now sit behind `requireAuth`.
- **P0-6 (freemium enforcement)** — implemented correctly in principle: `checkAndIncrementUsage()` uses real per-user, per-day Redis counters (`usage:{userId}:{feature}:{date}`, 24h TTL) checked against `QUERY_TIERS`, premium users bypass it via `getEntitlementStatus`. (Currently broken at runtime only because of R2-1/R2-2 above — the logic itself is sound.)
- **P1-1 (legal page placeholders)** — the literal `[YOUR_EMAIL]`/`[YOUR_COMPANY_NAME]` tokens are gone, replaced with `support@traveling.app` throughout. Confirm you actually control the `traveling.app` domain/mailbox before submission; otherwise swap in whatever domain/email you do control.
- **P1-3a (EAS project ID)** — `app.json` now has a real-shaped UUID instead of the placeholder string.
- **P1-4 (CI branch mismatch)** — fixed; both `push` and `pull_request` triggers now target `master`, matching the actual default branch.
- **P1-5 (no app icon/splash)** — fixed; real 1024×1024 icon/splash/adaptive-icon PNGs are wired up in `app.json` (see R2-4 for the one remaining nit).
- **P1-6/P1-7 (backend TS + lint errors)** — all resolved; both `typecheck`(once R2-1 is patched) and `lint` are clean on backend and mobile.
- **P1-8 (duplicate Prisma migration)** — the two `add_device_token` migrations were squashed into one.
- **P2-4 (hardcoded "Adventure Seeker" badge)** — fixed properly; `travelerTitle` is now derived from real `stats` (`countriesVisited`, `tripsPlanned`, `placesSaved`) with several real tiers ("World Explorer", "Local Guide", "Travel Planner", etc.), not a hardcoded string.
- **P2-5 (rate limiter not distributed)** — fixed; `apiRateLimiter` now uses `rate-limit-redis` backed by the shared Redis client instead of the in-memory default store.
- **P3 (deprecated `expo-av` / `expo-file-system/legacy`)** — fixed; `useVoiceRecorder.ts` now uses `expo-audio`, and `useDocumentVault.ts`/`useVoiceRecorder.ts` use the modern `expo-file-system` (`File`, `Paths`) API.
- **P3 (Dockerfile running as root)** — fixed; final stage now has `USER node`.

## ⚠️ Partially fixed — looks done, isn't fully done underneath

- **P2-1/P2-2 (Edit Profile / Account / Notifications were static stubs)** — no longer static: Edit Profile now has real text inputs and calls `PUT` to save; Account and Notifications now have real, working `Switch` toggles that persist to `expo-secure-store`. **However**, the "Biometric Lock" and "Two-Factor Authentication" toggles in Account settings don't actually do anything beyond saving a flag — there is no `expo-local-authentication` gate anywhere in the app that checks the biometrics flag on launch, and no call to Clerk's real MFA/2FA enrollment API for the twoFactor flag. Today, turning these "on" gives the user false confidence that a security feature is active when it isn't — a smaller-scale version of the original SOS problem. Either wire these up for real or remove them until they can be.
- **P2-3 (fake Community "Stories")** — the "Add Story" button is no longer a dead no-op, but the fix is explicitly commented `// Basic mock behavior` in the code: tapping it inserts a local-only, non-persistent "You" story card that vanishes on app restart, with no image, no upload, and no backend model behind it at all. The 5 hardcoded fictional travelers (Maya Chen, Leo Martin, etc.) are still shown to every real user. This still needs a real decision: build it for real (backend model + upload) or remove it — see the master prompt below.

## ❌ Still not fixed

- **P0-1 (SOS is fake) — the single highest-priority item from Round 1 was not touched.** `sendSOSAlert()` still only does `console.info('[WIRE_UP_TWILIO_LATER] SOS alert queued', ...)` and returns `sent: true`. This remains the most important thing to fix in this codebase before any real user relies on it.
- **P1-2 (Apple Team ID placeholder)** — still `TEAM123456.com.traveling.app` in `server.ts`. This is expected to still be a placeholder (it requires your real Apple Developer Team ID), correctly left unfabricated rather than guessed.
- **P1-3b (App Store Connect ID)** — `eas.json` → `submit.production.ios.ascAppId` is still a placeholder (`"1234567890"`). Same as above — needs your real ASC app ID once the app exists there.
- **P2-6 (Document Vault storage design)** — unchanged: document metadata is still stored as a single growing JSON blob in `expo-secure-store` (small per-key size ceiling on iOS Keychain/Android Keystore — will eventually throw once several documents are saved), and the actual photos are still copied to plain, unencrypted app storage despite being sold as a secure vault for ID documents.
