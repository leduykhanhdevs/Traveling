jest.mock('../services/billing.service.js', () => ({
  getEntitlementStatus: jest.fn(),
}));

import './external-service-mocks.js';
import request from 'supertest';
import { getProfile, putProfile } from '../controllers/profile.controller.js';
import { getEntitlementStatus } from '../services/billing.service.js';
import { prisma } from '../services/prisma.service.js';
import { authenticated, buildTestApp } from './controller-test-utils.js';

const validProfileBody = {
  email: 'traveler@example.com',
  preferredLanguage: 'en',
  dietaryRestrictions: ['vegan'],
  travelStyle: 'local food',
  spicyPreference: 4,
  sweetPreference: 2,
  savoryPreference: 5,
  nationality: 'Vietnamese',
  appLocale: 'vi',
};

describe('profile.controller', () => {
  const userFindUniqueMock = prisma.user.findUnique as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;
  const userUpsertMock = prisma.user.upsert as unknown as jest.MockedFunction<
    (args: unknown) => Promise<unknown>
  >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('success case', () => {
    it('returns profile and entitlement for the authenticated user', async () => {
      const user = {
        id: 'user_1',
        clerkId: 'clerk_user_1',
        email: 'traveler@example.com',
      };
      const entitlement = {
        tier: 'premium' as const,
        freeLimits: {
          freeAiQueriesPerDay: 20,
          freeTranslationsPerDay: 50,
          freeSavedPlaces: 10,
        } as const,
      };
      userFindUniqueMock.mockResolvedValue(user);
      const getEntitlementStatusMock = jest.mocked(getEntitlementStatus);
      getEntitlementStatusMock.mockResolvedValue(entitlement);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/',
          handlers: [authenticated('clerk_user_1'), getProfile],
        },
      ]);

      const response = await request(app).get('/');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: { user, entitlement } });
      expect(userFindUniqueMock).toHaveBeenCalledWith({ where: { clerkId: 'clerk_user_1' } });
      expect(getEntitlementStatusMock).toHaveBeenCalledWith('clerk_user_1');
    });

    it('upserts profile data for the authenticated user', async () => {
      const user = {
        id: 'user_1',
        clerkId: 'clerk_user_1',
        ...validProfileBody,
      };
      userUpsertMock.mockResolvedValue(user);
      const app = buildTestApp([
        {
          method: 'put',
          path: '/',
          handlers: [authenticated('clerk_user_1'), putProfile],
        },
      ]);

      const response = await request(app).put('/').send(validProfileBody);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true, data: user });
      expect(userUpsertMock).toHaveBeenCalledWith({
        where: {
          clerkId: 'clerk_user_1',
        },
        update: validProfileBody,
        create: {
          clerkId: 'clerk_user_1',
          ...validProfileBody,
        },
      });
    });
  });

  describe('4xx error', () => {
    it('returns validation error for invalid profile payload', async () => {
      const app = buildTestApp([
        {
          method: 'put',
          path: '/',
          handlers: [authenticated('clerk_user_1'), putProfile],
        },
      ]);

      const response = await request(app).put('/').send({ ...validProfileBody, email: 'bad' });

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(userUpsertMock).not.toHaveBeenCalled();
    });
  });

  describe('auth failure (401)', () => {
    it('rejects profile reads without auth context', async () => {
      const getEntitlementStatusMock = jest.mocked(getEntitlementStatus);
      const app = buildTestApp([
        {
          method: 'get',
          path: '/',
          handlers: [getProfile],
        },
      ]);

      const response = await request(app).get('/');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(userFindUniqueMock).not.toHaveBeenCalled();
      expect(getEntitlementStatusMock).not.toHaveBeenCalled();
    });

    it('rejects profile updates without auth context', async () => {
      const app = buildTestApp([
        {
          method: 'put',
          path: '/',
          handlers: [putProfile],
        },
      ]);

      const response = await request(app).put('/').send(validProfileBody);

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(userUpsertMock).not.toHaveBeenCalled();
    });
  });
});
