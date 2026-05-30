jest.mock('../services/community.service.js', () => ({
  createCommunityReview: jest.fn(),
  followTraveler: jest.fn(),
  listCommunityReviews: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import { getCommunityFeed, postCommunityReview } from '../controllers/community.controller.js';
import { createCommunityReview, listCommunityReviews } from '../services/community.service.js';
import { authenticated, buildTestApp } from './controller-test-utils.js';

const validReviewBody = {
  placeId: 'place_123',
  rating: 5,
  text: 'Wonderful local food.',
  photos: ['https://example.com/photo.jpg'],
  tags: ['pho'],
  nationality: 'Vietnamese',
};

describe('community.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('creates a community review for the authenticated user', async () => {
      const review = {
        id: 'review_1',
        placeId: validReviewBody.placeId,
        userId: 'user_1',
        userName: 'duy',
        nationality: validReviewBody.nationality,
        rating: validReviewBody.rating,
        text: validReviewBody.text,
        photos: validReviewBody.photos,
        tags: validReviewBody.tags,
        createdAt: '2026-05-30T00:00:00.000Z',
      };
      const createCommunityReviewMock = jest.mocked(createCommunityReview);
      createCommunityReviewMock.mockResolvedValue(review);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/reviews',
          handlers: [authenticated('clerk_user_1'), postCommunityReview],
        },
      ]);

      const response = await request(app).post('/reviews').send(validReviewBody);

      expect(response.status).toBe(201);
      expect(response.body).toEqual({ success: true, data: review });
      expect(createCommunityReviewMock).toHaveBeenCalledWith({
        userId: 'clerk_user_1',
        ...validReviewBody,
      });
    });
  });

  describe('4xx error', () => {
    it('returns validation error for invalid review body', async () => {
      const createCommunityReviewMock = jest.mocked(createCommunityReview);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/reviews',
          handlers: [authenticated('clerk_user_1'), postCommunityReview],
        },
      ]);

      const response = await request(app)
        .post('/reviews')
        .send({ ...validReviewBody, rating: 6 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(createCommunityReviewMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('rejects review creation without auth context', async () => {
      const createCommunityReviewMock = jest.mocked(createCommunityReview);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/reviews',
          handlers: [postCommunityReview],
        },
      ]);

      const response = await request(app).post('/reviews').send(validReviewBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(createCommunityReviewMock).not.toHaveBeenCalled();
    });
  });

  describe('feed success case', () => {
    it('loads community feed with filters', async () => {
      const reviews = [
        {
          id: 'review_2',
          placeId: 'place_456',
          userId: 'user_2',
          userName: 'mai',
          nationality: 'Vietnamese',
          rating: 4,
          text: 'Great coffee.',
          photos: [],
          tags: ['coffee'],
          createdAt: '2026-05-30T00:00:00.000Z',
        },
      ];
      const listCommunityReviewsMock = jest.mocked(listCommunityReviews);
      listCommunityReviewsMock.mockResolvedValue(reviews);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/',
          handlers: [getCommunityFeed],
        },
      ]);

      const response = await request(app).get('/').query({ nationality: 'Vietnamese' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: { reviews } });
      expect(listCommunityReviewsMock).toHaveBeenCalledWith({ nationality: 'Vietnamese' });
    });
  });
});
