import { config } from 'dotenv';
import { z } from 'zod';

config();

const requiredString = z.string().trim().min(1);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_URL: z.string().url().default('http://localhost:4000'),
  CORS_ALLOWED_ORIGINS: z.string().optional(),
  DATABASE_URL: requiredString,
  DIRECT_URL: requiredString,
  REDIS_URL: requiredString,
  CLERK_SECRET_KEY: requiredString,
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  OPENAI_API_KEY: requiredString,
  DEEPL_API_KEY: requiredString,
  GOOGLE_CLOUD_API_KEY: requiredString,
  GOOGLE_PLACES_API_KEY: requiredString,
  SERPAPI_KEY: requiredString,
  APIFY_API_KEY: requiredString,
  APIFY_TIKTOK_ACTOR_ID: z.string().default('clockworks/tiktok-scraper'),
  APIFY_FACEBOOK_ACTOR_ID: z.string().default('apify/facebook-pages-scraper'),
  EXCHANGERATE_API_KEY: requiredString,
  OPENWEATHER_API_KEY: requiredString,
  REVENUECAT_API_KEY: requiredString,
  SEPAY_WEBHOOK_SECRET: z.string().min(32),
  INVITE_TOKEN_SECRET: z.string().min(32),
  FCM_SERVER_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  POSTHOG_API_KEY: z.string().min(1).optional(),
  POSTHOG_HOST: z.string().url().optional(),
  APPLE_TEAM_ID: z.string().trim().min(1).optional(),
  APPLE_BUNDLE_ID: z.string().trim().min(1).default('com.traveling.app'),
  TWILIO_ACCOUNT_SID: requiredString,
  TWILIO_AUTH_TOKEN: requiredString,
  TWILIO_FROM_NUMBER: requiredString,
});

const parseEnv = (): z.infer<typeof envSchema> => {
  const apifyApiKey =
    process.env.APIFY_API_KEY?.trim() ? process.env.APIFY_API_KEY : process.env.APIFY_TOKEN;
  
  const isTest = process.env.NODE_ENV === 'test';
  const testWebhookSecret = 'test-only-sepay-webhook-secret-32-bytes';
  const testInviteSecret = 'test-only-invite-token-secret-32-bytes';

  const result = envSchema.safeParse({
    ...process.env,
    APIFY_API_KEY: apifyApiKey,
    DIRECT_URL: process.env.DIRECT_URL || (isTest ? process.env.DATABASE_URL : undefined),
    SEPAY_WEBHOOK_SECRET:
      process.env.SEPAY_WEBHOOK_SECRET || (isTest ? testWebhookSecret : undefined),
    INVITE_TOKEN_SECRET:
      process.env.INVITE_TOKEN_SECRET || (isTest ? testInviteSecret : undefined),
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || (isTest ? 'test' : undefined),
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || (isTest ? 'test' : undefined),
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER || (isTest ? 'test' : undefined),
  });

  if (result.success) {
    return result.data;
  }

  const messages = result.error.issues.map((issue) => {
    const variableName = String(issue.path[0] ?? 'UNKNOWN_ENV_VAR');
    const missing =
      issue.code === 'invalid_type' ||
      (issue.code === 'too_small' && issue.minimum === 1 && issue.type === 'string');

    return missing
      ? `Missing required env var: ${variableName}`
      : `Invalid env var: ${variableName}`;
  });

  const uniqueMessages = [...new Set(messages)];
  console.error(['Environment validation failed.', ...uniqueMessages].join('\n'));
  process.exit(1);
};

export const env = parseEnv();
