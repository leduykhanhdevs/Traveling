import { CACHE_TTL_SECONDS, type PriceRange } from '@traveling/shared';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';
import { stableHash } from '../utils/hash.js';
import { logUnknownError } from '../utils/logger.js';
import { fetchJson } from './http-client.js';
import { getCacheJson, setCacheJson } from './redis.service.js';

type GooglePlaceLocation = {
  lat: number;
  lng: number;
};

type GooglePlacePhoto = {
  photo_reference: string;
};

type GooglePlaceReview = {
  author_name?: string;
  rating?: number;
  text?: string;
  time?: number;
};

type GooglePlaceResult = {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  geometry: {
    location: GooglePlaceLocation;
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: readonly string[];
  photos?: readonly GooglePlacePhoto[];
  opening_hours?: {
    open_now?: boolean;
  };
  reviews?: readonly GooglePlaceReview[];
};

type GooglePlacesResponse = {
  status: string;
  error_message?: string;
  results?: readonly GooglePlaceResult[];
};

type GooglePlaceDetailsResponse = {
  status: string;
  error_message?: string;
  result?: GooglePlaceResult;
};

export type PlaceCandidate = {
  googlePlaceId: string;
  name: string;
  address: string;
  coordinates: GooglePlaceLocation;
  distanceMeters: number;
  rating?: number;
  reviewCount?: number;
  priceLevel?: PriceRange;
  types: readonly string[];
  photoUrl?: string;
  openNow?: boolean;
};

export type PlaceDetails = PlaceCandidate & {
  phone?: string;
  website?: string;
  reviews: readonly {
    authorName: string;
    rating: number;
    text: string;
    timestamp: number;
  }[];
};

type SearchInput = {
  query: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  openNow: boolean;
};

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const distanceMeters = (from: GooglePlaceLocation, to: GooglePlaceLocation): number => {
  const earthRadiusMeters = 6371000;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const normalizePriceLevel = (priceLevel: number | undefined): PriceRange | undefined => {
  if (priceLevel === undefined || priceLevel < 0 || priceLevel > 4) {
    return undefined;
  }

  return priceLevel as PriceRange;
};

const buildPhotoUrl = (photoReference: string | undefined): string | undefined => {
  if (!photoReference) {
    return undefined;
  }

  const url = new URL('https://maps.googleapis.com/maps/api/place/photo');
  url.searchParams.set('maxwidth', '900');
  url.searchParams.set('photoreference', photoReference);
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);
  return url.toString();
};

const toCandidate = (place: GooglePlaceResult, origin: GooglePlaceLocation): PlaceCandidate => {
  return {
    googlePlaceId: place.place_id,
    name: place.name,
    address: place.vicinity ?? place.formatted_address ?? 'Address unavailable',
    coordinates: place.geometry.location,
    distanceMeters: distanceMeters(origin, place.geometry.location),
    rating: place.rating,
    reviewCount: place.user_ratings_total,
    priceLevel: normalizePriceLevel(place.price_level),
    types: place.types ?? [],
    photoUrl: buildPhotoUrl(place.photos?.[0]?.photo_reference),
    openNow: place.opening_hours?.open_now,
  };
};

const buildNearbyUrl = (input: SearchInput, radiusMeters: number): URL => {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  url.searchParams.set('location', `${input.lat},${input.lng}`);
  url.searchParams.set('radius', String(radiusMeters));
  url.searchParams.set('keyword', input.query);
  url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);
  if (input.openNow) {
    url.searchParams.set('opennow', 'true');
  }
  return url;
};

const radiusSequence = (requestedRadius: number): readonly number[] => {
  const bounded = Math.max(500, Math.min(requestedRadius, 5000));
  const base = [500, 2000, 5000].filter((radius) => radius <= bounded);
  return base.includes(bounded) ? base : [...base, bounded].sort((a, b) => a - b);
};

