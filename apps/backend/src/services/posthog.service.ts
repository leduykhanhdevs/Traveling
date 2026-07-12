import { PostHog } from 'posthog-node';
import { env } from '../config/env.js';

export const posthog = new PostHog(env.POSTHOG_API_KEY ?? '', {
  host: env.POSTHOG_HOST ?? 'https://us.i.posthog.com',
  disabled: !env.POSTHOG_API_KEY,
  enableExceptionAutocapture: true,
});
