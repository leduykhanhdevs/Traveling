import type { ReviewSignal } from '@traveling/shared';
import { env } from '../config/env.js';
import { stableHash } from '../utils/hash.js';
import { logUnknownError } from '../utils/logger.js';
import { fetchJson } from './http-client.js';
import { getCacheJson, setCacheJson } from './redis.service.js';

type SerpApiLocalResult = {
  title?: string;
  rating?: number;
  reviews?: number | string;
  snippet?: string;
  address?: string;
  place_id?: string;
};

type SerpApiResponse = {
  local_results?: readonly SerpApiLocalResult[];
  place_results?: SerpApiLocalResult;
};

const parseReviewCount = (reviews: number | string | undefined): number | undefined => {
  if (typeof reviews === 'number') {
    return reviews;
  }

  if (typeof reviews === 'string') {
    const parsed = Number.parseInt(reviews.replace(/[^\d]/g, ''), 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }

  return undefined;
};

export const fetchGoogleMapsSignal = async (
  placeName: string,
  lat: number,
  lng: number,
): Promise<ReviewSignal | null> => {
  const cacheKey = `serpapi:maps:${stableHash({ placeName, lat, lng })}`;
  const cached = await getCacheJson<ReviewSignal>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const url = new URL('https://serpapi.com/search.json');
    url.searchParams.set('engine', 'google_maps');
    url.searchParams.set('q', placeName);
    url.searchParams.set('ll', `@${lat},${lng},15z`);
    url.searchParams.set('type', 'search');
    url.searchParams.set('api_key', env.SERPAPI_KEY);
    const data = await fetchJson<SerpApiResponse>(url, undefined, 'SerpAPI');
    const result = data.place_results ?? data.local_results?.[0];

    if (!result) {
      return null;
    }

    const signal: ReviewSignal = {
      source: 'google',
      rating: result.rating,
      reviewCount: parseReviewCount(result.reviews),
      snippet: result.snippet,
    };
    await setCacheJson(cacheKey, signal, 60 * 60 * 6);
    return signal;
  } catch (error) {
    logUnknownError('SerpAPI signal failed', error, { placeName });
    return null;
  }
};