export const searchPlaceCandidates = async (
  input: SearchInput,
): Promise<{ candidates: readonly PlaceCandidate[]; radiusUsedMeters: number }> => {
  const cacheKey = `google:nearby:${stableHash(input)}`;
  const cached = await getCacheJson<{
    candidates: readonly PlaceCandidate[];
    radiusUsedMeters: number;
  }>(cacheKey);
  if (cached) {
    return cached;
  }

  const origin = { lat: input.lat, lng: input.lng };

  for (const radiusMeters of radiusSequence(input.radiusMeters)) {
    try {
      const data = await fetchJson<GooglePlacesResponse>(
        buildNearbyUrl(input, radiusMeters),
        undefined,
        'Google Places',
      );
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new AppError('GOOGLE_PLACES_ERROR', data.error_message ?? data.status, 502);
      }

      const candidates = (data.results ?? []).map((place) => toCandidate(place, origin));
      if (candidates.length > 0) {
        const result = { candidates, radiusUsedMeters: radiusMeters };
        await setCacheJson(cacheKey, result, CACHE_TTL_SECONDS.googlePlaces);
        return result;
      }
    } catch (error) {
      logUnknownError('Google nearby search radius failed', error, { radiusMeters });
    }
  }

  return { candidates: [], radiusUsedMeters: Math.min(input.radiusMeters, 5000) };
};

export const textSearchPlaceCandidates = async (
  query: string,
): Promise<readonly PlaceCandidate[]> => {
  const cacheKey = `google:text:${stableHash(query)}`;
  const cached = await getCacheJson<readonly PlaceCandidate[]>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    url.searchParams.set('query', query);
    url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);
    const data = await fetchJson<GooglePlacesResponse>(url, undefined, 'Google Places Text Search');
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new AppError('GOOGLE_PLACES_ERROR', data.error_message ?? data.status, 502);
    }

    const firstLocation = data.results?.[0]?.geometry.location ?? { lat: 0, lng: 0 };
    const candidates = (data.results ?? []).map((place) => toCandidate(place, firstLocation));
    await setCacheJson(cacheKey, candidates, CACHE_TTL_SECONDS.googlePlaces);
    return candidates;
  } catch (error) {
    logUnknownError('Google text search failed', error, { query });
    return [];
  }
};

export const getGooglePlaceDetails = async (placeId: string): Promise<PlaceDetails | null> => {
  const cacheKey = `google:details:${placeId}`;
  const cached = await getCacheJson<PlaceDetails>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
    url.searchParams.set('place_id', placeId);
    url.searchParams.set(
      'fields',
      'place_id,name,formatted_address,formatted_phone_number,website,geometry,rating,user_ratings_total,price_level,types,photos,opening_hours,reviews',
    );
    url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);
    const data = await fetchJson<GooglePlaceDetailsResponse>(
      url,
      undefined,
      'Google Place Details',
    );
    if (data.status !== 'OK' || !data.result) {
      return null;
    }

    const candidate = toCandidate(data.result, data.result.geometry.location);
    const details: PlaceDetails = {
      ...candidate,
      phone: data.result.formatted_phone_number,
      website: data.result.website,
      reviews: (data.result.reviews ?? []).map((review) => ({
        authorName: review.author_name ?? 'Google user',
        rating: review.rating ?? 0,
        text: review.text ?? '',
        timestamp: review.time ?? 0,
      })),
    };
    await setCacheJson(cacheKey, details, CACHE_TTL_SECONDS.googlePlaces);
    return details;
  } catch (error) {
    logUnknownError('Google place details failed', error, { placeId });
    return null;
  }
};

export const getCityFromCoordinates = async (
  lat: number,
  lng: number,
): Promise<string | undefined> => {
  try {
    const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
    url.searchParams.set('latlng', `${lat},${lng}`);
    url.searchParams.set('key', env.GOOGLE_PLACES_API_KEY);
    const data = await fetchJson<{
      status: string;
      results?: readonly {
        address_components?: readonly {
          long_name: string;
          types: readonly string[];
        }[];
      }[];
    }>(url, undefined, 'Google Geocoding');

    if (data.status === 'OK' && data.results?.[0]) {
      const locality = data.results[0].address_components?.find((c) =>
        c.types.includes('locality'),
      );
      if (locality) {
        return locality.long_name;
      }
      const adminArea = data.results[0].address_components?.find((c) =>
        c.types.includes('administrative_area_level_1'),
      );
      if (adminArea) {
        return adminArea.long_name;
      }
    }
  } catch (error) {
    logUnknownError('Reverse geocoding failed', error);
  }

  return undefined;
};
