import type { PersonalizationProfile } from '@traveling/shared';
import { apiRequest } from './api';

export const getProfile = (
  token?: string | null,
): Promise<{
  user: unknown;
  entitlement: {
    tier: 'free' | 'premium';
    freeLimits: { freeAiQueriesPerDay: number; freeTranslationsPerDay: number };
  };
}> => apiRequest('/api/v1/profile', { token });

export const updateProfile = (
  profile: PersonalizationProfile & { nationality?: string },
  token?: string | null,
): Promise<unknown> =>
  apiRequest('/api/v1/profile', {
    method: 'PUT',
    body: profile,
    token,
  });

import { useQuery } from '@tanstack/react-query';

export const getProfileStats = (
  token?: string | null,
): Promise<{
  countriesVisited: number;
  tripsPlanned: number;
  placesSaved: number;
}> => apiRequest('/api/v1/profile/stats', { token });

export const useProfileStats = (token?: string | null, options: { enabled?: boolean } = {}) =>
  useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => getProfileStats(token),
    queryKey: ['profileStats'],
  });
