import type { ItineraryPlan, ItineraryRequest } from '@traveling/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from './api';

const itineraryStaleTimeMs = 1000 * 60 * 30;

type ItineraryQueryOptions = {
  enabled?: boolean;
  userId?: string | null;
};

export const generateItinerary = (
  request: ItineraryRequest,
  token?: string | null,
): Promise<ItineraryPlan> =>
  apiRequest<ItineraryPlan>('/api/v1/itineraries/generate', {
    method: 'POST',
    body: request,
    token,
  });

export const itineraryQueryKey = (userId: string | null | undefined) =>
  ['itinerary', userId] as const;

export const useItinerary = (
  userIdOrRequest: string | ItineraryRequest | null | undefined,
  token?: string | null,
  options: ItineraryQueryOptions = {},
) => {
  const request = typeof userIdOrRequest === 'object' ? userIdOrRequest : null;
  const userId =
    typeof userIdOrRequest === 'string' ? userIdOrRequest : options.userId ?? request?.userId;

  return useQuery({
    enabled: Boolean(request) && (options.enabled ?? true),
    queryFn: () => {
      if (!request) {
        return Promise.resolve(null);
      }

      return generateItinerary(request, token);
    },
    queryKey: itineraryQueryKey(userId),
    staleTime: itineraryStaleTimeMs,
  });
};

export const useItineraryGeneration = (
  request: ItineraryRequest | null,
  token?: string | null,
  options: ItineraryQueryOptions = {},
) =>
  useQuery({
    enabled: Boolean(request) && (options.enabled ?? true),
    queryFn: () => {
      if (!request) {
        throw new Error('Itinerary request is required.');
      }

      return generateItinerary(request, token);
    },
    queryKey: itineraryQueryKey(options.userId ?? request?.userId),
    staleTime: itineraryStaleTimeMs,
  });

export const useGenerateItineraryMutation = (token?: string | null) =>
  useMutation({
    mutationFn: (request: ItineraryRequest) => generateItinerary(request, token),
  });
