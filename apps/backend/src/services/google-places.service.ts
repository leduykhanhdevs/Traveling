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

const fallbackPhotos: Record<string, string[]> = {
  cafe: [
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&auto=format&fit=crop&q=80',
  ],
  restaurant: [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&auto=format&fit=crop&q=80',
  ],
  bar: [
    'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800&auto=format&fit=crop&q=80',
  ],
  hotel: [
    'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&auto=format&fit=crop&q=80',
  ],
  tourist: [
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1528127269322-539801943592?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80',
  ],
  general: [
    'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
  ],
};

const getDeterministicIndex = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getFallbackPhoto = (types: readonly string[], name: string): string => {
  const lowercaseName = name.toLowerCase();
  
  if (
    types.includes('cafe') ||
    types.includes('coffee') ||
    lowercaseName.includes('cafe') ||
    lowercaseName.includes('coffee')
  ) {
    const list = fallbackPhotos.cafe!;
    return list[getDeterministicIndex(name) % list.length]!;
  }
  if (
    types.includes('restaurant') ||
    types.includes('food') ||
    lowercaseName.includes('restaurant') ||
    lowercaseName.includes('food') ||
    lowercaseName.includes('quán') ||
    lowercaseName.includes('phở') ||
    lowercaseName.includes('bánh')
  ) {
    const list = fallbackPhotos.restaurant!;
    return list[getDeterministicIndex(name) % list.length]!;
  }
  if (
    types.includes('bar') ||
    types.includes('night_club') ||
    lowercaseName.includes('bar') ||
    lowercaseName.includes('pub') ||
    lowercaseName.includes('club')
  ) {
    const list = fallbackPhotos.bar!;
    return list[getDeterministicIndex(name) % list.length]!;
  }
  if (
    types.includes('lodging') ||
    types.includes('hotel') ||
    lowercaseName.includes('hotel') ||
    lowercaseName.includes('stay') ||
    lowercaseName.includes('homestay')
  ) {
    const list = fallbackPhotos.hotel!;
    return list[getDeterministicIndex(name) % list.length]!;
  }
  if (
    types.includes('tourist_attraction') ||
    types.includes('museum') ||
    lowercaseName.includes('museum') ||
    lowercaseName.includes('church') ||
    lowercaseName.includes('pagoda') ||
    lowercaseName.includes('temple') ||
    lowercaseName.includes('chùa')
  ) {
    const list = fallbackPhotos.tourist!;
    return list[getDeterministicIndex(name) % list.length]!;
  }

  const list = fallbackPhotos.general!;
  return list[getDeterministicIndex(name) % list.length]!;
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
  const rawPhoto = buildPhotoUrl(place.photos?.[0]?.photo_reference);
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
    photoUrl: rawPhoto || getFallbackPhoto(place.types ?? [], place.name),
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

