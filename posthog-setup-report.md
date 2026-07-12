# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Traveling app backend. The `posthog-node` SDK was installed in the `@traveling/backend` workspace and a singleton client (`apps/backend/src/services/posthog.service.ts`) was created with `enableExceptionAutocapture: true`. The Express app in `server.ts` now registers `setupExpressRequestContext` (so incoming `X-POSTHOG-DISTINCT-ID` / `X-POSTHOG-SESSION-ID` headers automatically bind context to all events) and `setupExpressErrorHandler` (for automatic exception capture). On graceful shutdown, `posthog.shutdown()` is awaited to flush all pending events. Fifteen business-critical events are now tracked across seven controllers, a `posthog.identify()` call is made on profile upsert to keep person properties up to date, and `captureException` fires in the error handler for every 5xx response.

| Event Name | Description | File |
|---|---|---|
| `itinerary_generated` | User successfully generated an AI travel itinerary. | `apps/backend/src/controllers/itinerary.controller.ts` |
| `itinerary_exported` | User exported an itinerary as a PDF. | `apps/backend/src/controllers/itinerary.controller.ts` |
| `itinerary_deleted` | User deleted one of their saved itineraries. | `apps/backend/src/controllers/itinerary.controller.ts` |
| `itinerary_shared` | Premium user generated a shareable itinerary invite link. | `apps/backend/src/controllers/itinerary.controller.ts` |
| `itinerary_invite_accepted` | User accepted a shared itinerary invite link. | `apps/backend/src/controllers/itinerary.controller.ts` |
| `weather_replan_triggered` | Premium user triggered a weather-aware itinerary re-plan. | `apps/backend/src/controllers/itinerary.controller.ts` |
| `payment_initiated` | User initiated a bank transfer payment order for a premium plan. | `apps/backend/src/controllers/payment.controller.ts` |
| `payment_completed` | Bank transfer webhook confirmed a successful premium payment. | `apps/backend/src/controllers/webhook.controller.ts` |
| `place_saved` | User saved a place to their personal collection. | `apps/backend/src/controllers/places.controller.ts` |
| `place_discovered` | User ran an AI-powered place discovery search. | `apps/backend/src/controllers/discover.controller.ts` |
| `text_translated` | User translated text using the in-app translation feature. | `apps/backend/src/controllers/translate.controller.ts` |
| `ocr_translation_requested` | User translated text from an image using OCR translation. | `apps/backend/src/controllers/translate.controller.ts` |
| `community_post_created` | User published a new post to the community feed. | `apps/backend/src/controllers/community.controller.ts` |
| `community_review_submitted` | User submitted a community review for a place. | `apps/backend/src/controllers/community.controller.ts` |
| `story_created` | User created a new travel story with photo. | `apps/backend/src/controllers/community.controller.ts` |
| `budget_created` | User created a new trip budget tracker. | `apps/backend/src/controllers/budget.controller.ts` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) dashboard](https://us.posthog.com/project/444711/dashboard/1809415)
- [Payment Conversion Funnel](https://us.posthog.com/project/444711/insights/zsC1hnzX)
- [Itineraries Generated Over Time](https://us.posthog.com/project/444711/insights/3qEHSEYd)
- [Core Feature Usage Comparison](https://us.posthog.com/project/444711/insights/C7JViEW2)
- [Community Engagement Trend](https://us.posthog.com/project/444711/insights/zgGUtu6q)
- [Itinerary Churn Signal](https://us.posthog.com/project/444711/insights/I87uBpEf)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `POSTHOG_API_KEY` and `POSTHOG_HOST` to `apps/backend/.env.example` (or any monorepo bootstrap script) so collaborators know what to set.
- [ ] Confirm the returning-visitor path also calls `identify` — the current handler only identifies on profile upsert; a returning session that doesn't update their profile will remain on its anonymous distinct ID until they next save their profile.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
