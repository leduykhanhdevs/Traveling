# Paste this into Antigravity IDE (Agent Manager, Agent-Assisted mode recommended)

Before pasting: put `Traveling_QA_Audit_Report.md` in the repo root next to `package.json`. The prompt below tells the agent to read it first.

```
## Role
You are a senior full-stack engineer (Node/TypeScript/Express/Prisma + Expo React Native) doing a pre-launch hardening pass on a real app that real travelers will use, including a safety feature (SOS). Correctness and honesty of user-facing claims matter more than speed. Base every fix strictly on what you find in this repository — do not invent business details (company name, email, legal text, API keys, team IDs). Where a real value is required and you don't have it, insert a clearly marked placeholder AND add it to the Setup Checklist you output at the end, instead of guessing.

## Context (carry forward)
- Monorepo: Turborepo, npm workspaces (`apps/backend`, `apps/mobile`, `packages/shared`).
- Backend: Express + TypeScript + Prisma/PostgreSQL + Redis + Clerk auth, `apps/backend`.
- Mobile: Expo Router + React Native 0.81 / Expo ~54, `apps/mobile`.
- `Traveling_QA_Audit_Report.md` in the repo root contains the full verified findings (exact files, line numbers, severity). Read it fully before making any change. It was produced by actually running `npm install`, `npm run typecheck`, `npm run lint`, and `npm test` in both workspaces — trust its findings over your own first impression of the code.
- A correct ownership-check pattern already exists in `apps/backend/src/services/budget.service.ts` (`getOwnedBudget`). Reuse this exact pattern for the itinerary fix instead of inventing a new one.

## Objective
Work through the audit report phase by phase, fixing every P0 and P1 item for real (not stubs, not TODO comments where a real fix is possible), fix what you reasonably can from P2/P3, and stop cleanly at anything that requires a human to supply real-world credentials, accounts, or business/legal information.

## Phases — produce an Artifact (task list) for this plan before touching code, then execute in order

**Phase 0 — Baseline**
1. `npm install`, then `npm run build --workspace @traveling/shared`.
2. Run `npm run typecheck` and `npm run lint` in both `apps/backend` and `apps/mobile`, and `npm test` in both. Record the current pass/fail state so you can prove improvement at the end.

**Phase 1 — Safety and security (P0), in this order**
1. **SOS (P0-1):** Do not leave this as a fake success path. Either (a) wire up a real delivery channel for the SOS message using a provider already reasonable for this stack (e.g. an SMS API), gated behind a new required env var with a clear `.env.example` entry, and make `sent` reflect what actually happened (partial failures per recipient should be reported, not swallowed) — or, if no real provider can be wired without a credential you don't have, change the API and UI so they never claim `sent: true` / "alert queued" unless something real was dispatched, and clearly surface to the user which channel (if any) is live vs. degrade to "call/text your contact directly" guidance. Do not ship a UI that claims success when nothing was sent.
2. **Push notification authorization (P0-2):** In `postPushNotification`, require that the target `userId` equals `req.auth.userId`, UNLESS you find a legitimate product reason for user-to-user notifications elsewhere in the codebase — if so, stop and ask; otherwise lock it down.
3. **Itinerary IDOR (P0-3):** Add ownership checks to `getItineraryById`, `putItinerary`, `deleteItinerary`, and whatever `postExportItinerary` calls, following the exact `getOwnedBudget(id, userId)` pattern from `budget.service.ts`. Also add proper Zod validation for `putItinerary`'s body instead of a raw destructure.
4. **Discover spoofing (P0-4):** Remove the `req.auth?.userId ?? body.userId` fallback pattern in `postDiscover` and `postGenerateItinerary`. Require the userId to come only from `req.auth`, and only persist search history / associate data when the request is authenticated. Drop `userId` from the client-facing request schemas if it's no longer needed once this is fixed.
5. **Unauthenticated cost endpoints (P0-5):** Add `requireAuth` to `/api/v1/discover`, `/api/v1/translate`, `/api/v1/translate/ocr`, and `/api/v1/speech/transcribe`, unless there is a clear product reason to keep anonymous access (e.g. a deliberate try-before-signup flow) — if you believe that's the intent, stop and ask instead of assuming. If auth is added, also tighten the anonymous-vs-authenticated rate limit split in `middleware/rate-limit.ts` accordingly.
6. **Freemium enforcement (P0-6):** Implement real per-user usage tracking (daily counters in Redis, since it's already in the stack) against `QUERY_TIERS`, enforced in the discover/translate/itinerary-generate controllers, returning a clear `429`/`FORBIDDEN`-style error with an upgrade prompt once a free user's daily limit is hit. Premium users (per `getEntitlementStatus`) bypass the limit.
7. Checkpoint: re-run typecheck/lint/tests for backend. Output `✅ Phase 1 complete` with a bullet per fix and the files touched.

**Phase 2 — Release blockers (P1)**
1. Fix the legal pages (P1-1): keep the existing structure/styling in `legal.routes.ts`, but replace the placeholder tokens with clearly marked, obviously-fake-but-valid-shaped placeholders (e.g. `support@REPLACE-ME.example`) ONLY if you cannot find real values elsewhere in the repo (README, `.env.example`, etc.) — do not invent a real company name or email. List every remaining placeholder in the final Setup Checklist.
2. Fix the CI branch mismatch (P1-4): change `.github/workflows/ci.yml` to trigger on `master` (the repo's actual default branch), not `main`.
3. Fix the 5 backend TypeScript errors and the 1 backend lint error listed in the audit report (implicit `any` params, the stale `Prisma.InputJsonObject` reference in `seed.ts`, the explicit `any` in `activity.service.ts`). Verify the fix for `seed.ts` by checking what type Prisma 5.19's generated client actually exports for JSON input fields — don't guess a type name.
4. Fix all 24 mobile lint errors: remove genuinely-dead code (`MockPost`, `initialComments`, unused imports) rather than prefixing with `_` to silence the linter, and replace every `no-explicit-any` with a real type — in particular, fix the `post.author as any` cast in `community/index.tsx` by correcting the actual type mismatch between the community API response and the UI's expected shape (read both sides before typing).
5. Squash the duplicate `add_device_token` Prisma migrations (P1-8) into a single clean migration, and confirm `prisma migrate deploy` still applies cleanly against a fresh database — do not touch migrations that don't need it.
6. For anything requiring real external accounts (Apple Team ID, EAS project id, App Store Connect id, app icon/splash art, `.env` provider keys) — do NOT invent values. Leave the existing clearly-named placeholders in place and list every one of them in the final Setup Checklist.
7. Checkpoint: re-run typecheck/lint/tests for both workspaces. Output `✅ Phase 2 complete` with results.

**Phase 3 — Finish the half-built UX (P2), best effort**
1. Make "Edit Profile" actually edit something real: at minimum, wire up the fields the screen's own copy promises (preferred language, travel style, dietary restrictions) to the existing `PUT /api/v1/profile` endpoint and Prisma `User` model — check the schema for what's already there before adding new columns.
2. Either implement a real notification-preferences toggle backed by a persisted setting, or, if that's out of scope for this pass, remove the misleading claims from the Notifications/Account screens' copy so they don't promise controls that don't exist. Prefer implementing over rewriting copy if the underlying data model already supports it.
3. Community "Stories" (P2-3): either remove the fake hardcoded stories row and "Add Story" button entirely, or clearly stop and ask whether this is meant to become a real feature (it would need a backend model, upload flow, and feed logic — that's a bigger feature, not a quick fix).
4. Remove or properly compute the hardcoded "Adventure Seeker" badge — either derive it from real activity data already logged in `ActivityLog`/`SearchHistory`, or remove it.
5. Checkpoint: `✅ Phase 3 complete`, listing what was implemented vs. what was intentionally removed vs. what needs a product decision.

**Phase 4 — Verification**
1. Re-run `npm run typecheck`, `npm run lint`, and `npm test` in both workspaces. All must pass — do not report completion with any red check.
2. Use your browser subagent to open the backend locally (after starting it with a local Postgres/Redis via `docker-compose up -d postgres redis` and the existing `.env.example` as a base) and manually hit `/health`, `/legal/privacy-policy`, `/legal/terms`, and a couple of the now-authenticated endpoints to confirm they return the expected 401/200 behavior. Screenshot or note what you observed.
3. Produce a final summary Artifact: what changed, per phase, with file paths; what's still fake/removed vs. real; and the full Setup Checklist of everything that needs a human (Khanh) to supply real credentials, accounts, business info, or design assets before this can go to production.

## Allowed actions
- Edit/create files inside `apps/backend/src`, `apps/mobile`, `packages/shared/src`, `.github/workflows`, and add new Prisma migrations under `apps/backend/src/prisma/migrations`.
- Add new npm dependencies only if strictly required for a P0/P1 fix (e.g. an SMS provider SDK for the SOS fix), and only from the existing registries already used in this project (npm public registry) — explain why in the checkpoint output.
- Run `npm install`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and local `docker compose up -d postgres redis` for verification.

## Forbidden actions
- Do NOT invent or hardcode real-looking API keys, company names, emails, Apple Team IDs, EAS project ids, or App Store Connect ids. Placeholders only, always listed in the final Setup Checklist.
- Do NOT touch `.env` files (only `.env.example`), `package-lock.json`, or any file under `node_modules`.
- Do NOT rewrite Prisma migrations that already applied cleanly and aren't part of the duplicate pair called out in Phase 2.
- Do NOT delete or weaken existing passing tests to make a red check turn green — fix the underlying code.
- Do NOT push to git or open a PR — leave changes local for Khanh to review and commit.
- Do NOT silently downgrade a P0 fix to "add a TODO comment" if a real fix is achievable with the credentials/stack already available (Redis for rate limiting/quotas, Expo Push already integrated, etc.). Only stop-and-ask when a real external account or business decision is genuinely required.

## Stop and ask before
- Sending any real SMS/push/email as a *test* during verification (simulate/mock the send in test mode instead).
- Adding a paid third-party service/dependency not already implied by the existing `.env.example` keys.
- Making a product decision that changes user-visible behavior beyond "make the broken thing work as originally described" (e.g. whether anonymous discover/translate access should exist at all — flag it, don't unilaterally decide).
- Anything that would require deleting user data in a way that isn't reversible.

## Output format
After each phase: `✅ Phase N complete` + bullet list of `[what changed] — [file(s)]`.
At the very end: one consolidated Setup Checklist (numbered) of everything that still needs Khanh's manual input, grouped by "must do before any real user touches this" vs. "can do closer to store submission."
```

🎯 Target: Google Antigravity IDE (Gemini 3 Pro / Gemini 3.5 Flash agent, also supports Claude/GPT models within Antigravity)
💡 Structured as phased ReAct-with-stop-conditions so the agent plans an Artifact task list first, fixes safety/security before cosmetics, and never fabricates credentials or legal/business text — it lists them for you instead.

**Setup note:** Copy `Traveling_QA_Audit_Report.md` into the repo root before pasting this prompt — the agent is told to read it as its source of truth. Recommend running Antigravity in **Agent-Assisted** mode (not full Autopilot) for this pass, since Phase 1 touches auth and a safety feature.
