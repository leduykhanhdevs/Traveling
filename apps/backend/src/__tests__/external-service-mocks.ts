jest.mock('../services/openai.service.js', () => ({
  addPlaceSummaries: jest.fn(),
  generateAiItinerary: jest.fn(),
  parseDiscoveryIntent: jest.fn(),
}));

jest.mock('../services/google-places.service.js', () => ({
  getGooglePlaceDetails: jest.fn(),
  searchPlaceCandidates: jest.fn(),
  textSearchPlaceCandidates: jest.fn(),
  getCityFromCoordinates: jest.fn(),
}));

jest.mock('../services/clerk.service.js', () => ({
  getVerifiedPrimaryEmail: jest.fn().mockResolvedValue('verified@example.com'),
}));

jest.mock('../services/prisma.service.js', () => ({
  prisma: {
    follow: {
      upsert: jest.fn(),
    },
    itinerary: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
    },
    emergencyContact: {
      create: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    sharedBudget: {
      findMany: jest.fn().mockResolvedValue([]),
      upsert: jest.fn(),
    },
    sharedItinerary: {
      upsert: jest.fn(),
    },
    budgetItemSplit: {
      createMany: jest.fn(),
    },
    review: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    savedPlace: {
      upsert: jest.fn(),
      count: jest.fn(),
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
    budget: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    budgetItem: {
      create: jest.fn(),
      deleteMany: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      createMany: jest.fn(),
    },
    bankTransferOrder: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    premiumGrant: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
}));

jest.mock('../services/redis.service.js', () => ({
  closeRedis: jest.fn(),
  getCacheJson: jest.fn(),
  setCacheJson: jest.fn(),
  redis: {
    incr: jest.fn().mockResolvedValue(1),
    expire: jest.fn().mockResolvedValue(1),
  },
}));

jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(),
    },
  }));
});

export {};
