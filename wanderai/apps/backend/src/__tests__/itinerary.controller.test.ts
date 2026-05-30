jest.mock('../services/itinerary.service.js', () => ({
  exportItineraryPdf: jest.fn(),
  generateItinerary: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import {
  postExportItinerary,
  postGenerateItinerary,
} from '../controllers/itinerary.controller.js';
import { exportItineraryPdf, generateItinerary } from '../services/itinerary.service.js';
import { authenticated, buildTestApp, requireAuthForTest } from './controller-test-utils.js';

const validItineraryBody = {
  destination: 'Tokyo',
  days: 2,
  budgetRange: 'midrange' as const,
  travelStyle: 'food and neighborhoods',
  userId: 'body_user',
};

const itineraryPlan = {
  id: 'itinerary_1',
  destination: 'Tokyo',
  days: [
    {
      day: 1,
      title: 'Day 1',
      slots: [],
      totalEstimatedSpend: 120,
    },
  ],
  budgetRange: 'midrange' as const,
  totalEstimatedSpend: 120,
};

describe('itinerary.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('generates an itinerary using authenticated user context', async () => {
      const generateItineraryMock = jest.mocked(generateItinerary);
      generateItineraryMock.mockResolvedValue(itineraryPlan);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/generate',
          handlers: [authenticated('clerk_user_1'), postGenerateItinerary],
        },
      ]);

      const response = await request(app).post('/generate').send(validItineraryBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: itineraryPlan });
      expect(generateItineraryMock).toHaveBeenCalledWith({
        ...validItineraryBody,
        userId: 'clerk_user_1',
      });
    });

    it('exports an itinerary PDF by id', async () => {
      const pdf = Buffer.from('%PDF test');
      const exportItineraryPdfMock = jest.mocked(exportItineraryPdf);
      exportItineraryPdfMock.mockResolvedValue(pdf);
      const exportApp = buildTestApp([
        {
          method: 'post',
          path: '/:id/export',
          handlers: [authenticated('clerk_user_1'), postExportItinerary],
        },
      ]);

      const response = await request(exportApp)
        .post('/itinerary_1/export')
        .send({ title: 'Trip' });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toContain('application/pdf');
      expect(response.header['content-disposition']).toContain('wanderai-itinerary-itinerary_1.pdf');
      expect(Buffer.from(response.body).toString()).toBe('%PDF test');
      expect(exportItineraryPdfMock).toHaveBeenCalledWith('itinerary_1', { title: 'Trip' });
    });
  });

  describe('4xx error', () => {
    it('returns validation error for invalid day count', async () => {
      const generateItineraryMock = jest.mocked(generateItinerary);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/generate',
          handlers: [authenticated('clerk_user_1'), postGenerateItinerary],
        },
      ]);

      const response = await request(app).post('/generate').send({ ...validItineraryBody, days: 0 });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(generateItineraryMock).not.toHaveBeenCalled();
    });

    it('returns validation error for a blank export id', async () => {
      const exportItineraryPdfMock = jest.mocked(exportItineraryPdf);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/:id/export',
          handlers: [authenticated('clerk_user_1'), postExportItinerary],
        },
      ]);

      const response = await request(app).post('/%20/export').send({});

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(exportItineraryPdfMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('returns unauthorized when a protected itinerary route has no user', async () => {
      const generateItineraryMock = jest.mocked(generateItinerary);
      const app = buildTestApp([
        {
          method: 'post',
          path: '/generate',
          handlers: [requireAuthForTest, postGenerateItinerary],
        },
      ]);

      const response = await request(app).post('/generate').send(validItineraryBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(generateItineraryMock).not.toHaveBeenCalled();
    });
  });
});
