jest.mock('../services/openai.service.js', () => ({
  addPlaceSummaries: jest.fn(),
  generateAiItinerary: jest.fn(),
  parseDiscoveryIntent: jest.fn(),
}));

jest.mock('../services/google-places.service.js', () => ({
  getGooglePlaceDetails: jest.fn(),
  searchPlaceCandidates: jest.fn(),
  textSearchPlaceCandidates: jest.fn(),
}));

jest.mock('../services/prisma.service.js', () => ({
  prisma: {
    follow: {
      upsert: jest.fn(),
    },
    itinerary: {
      create: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    savedPlace: {
      upsert: jest.fn(),
    },
    searchHistory: {
      create: jest.fn(),
    },
    translation: {
      upsert: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    $disconnect: jest.fn(),
  },
}));

jest.mock('../services/redis.service.js', () => ({
  closeRedis: jest.fn(),
  getCacheJson: jest.fn(),
  setCacheJson: jest.fn(),
}));

export {};
