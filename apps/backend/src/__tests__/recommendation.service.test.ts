jest.mock('../services/apify.service.js', () => ({
  fetchFacebookSignal: jest.fn(),
  fetchTikTokSignal: jest.fn(),
}));

jest.mock('../services/google-places.service.js', () => ({
  searchPlaceCandidates: jest.fn(),
}));

jest.mock('../services/openai.service.js', () => ({
  addPlaceSummaries: jest.fn(),
  parseDiscoveryIntent: jest.fn(),
}));

jest.mock('../services/serpapi.service.js', () => ({
  fetchGoogleMapsSignal: jest.fn(),
}));

import './jest.setup.js';
import './external-service-mocks.js';
import type { DiscoverRequest } from '@traveling/shared';
import { fetchFacebookSignal, fetchTikTokSignal } from '../services/apify.service.js';
import { searchPlaceCandidates } from '../services/google-places.service.js';
import { addPlaceSummaries, parseDiscoveryIntent } from '../services/openai.service.js';
import { prisma } from '../services/prisma.service.js';
import { discoverPlaces } from '../services/recommendation.service.js';
import { getCacheJson, setCacheJson } from '../services/redis.service.js';
import { fetchGoogleMapsSignal } from '../services/serpapi.service.js';

type UserRecord = {
  id: string;
  clerkId: string;
  email: string;
};

const getCacheJsonMock = getCacheJson as unknown as jest.MockedFunction<
  (key: string) => Promise<unknown | null>
>;
const setCacheJsonMock = setCacheJson as unknown as jest.MockedFunction<
  (key: string, value: unknown, ttlSeconds: number) => Promise<void>
>;
const userFindUniqueMock = prisma.user.findUnique as unknown as jest.MockedFunction<
  (args: unknown) => Promise<UserRecord | null>
>;
const searchHistoryCreateMock = prisma.searchHistory.create as unknown as jest.MockedFunction<
  (args: unknown) => Promise<unknown>
>;

const discoverRequest: DiscoverRequest = {
  query: 'lau bo',
  lat: 10.7769,
  lng: 106.7009,
  filters: {
    radiusMeters: 2000,
    priceRange: [1, 2],
    dietaryRestrictions: [],
    openNow: true,
  },
  userId: 'clerk_user_1',
  surpriseMe: false,
};

describe('recommendation.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('ranks places with Google, review volume, and social proof signals', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      jest.mocked(parseDiscoveryIntent).mockResolvedValue({
        queryType: 'food',
        detectedLanguage: 'vi',
        normalizedQuery: 'beef hotpot',
        cuisineHints: ['hotpot'],
      });
      jest.mocked(searchPlaceCandidates).mockResolvedValue({
        radiusUsedMeters: 2000,
        candidates: [
          {
            googlePlaceId: 'place_low',
            name: 'Quiet Hotpot',
            address: 'District 3',
            coordinates: { lat: 10.78, lng: 106.69 },
            distanceMeters: 500,
            rating: 4.1,
            reviewCount: 20,
            priceLevel: 1,
            types: ['restaurant'],
            openNow: true,
          },
          {
            googlePlaceId: 'place_high',
            name: 'Famous Hotpot',
            address: 'District 1',
            coordinates: { lat: 10.77, lng: 106.7 },
            distanceMeters: 150,
            rating: 4.8,
            reviewCount: 2000,
            priceLevel: 2,
            types: ['restaurant'],
            openNow: true,
          },
        ],
      });
      jest
        .mocked(fetchGoogleMapsSignal)
        .mockResolvedValueOnce({
          source: 'google',
          rating: 4.1,
          reviewCount: 20,
          snippet: 'Small local stop.',
        })
        .mockResolvedValueOnce({
          source: 'google',
          rating: 4.9,
          reviewCount: 2500,
          snippet: 'Long queues but worth it.',
        });
      jest
        .mocked(fetchTikTokSignal)
        .mockResolvedValueOnce({
          source: 'tiktok',
          engagementCount: 50,
          snippet: 'Hidden local clip.',
        })
        .mockResolvedValueOnce({
          source: 'tiktok',
          engagementCount: 500000,
          snippet: 'Viral dinner spot.',
        });
      jest.mocked(fetchFacebookSignal).mockResolvedValue(null);
      jest.mocked(addPlaceSummaries).mockImplementation(async (places) =>
        places.map((place) => ({
          ...place,
          aiSummary: `Summary for ${place.name}`,
        })),
      );
      userFindUniqueMock.mockResolvedValue({
        id: 'user_1',
        clerkId: 'clerk_user_1',
        email: 'test1@traveling.dev',
      });
      searchHistoryCreateMock.mockResolvedValue({ id: 'search_1' });

      const result = await discoverPlaces(discoverRequest);

      expect(result.places[0]?.id).toBe('place_high');
      expect(result.places[0]?.score.compositeScore).toBeGreaterThan(
        result.places[1]?.score.compositeScore ?? 0,
      );
      expect(setCacheJsonMock).toHaveBeenCalledTimes(1);
      expect(searchHistoryCreateMock).toHaveBeenCalledWith({
        data: {
          userId: 'user_1',
          query: 'lau bo',
          lat: 10.7769,
          lng: 106.7009,
          results: result,
        },
      });
    });
  });

  describe('error path', () => {
    it('rejects when candidate lookup fails before ranking can happen', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      jest.mocked(parseDiscoveryIntent).mockResolvedValue({
        queryType: 'food',
        detectedLanguage: 'en',
        normalizedQuery: 'hotpot',
        cuisineHints: [],
      });
      jest.mocked(searchPlaceCandidates).mockRejectedValue(new Error('Google Places failed'));

      await expect(discoverPlaces(discoverRequest)).rejects.toThrow('Google Places failed');
      expect(setCacheJsonMock).not.toHaveBeenCalled();
      expect(searchHistoryCreateMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure case', () => {
    it('returns cached results without touching persistence when no user context is needed', async () => {
      const cached = {
        queryType: 'food' as const,
        detectedLanguage: 'vi',
        normalizedQuery: 'lau bo',
        radiusUsedMeters: 500,
        places: [],
      };
      getCacheJsonMock.mockResolvedValue(cached);

      await expect(
        discoverPlaces({
          ...discoverRequest,
          userId: undefined,
        }),
      ).resolves.toEqual(cached);
      expect(parseDiscoveryIntent).not.toHaveBeenCalled();
      expect(userFindUniqueMock).not.toHaveBeenCalled();
      expect(searchHistoryCreateMock).not.toHaveBeenCalled();
    });
  });
});
