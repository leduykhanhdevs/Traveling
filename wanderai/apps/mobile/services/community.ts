import type { CommunityReview } from '@wanderai/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from './api';

const communityStaleTimeMs = 1000 * 60 * 10;

export type CommunityFilters = {
  nationality?: string;
  foodCategory?: string;
  city?: string;
};

export type CommunityPage = {
  page: number;
  filters: CommunityFilters;
};

export const getCommunityFeed = (
  filters: CommunityFilters,
  token?: string | null,
): Promise<{ reviews: readonly CommunityReview[] }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/community${suffix}`, { token });
};

export const postReview = (
  review: {
    placeId: string;
    rating: number;
    text: string;
    photos: readonly string[];
    tags: readonly string[];
    nationality: string;
  },
  token?: string | null,
): Promise<CommunityReview> =>
  apiRequest('/api/v1/community/reviews', {
    method: 'POST',
    body: review,
    token,
  });

export const communityQueryKey = (page: CommunityPage) => ['community', page] as const;

export const useCommunityFeed = (
  page: CommunityPage,
  token?: string | null,
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => getCommunityFeed(page.filters, token),
    queryKey: communityQueryKey(page),
    staleTime: communityStaleTimeMs,
  });

export const usePostReviewMutation = (token?: string | null) =>
  useMutation({
    mutationFn: (review: {
      placeId: string;
      rating: number;
      text: string;
      photos: readonly string[];
      tags: readonly string[];
      nationality: string;
    }) => postReview(review, token),
  });
