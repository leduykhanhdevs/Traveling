import { beforeEach, describe, expect, it, jest } from '@jest/globals';

jest.mock('../services/api', () => ({
  apiRequest: jest.fn(),
}));

import { apiRequest } from '../services/api';
import { getCommunityFeed, postReview } from '../services/community';

describe('community service', () => {
  const apiRequestMock = jest.mocked(apiRequest);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('builds filtered community feed query parameters', async () => {
    const response = { reviews: [] };
    apiRequestMock.mockResolvedValue(response);

    const result = await getCommunityFeed(
      { nationality: 'Vietnamese', foodCategory: 'pho', city: 'Hanoi' },
      'token_123',
    );

    expect(result).toBe(response);
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/api/v1/community?nationality=Vietnamese&foodCategory=pho&city=Hanoi',
      { token: 'token_123' },
    );
  });

  it('omits the query string when no filters are set', async () => {
    apiRequestMock.mockResolvedValue({ reviews: [] });

    await getCommunityFeed({});

    expect(apiRequestMock).toHaveBeenCalledWith('/api/v1/community', { token: undefined });
  });

  it('posts review payloads to the community endpoint', async () => {
    const review = {
      placeId: 'place_123',
      rating: 5,
      text: 'Excellent.',
      photos: ['https://example.com/photo.jpg'],
      tags: ['noodles'],
      nationality: 'Vietnamese',
    };
    const created = {
      id: 'review_1',
      userId: 'user_1',
      userName: 'duy',
      createdAt: '2026-05-30T00:00:00.000Z',
      ...review,
    };
    apiRequestMock.mockResolvedValue(created);

    const result = await postReview(review, 'token_123');

    expect(result).toBe(created);
    expect(apiRequestMock).toHaveBeenCalledWith('/api/v1/community/reviews', {
      method: 'POST',
      body: review,
      token: 'token_123',
    });
  });
});
