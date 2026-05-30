import { config } from 'dotenv';
import { z } from 'zod';

config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  APP_URL: z.string().url().default('http://localhost:4000'),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  OPENAI_API_KEY: z.string().min(1),
  DEEPL_API_KEY: z.string().min(1),
  GOOGLE_CLOUD_API_KEY: z.string().min(1),
  GOOGLE_PLACES_API_KEY: z.string().min(1),
  SERPAPI_KEY: z.string().min(1),
  APIFY_API_KEY: z.string().min(1),
  APIFY_TIKTOK_ACTOR_ID: z.string().default('clockworks/tiktok-scraper'),
  APIFY_FACEBOOK_ACTOR_ID: z.string().default('apify/facebook-pages-scraper'),
  EXCHANGERATE_API_KEY: z.string().min(1),
  OPENWEATHER_API_KEY: z.string().min(1),
  REVENUECAT_API_KEY: z.string().min(1),
  FCM_SERVER_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
