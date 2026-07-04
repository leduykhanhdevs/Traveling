jest.mock('../config/env.js', () => ({
  env: {
    GOOGLE_PLACES_API_KEY: 'test_google_places_key',
  },
}));

jest.mock('../services/http-client.js', () => ({
  fetchJson: jest.fn(),
}));

import './jest.setup.js';
import { fetchJson } from '../services/http-client.js';
import {
  getGooglePlaceDetails,
  searchPlaceCandidates,
  textSearchPlaceCandidates,
} from '../services/google-places.service.js';
import { getCacheJson, setCacheJson } from '../services/redis.service.js';

type FetchJsonMock = (
  url: string | URL,
  init: RequestInit | undefined,
  serviceName: string,
) => Promise<unknown>;

jest.mock('../services/redis.service.js', () => ({
  getCacheJson: jest.fn(),
  setCacheJson: jest.fn(),
}));

const fetchJsonMock = fetchJson as unknown as jest.MockedFunction<FetchJsonMock>;
const getCacheJsonMock = getCacheJson as unknown as jest.MockedFunction<
  (key: string) => Promise<unknown | null>
>;
const setCacheJsonMock = setCacheJson as unknown as jest.MockedFunction<
  (key: string, value: unknown, ttlSeconds: number) => Promise<void>
>;

describe('google-places.service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('searches nearby places and maps Google results into candidates', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      fetchJsonMock.mockResolvedValueOnce({
        status: 'OK',
        results: [
          {
            place_id: 'place_1',
            name: 'Ben Thanh Market',
            vicinity: 'District 1',
            geometry: {
              location: { lat: 10.772, lng: 106.698 },
            },
            rating: 4.5,
            user_ratings_total: 3000,
            price_level: 1,
            types: ['restaurant'],
            photos: [{ photo_reference: 'photo_ref' }],
            opening_hours: { open_now: true },
          },
        ],
      });

      const result = await searchPlaceCandidates({
        query: 'market food',
        lat: 10.772,
        lng: 106.698,
        radiusMeters: 500,
        openNow: true,
      });

      expect(result.radiusUsedMeters).toBe(500);
      expect(result.candidates[0]).toMatchObject({
        googlePlaceId: 'place_1',
        name: 'Ben Thanh Market',
        address: 'District 1',
        rating: 4.5,
        reviewCount: 3000,
        priceLevel: 1,
        openNow: true,
      });
      expect(result.candidates[0]?.photoUrl).toContain('test_google_places_key');
      expect(setCacheJsonMock).toHaveBeenCalledTimes(1);
    });

    it('returns place details with normalized reviews', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      fetchJsonMock.mockResolvedValueOnce({
        status: 'OK',
        result: {
          place_id: 'place_2',
          name: 'War Remnants Museum',
          formatted_address: 'District 3',
          formatted_phone_number: '+84 28 3930 5587',
          website: 'https://example.com',
          geometry: {
            location: { lat: 10.779, lng: 106.692 },
          },
          rating: 4.6,
          user_ratings_total: 5000,
          price_level: 2,
          types: ['museum'],
          reviews: [
            {
              author_name: 'Visitor',
              rating: 5,
              text: 'Powerful museum.',
              time: 1717027200,
            },
          ],
        },
      });

      const result = await getGooglePlaceDetails('place_2');

      expect(result).toMatchObject({
        googlePlaceId: 'place_2',
        name: 'War Remnants Museum',
        phone: '+84 28 3930 5587',
        website: 'https://example.com',
        reviews: [
          {
            authorName: 'Visitor',
            rating: 5,
            text: 'Powerful museum.',
            timestamp: 1717027200,
          },
        ],
      });
    });
  });

  describe('error path', () => {
    it('returns an empty nearby result after an upstream Google error', async () => {
      getCacheJsonMock.mockResolvedValue(null);
      fetchJsonMock.mockResolvedValueOnce({
        status: 'REQUEST_DENIED',
        error_message: 'Bad key',
      });

      const result = await searchPlaceCandidates({
        query: 'coffee',
        lat: 10,
        lng: 106,
        radiusMeters: 500,
        openNow: false,
      });

      expect(result).toEqual({
        candidates: [],
        radiusUsedMeters: 500,
      });
      expect(setCacheJsonMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure case', () => {
    it('uses cached text search candidates without external calls or auth context', async () => {
      const cached = [
        {
          googlePlaceId: 'cached_place',
          name: 'Cached Cafe',
          address: 'District 1',
          coordinates: { lat: 10, lng: 106 },
          distanceMeters: 0,
          types: ['cafe'],
        },
      ];
      getCacheJsonMock.mockResolvedValue(cached);

      await expect(textSearchPlaceCandidates('coffee hcmc')).resolves.toEqual(cached);
      expect(fetchJsonMock).not.toHaveBeenCalled();
    });
  });
});
