import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const shouldFix = args.has('--fix');
const shouldLive = args.has('--live');

const files = {
  backend: resolve(root, 'apps/backend/.env'),
  mobile: resolve(root, 'apps/mobile/.env'),
  clerkLocal: resolve(root, 'my-clerk-app/.env.local'),
};

const required = {
  backend: [
    'DATABASE_URL',
    'REDIS_URL',
    'CLERK_SECRET_KEY',
    'CLERK_WEBHOOK_SECRET',
    'OPENAI_API_KEY',
    'DEEPL_API_KEY',
    'GOOGLE_CLOUD_API_KEY',
    'GOOGLE_PLACES_API_KEY',
    'SERPAPI_KEY',
    'APIFY_API_KEY',
    'EXCHANGERATE_API_KEY',
    'OPENWEATHER_API_KEY',
    'REVENUECAT_API_KEY',
  ],
  mobile: [
    'EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'EXPO_PUBLIC_API_URL',
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
    'EXPO_PUBLIC_POSTHOG_HOST',
    'EXPO_PUBLIC_POSTHOG_KEY',
  ],
};

const parseEnv = (filePath) => {
  if (!existsSync(filePath)) {
    return { values: {}, lines: [] };
  }

  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  const values = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [key, ...rest] = trimmed.split('=');
    values[key.trim()] = rest.join('=').trim();
  }
  return { values, lines };
};

