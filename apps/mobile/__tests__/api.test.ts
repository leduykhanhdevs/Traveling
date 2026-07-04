import { beforeEach, describe, expect, it, jest } from '@jest/globals';

describe('apiRequest', () => {
  const fetchMock = jest.fn() as jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    jest.resetModules();
    fetchMock.mockReset();
    process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
    global.fetch = fetchMock;
  });

  it('calls the API URL with default GET options', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { status: 'ok' } }),
    } as Response);
    const { apiRequest } = require('../services/api') as typeof import('../services/api');

    const data = await apiRequest<{ status: string }>('/health');

    expect(data).toEqual({ status: 'ok' });
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/health', {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      body: undefined,
    });
  });

  it('serializes POST payloads and bearer tokens', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { id: 'saved_1' } }),
    } as Response);
    const { apiRequest } = require('../services/api') as typeof import('../services/api');

    await apiRequest('/api/v1/places/save', {
      method: 'POST',
      body: { placeId: 'place_123' },
      token: 'session-token',
    });

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/api/v1/places/save', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        authorization: 'Bearer session-token',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ placeId: 'place_123' }),
    });
  });

  it('throws ApiClientError for structured API failures', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed.',
          details: { fieldErrors: {} },
        },
      }),
    } as Response);
    const { ApiClientError, apiRequest } = require('../services/api') as typeof import('../services/api');

    await expect(apiRequest('/api/v1/discover')).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Request validation failed.',
    });
    await expect(apiRequest('/api/v1/discover')).rejects.toBeInstanceOf(ApiClientError);
  });
});
