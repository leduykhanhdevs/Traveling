jest.mock('../services/utility.service.js', () => ({
  getCurrencyRates: jest.fn(),
  getWeather: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import { getCurrency, getWeatherByCity } from '../controllers/utility.controller.js';
import { getCurrencyRates, getWeather } from '../services/utility.service.js';
import { authenticated, buildTestApp, requireAuthForTest } from './controller-test-utils.js';

describe('utility.controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('returns uppercase currency rates', async () => {
      const rates = {
        base: 'USD',
        rates: {
          VND: 25000,
        },
      };
      const getCurrencyRatesMock = jest.mocked(getCurrencyRates);
      getCurrencyRatesMock.mockResolvedValue(rates);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/currency',
          handlers: [authenticated('clerk_user_1'), getCurrency],
        },
      ]);

      const response = await request(app).get('/currency').query({ base: 'usd' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: rates });
      expect(getCurrencyRatesMock).toHaveBeenCalledWith('USD');
    });
  });

  describe('4xx error', () => {
    it('returns validation error for invalid weather city', async () => {
      const getWeatherMock = jest.mocked(getWeather);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/weather',
          handlers: [authenticated('clerk_user_1'), getWeatherByCity],
        },
      ]);

      const response = await request(app).get('/weather').query({ city: 'A' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(getWeatherMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('returns unauthorized when a protected utility route has no user', async () => {
      const getCurrencyRatesMock = jest.mocked(getCurrencyRates);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/currency',
          handlers: [requireAuthForTest, getCurrency],
        },
      ]);

      const response = await request(app).get('/currency').query({ base: 'USD' });

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(getCurrencyRatesMock).not.toHaveBeenCalled();
    });
  });
});
