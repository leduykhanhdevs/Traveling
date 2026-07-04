import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../services/api', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '../services/api';
import { generateItinerary } from '../services/itinerary';

describe('itinerary service', () => {
  const apiRequestMock = jest.mocked(apiRequest);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('posts itinerary generation requests to the backend', async () => {
    const request = {
      destination: 'Seoul',
      days: 3,
      budgetRange: 'midrange' as const,
      travelStyle: 'food',
      userId: 'user_1',
    };
    const plan = {
      id: 'itinerary_1',
      destination: 'Seoul',
      days: [],
      budgetRange: 'midrange' as const,
      totalEstimatedSpend: 0,
    };
    apiRequestMock.mockResolvedValue(plan);

    const response = await generateItinerary(request, 'token_123');

    expect(response).toBe(plan);
    expect(apiRequestMock).toHaveBeenCalledWith('/api/v1/itineraries/generate', {
      method: 'POST',
      body: request,
      token: 'token_123',
    });
  });

  it('allows anonymous itinerary generation when no token is supplied', async () => {
    const request = {
      destination: 'Da Nang',
      days: 1,
      budgetRange: 'budget' as const,
      travelStyle: 'beaches',
    };
    apiRequestMock.mockResolvedValue({
      id: 'itinerary_2',
      destination: 'Da Nang',
      days: [],
      budgetRange: 'budget',
      totalEstimatedSpend: 0,
    });

    await generateItinerary(request);

    expect(apiRequestMock).toHaveBeenCalledWith('/api/v1/itineraries/generate', {
      method: 'POST',
      body: request,
      token: undefined,
    });
  });

  it('propagates API errors to the caller', async () => {
    const error = new Error('Planner unavailable');
    apiRequestMock.mockRejectedValue(error);

    await expect(
      generateItinerary({
        destination: 'Paris',
        days: 2,
        budgetRange: 'premium',
        travelStyle: 'art',
      }),
    ).rejects.toBe(error);
  });
});
