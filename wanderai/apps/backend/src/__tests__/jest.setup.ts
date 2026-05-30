const requiredTestEnv: Record<string, string> = {
  NODE_ENV: 'test',
  APP_URL: 'http://localhost:4000',
  DATABASE_URL: 'postgresql://test:test@localhost:5432/wanderai_test',
  REDIS_URL: 'redis://localhost:6379',
  CLERK_SECRET_KEY: 'test_clerk_secret',
  OPENAI_API_KEY: 'test_openai_key',
  DEEPL_API_KEY: 'test_deepl_key',
  GOOGLE_CLOUD_API_KEY: 'test_google_cloud_key',
  GOOGLE_PLACES_API_KEY: 'test_google_places_key',
  SERPAPI_KEY: 'test_serpapi_key',
  APIFY_API_KEY: 'test_apify_key',
  EXCHANGERATE_API_KEY: 'test_exchange_rate_key',
  OPENWEATHER_API_KEY: 'test_openweather_key',
  REVENUECAT_API_KEY: 'test_revenuecat_key',
};

for (const [key, value] of Object.entries(requiredTestEnv)) {
  process.env[key] = process.env[key] ?? value;
}

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $disconnect: jest.fn(),
  })),
}));

jest.mock('ioredis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    get: jest.fn(),
    quit: jest.fn(),
    set: jest.fn(),
    status: 'end',
  })),
}));

jest.mock('openai', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  })),
}));

jest.mock('@clerk/express', () => ({}), { virtual: true });
jest.mock('axios', () => ({}), { virtual: true });

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Unexpected network request in test.'));
});

afterEach(() => {
  jest.restoreAllMocks();
});
