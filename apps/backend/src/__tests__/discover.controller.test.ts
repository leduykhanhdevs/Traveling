jest.mock('../services/recommendation.service.js', () => ({
  discoverPlaces: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import { postDiscover } from '../controllers/discover.controller.js';
import { discoverPlaces } from '../services/recommendation.service.js';
import { authenticated, buildTestApp, requireAuthForTest } from './controller-test-utils.js';

const validDiscoverBody = {
  query: 'lau bo',
  lat: 10.7769,
  lng: 106.7009,
  filters: {
    radiusMeters: 2000,
    priceRange: [1, 2],
    dietaryRestrictions: ['halal'],
    openNow: true,
  },
  userId: 'body_user',
  surpriseMe: false,
};

const discoverResponse = {
  queryType: 'food' as const,
  detectedLanguage: 'vi',
  normalizedQuery: 'lau bo',
  radiusUsedMeters: 2000,
  places: [],
};

describe('discover.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('returns ranked discovery results and prefers auth user id', async () => {
      const discoverPlacesMock = jest.mocked(discoverPlaces);
      discoverPlacesMock.mockResolvedValue(discoverResponse);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/',
          handlers: [authenticated('clerk_user_1'), postDiscover],
        },
      ]);

      const response = await request(app).post('/').send(validDiscoverBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: discoverResponse });
      expect(discoverPlacesMock).toHaveBeenCalledWith({
        ...validDiscoverBody,
        userId: 'clerk_user_1',
      });
    });
  });

  describe('4xx error', () => {
    it('returns validation error for missing query', async () => {
      const discoverPlacesMock = jest.mocked(discoverPlaces);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/',
          handlers: [authenticated('clerk_user_1'), postDiscover],
        },
      ]);

      const response = await request(app).post('/').send({ ...validDiscoverBody, query: '' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(discoverPlacesMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('returns unauthorized when a protected discovery route has no user', async () => {
      const discoverPlacesMock = jest.mocked(discoverPlaces);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/',
          handlers: [requireAuthForTest, postDiscover],
        },
      ]);

      const response = await request(app).post('/').send(validDiscoverBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(discoverPlacesMock).not.toHaveBeenCalled();
    });
  });
});