const mask = (value) => {
  if (!value) {
    return '<empty>';
  }
  if (value.length <= 8) {
    return '*'.repeat(value.length);
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

const looks = (key, value) => {
  if (!value) {
    return 'missing';
  }
  if (/PUBLISHABLE_KEY/.test(key)) {
    return /^pk_(test|live)_/.test(value) ? 'ok' : 'check: expected pk_test_ or pk_live_';
  }
  if (key === 'CLERK_SECRET_KEY') {
    return /^sk_(test|live)_/.test(value) ? 'ok' : 'check: expected sk_test_ or sk_live_';
  }
  if (key === 'CLERK_WEBHOOK_SECRET') {
    return /^whsec_/.test(value) ? 'ok' : 'check: expected whsec_... from Clerk webhooks';
  }
  if (key === 'OPENAI_API_KEY') {
    return /^sk-proj-|^sk-/.test(value) ? 'ok' : 'check: expected OpenAI API key';
  }
  if (key === 'DEEPL_API_KEY') {
    return value.endsWith(':fx') || value.length >= 30 ? 'ok' : 'check: expected DeepL auth key';
  }
  if (/GOOGLE|MAPS|PLACES/.test(key)) {
    return /^AIza/.test(value) ? 'ok' : 'check: expected Google API key starting AIza';
  }
  if (key === 'SERPAPI_KEY') {
    return value.length >= 20 ? 'ok' : 'check: key too short';
  }
  if (key === 'APIFY_API_KEY') {
    return /^apify_api_/.test(value) ? 'ok' : 'check: expected apify_api_... token';
  }
  if (key === 'EXCHANGERATE_API_KEY') {
    return value.length >= 10 ? 'ok' : 'check: key too short';
  }
  if (key === 'OPENWEATHER_API_KEY') {
    return /^[a-f0-9]{32}$/i.test(value)
      ? 'ok'
      : 'check: OpenWeather keys are commonly 32 hex chars';
  }
  if (key === 'REVENUECAT_API_KEY') {
    return /^sk_/.test(value) || /^(appl|goog|rcb)_/.test(value)
      ? 'ok'
      : 'check: expected RevenueCat secret sk_ for backend or public SDK key for app';
  }
  if (/HOST|URL/.test(key)) {
    return /^(https?|postgresql|redis):\/\//.test(value) ? 'ok' : 'check: expected URL';
  }
  if (/POSTHOG_KEY/.test(key)) {
    return /^phc_/.test(value) ? 'ok' : 'check: expected phc_ project API key';
  }
  return 'unknown';
};

const setEnvValue = (filePath, key, value) => {
  const parsed = parseEnv(filePath);
  let found = false;
  const next = parsed.lines.map((line) => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    next.push(`${key}=${value}`);
  }
  writeFileSync(filePath, `${next.join('\n').replace(/\n*$/, '')}\n`);
};

const statusRows = [];
const backend = parseEnv(files.backend);
const mobile = parseEnv(files.mobile);
const clerkLocal = parseEnv(files.clerkLocal);

for (const [scope, keys] of Object.entries(required)) {
  const values = scope === 'backend' ? backend.values : mobile.values;
  for (const key of keys) {
    const value = values[key] ?? '';
    statusRows.push({
      scope,
      key,
      present: Boolean(value),
      masked: mask(value),
      format: looks(key, value),
    });
  }
}

const localPosthogHost = clerkLocal.values.NEXT_PUBLIC_POSTHOG_HOST;
const mobilePosthogHost = mobile.values.EXPO_PUBLIC_POSTHOG_HOST;
if (
  shouldFix &&
  localPosthogHost &&
  looks('EXPO_PUBLIC_POSTHOG_HOST', mobilePosthogHost) !== 'ok'
) {
  setEnvValue(files.mobile, 'EXPO_PUBLIC_POSTHOG_HOST', localPosthogHost);
  console.log('FIXED EXPO_PUBLIC_POSTHOG_HOST from my-clerk-app/.env.local');
}

const liveCheck = async (name, enabled, request) => {
  if (!shouldLive || !enabled) {
    return { name, status: enabled ? 'skipped' : 'missing' };
  }
  try {
    const response = await request();
    return { name, status: response.ok ? 'ok' : `failed ${response.status}` };
  } catch (error) {
    return { name, status: `error: ${error instanceof Error ? error.message : 'unknown'}` };
  }
};

const runLiveChecks = async () => {
  const checks = await Promise.all([
    liveCheck('Clerk secret', Boolean(backend.values.CLERK_SECRET_KEY), () =>
      fetch('https://api.clerk.com/v1/users?limit=1', {
        headers: { authorization: `Bearer ${backend.values.CLERK_SECRET_KEY}` },
      }),
    ),
    liveCheck('OpenAI key', Boolean(backend.values.OPENAI_API_KEY), () =>
      fetch('https://api.openai.com/v1/models', {
        headers: { authorization: `Bearer ${backend.values.OPENAI_API_KEY}` },
      }),
    ),
    liveCheck('DeepL key', Boolean(backend.values.DEEPL_API_KEY), () => {
      const host = backend.values.DEEPL_API_KEY.endsWith(':fx')
        ? 'https://api-free.deepl.com'
        : 'https://api.deepl.com';
      return fetch(`${host}/v2/usage`, {
        headers: { authorization: `DeepL-Auth-Key ${backend.values.DEEPL_API_KEY}` },
      });
    }),
    liveCheck('SerpAPI key', Boolean(backend.values.SERPAPI_KEY), () =>
      fetch(
        `https://serpapi.com/account?api_key=${encodeURIComponent(backend.values.SERPAPI_KEY)}`,
      ),
    ),
    liveCheck('Apify token', Boolean(backend.values.APIFY_API_KEY), () =>
      fetch('https://api.apify.com/v2/users/me', {
        headers: { authorization: `Bearer ${backend.values.APIFY_API_KEY}` },
      }),
    ),
    liveCheck('ExchangeRate key', Boolean(backend.values.EXCHANGERATE_API_KEY), () =>
      fetch(`https://v6.exchangerate-api.com/v6/${backend.values.EXCHANGERATE_API_KEY}/latest/USD`),
    ),
    liveCheck('OpenWeather key', Boolean(backend.values.OPENWEATHER_API_KEY), () => {
      const url = new URL('https://api.openweathermap.org/data/2.5/weather');
      url.searchParams.set('q', 'Ho Chi Minh City');
      url.searchParams.set('appid', backend.values.OPENWEATHER_API_KEY);
      return fetch(url);
    }),
    liveCheck('RevenueCat key', Boolean(backend.values.REVENUECAT_API_KEY), () =>
      fetch('https://api.revenuecat.com/v1/subscribers/traveling-env-audit', {
        headers: { authorization: `Bearer ${backend.values.REVENUECAT_API_KEY}` },
      }),
    ),
    liveCheck('Google Cloud key', Boolean(backend.values.GOOGLE_CLOUD_API_KEY), () => {
      const url = new URL('https://translation.googleapis.com/language/translate/v2/languages');
      url.searchParams.set('key', backend.values.GOOGLE_CLOUD_API_KEY);
      return fetch(url);
    }),
  ]);

  console.log('\nLive checks');
  console.table(checks);
};

console.log('Env audit');
console.table(statusRows);
await runLiveChecks();
