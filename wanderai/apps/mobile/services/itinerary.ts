import type { ItineraryPlan, ItineraryRequest } from '@wanderai/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from './api';

const itineraryStaleTimeMs = 1000 * 60 * 30;

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
  ['itinerary', userId ?? 'anonymous'] as const;

export const useItinerary = (
  request: ItineraryRequest | null,
  token?: string | null,
  options: { enabled?: boolean; userId?: string | null } = {},
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
