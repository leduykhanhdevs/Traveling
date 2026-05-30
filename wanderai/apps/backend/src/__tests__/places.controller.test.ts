import './external-service-mocks.js';
import request from 'supertest';
import { getPlaceDetail, postSavePlace } from '../controllers/places.controller.js';
import { getGooglePlaceDetails } from '../services/google-places.service.js';
import { prisma } from '../services/prisma.service.js';
import { buildTestApp } from './controller-test-utils.js';

type ReviewRecord = {
  id: string;
  rating: number;
  text: string;
  photos: string[];
  tags: string[];
  nationality: string;
  createdAt: Date;
};

const validSavePlaceBody = {
  placeId: 'place_123',
  name: 'Pho Thin',
  address: '13 Lo Duc',
  lat: 21.0186,
  lng: 105.8547,
};

describe('places.controller', () => {
  const reviewFindManyMock = prisma.review.findMany as unknown as jest.MockedFunction<
    (args: unknown) => Promise<ReviewRecord[]>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('returns place detail with community reviews', async () => {
      const getGooglePlaceDetailsMock = jest.mocked(getGooglePlaceDetails);
      getGooglePlaceDetailsMock.mockResolvedValue({
        googlePlaceId: 'place_123',
        name: 'Pho Thin',
        address: '13 Lo Duc',
        coordinates: { lat: 21.0186, lng: 105.8547 },
        distanceMeters: 120,
        rating: 4.7,
        reviewCount: 1200,
        priceLevel: 1,
        types: ['restaurant'],
        openNow: true,
        reviews: [],
      });
      reviewFindManyMock.mockResolvedValue([
        {
          id: 'review_1',
          rating: 5,
          text: 'Excellent.',
          photos: [],
          tags: ['pho'],
          nationality: 'Vietnamese',
          createdAt: new Date('2026-05-30T00:00:00.000Z'),
        },
      ]);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/:placeId',
          handlers: [getPlaceDetail],
        },
      ]);

      const response = await request(app).get('/place_123');

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Pho Thin');
      expect(response.body.data.communityReviews).toEqual([
        {
          id: 'review_1',
          rating: 5,
          text: 'Excellent.',
          photos: [],
          tags: ['pho'],
          nationality: 'Vietnamese',
          createdAt: '2026-05-30T00:00:00.000Z',
        },
      ]);
      expect(getGooglePlaceDetailsMock).toHaveBeenCalledWith('place_123');
    });
  });

  describe('4xx error', () => {
    it('returns not found when Google place detail is missing', async () => {
      const getGooglePlaceDetailsMock = jest.mocked(getGooglePlaceDetails);
      getGooglePlaceDetailsMock.mockResolvedValue(null);
      reviewFindManyMock.mockResolvedValue([]);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/:placeId',
          handlers: [getPlaceDetail],
        },
      ]);

      const response = await request(app).get('/missing_place');

      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('PLACE_NOT_FOUND');
    });
  });

  describe('auth failure (401)', () => {
    it('rejects saving a place without auth context', async () => {
      const savedPlaceUpsertMock = prisma.savedPlace.upsert as unknown as jest.MockedFunction<
        (args: unknown) => Promise<unknown>
      >;
      const app = buildTestApp([
        {
          method: 'post',
          path: '/save',
          handlers: [postSavePlace],
        },
      ]);

      const response = await request(app).post('/save').send(validSavePlaceBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(savedPlaceUpsertMock).not.toHaveBeenCalled();
    });
  });
});
