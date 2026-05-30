import type { DiscoverRequest, DiscoverResponse } from '@wanderai/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from './api';

const placesStaleTimeMs = 1000 * 60 * 5;

export const discoverPlaces = (
  request: DiscoverRequest,
  token?: string | null,
): Promise<DiscoverResponse> =>
  apiRequest<DiscoverResponse>('/api/v1/discover', {
    method: 'POST',
    body: request,
    token,
  });

export type PlaceDetail = {
  googlePlaceId: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  photoUrl?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  reviews: readonly {
    authorName: string;
    rating: number;
    text: string;
    timestamp: number;
  }[];
  communityReviews: readonly {
    id: string;
    rating: number;
    text: string;
    photos: readonly string[];
    tags: readonly string[];
    nationality: string;
    createdAt: string;
  }[];
};

export const getPlaceDetail = (placeId: string, token?: string | null): Promise<PlaceDetail> =>
  apiRequest<PlaceDetail>(`/api/v1/places/${encodeURIComponent(placeId)}`, { token });

export const savePlace = (
  body: { placeId: string; name: string; address: string; lat: number; lng: number },
  token?: string | null,
): Promise<unknown> =>
  apiRequest('/api/v1/places/save', {
    method: 'POST',
    body,
    token,
  });

export const discoverQueryKey = (params: DiscoverRequest | null) => ['discover', params] as const;

export const useDiscoverPlaces = (
  params: DiscoverRequest | null,
  token?: string | null,
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    enabled: Boolean(params) && (options.enabled ?? true),
    queryFn: () => {
      if (!params) {
        throw new Error('Discover request is required.');
      }

      return discoverPlaces(params, token);
    },
    queryKey: discoverQueryKey(params),
    staleTime: placesStaleTimeMs,
  });

export const usePlaceDetail = (
  placeId: string | null,
  token?: string | null,
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    enabled: Boolean(placeId) && (options.enabled ?? true),
    queryFn: () => {
      if (!placeId) {
        throw new Error('Place id is required.');
      }

      return getPlaceDetail(placeId, token);
    },
    queryKey: ['places', placeId] as const,
    staleTime: placesStaleTimeMs,
  });

export const useSavePlaceMutation = (token?: string | null) =>
  useMutation({
    mutationFn: (body: { placeId: string; name: string; address: string; lat: number; lng: number }) =>
      savePlace(body, token),
  });
