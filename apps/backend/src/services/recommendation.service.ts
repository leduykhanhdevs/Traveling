import {
  CACHE_TTL_SECONDS,
  type DiscoverRequest,
  type DiscoverResponse,
  type RankedPlace,
  type ReviewSignal,
  type ScoreBreakdown,
} from '@traveling/shared';
import { stableHash } from '../utils/hash.js';
import { logUnknownError } from '../utils/logger.js';
import { fetchFacebookSignal, fetchTikTokSignal } from './apify.service.js';
import {
  getCityFromCoordinates,
  searchPlaceCandidates,
  type PlaceCandidate,
} from './google-places.service.js';
import { addPlaceSummaries, parseDiscoveryIntent } from './openai.service.js';
import { prisma } from './prisma.service.js';
import { getCacheJson, setCacheJson } from './redis.service.js';
import { fetchGoogleMapsSignal } from './serpapi.service.js';

type PlaceSignals = {
  google: ReviewSignal | null;
  tiktok: ReviewSignal | null;
  facebook: ReviewSignal | null;
};

const normalizeRating = (rating: number | undefined): number => {
  if (!rating) {
    return 0;
  }
  return Math.min(100, Math.max(0, (rating / 5) * 100));
};

const normalizeVolume = (reviewCount: number | undefined, maxReviewCount: number): number => {
  if (!reviewCount || maxReviewCount <= 0) {
    return 0;
  }
  return Math.min(100, (Math.log10(reviewCount + 1) / Math.log10(maxReviewCount + 1)) * 100);
};

const normalizeEngagement = (engagementCount: number | undefined): number => {
  if (!engagementCount || engagementCount <= 0) {
    return 0;
  }
  return Math.min(100, (Math.log10(engagementCount + 1) / 6) * 100);
};

const calculateScore = (
  place: PlaceCandidate,
  signals: PlaceSignals,
  maxReviewCount: number,
): ScoreBreakdown => {
  const googleRating = signals.google?.rating ?? place.rating;
  const googleReviewCount = signals.google?.reviewCount ?? place.reviewCount;
  const facebookReviewCount = signals.facebook?.reviewCount ?? 0;
  const reviewCount = Math.max(googleReviewCount ?? 0, facebookReviewCount);
  const googleRatingScore = normalizeRating(googleRating);
  const reviewVolumeScore = normalizeVolume(reviewCount, maxReviewCount);
  const socialProofScore = normalizeEngagement(signals.tiktok?.engagementCount);
  const compositeScore = Math.round(
    googleRatingScore * 0.4 + reviewVolumeScore * 0.3 + socialProofScore * 0.3,
  );

  return {
    googleRatingScore: Math.round(googleRatingScore),
    reviewVolumeScore: Math.round(reviewVolumeScore),
    socialProofScore: Math.round(socialProofScore),
    compositeScore,
  };
};

const cuisineTags = (place: PlaceCandidate, hints: readonly string[]): readonly string[] => {
  const normalizedTypes = place.types
    .filter((type) =>
      ['restaurant', 'food', 'cafe', 'bar', 'bakery', 'tourist_attraction'].includes(type),
    )
    .map((type) => type.replace(/_/g, ' '));
  return [...new Set([...hints, ...normalizedTypes])].slice(0, 5);
};

const collectSignals = async (place: PlaceCandidate, cityHint?: string): Promise<PlaceSignals> => {
  const [google, tiktok, facebook] = await Promise.all([
    fetchGoogleMapsSignal(place.name, place.coordinates.lat, place.coordinates.lng),
    fetchTikTokSignal(place.name, cityHint),
    fetchFacebookSignal(place.name, cityHint),
  ]);
  return { google, tiktok, facebook };
};

const toRankedPlace = (
  place: PlaceCandidate,
  signals: PlaceSignals,
  score: ScoreBreakdown,
  hints: readonly string[],
): RankedPlace => {
  const reviewSignals = [signals.google, signals.facebook, signals.tiktok].filter(
    (signal): signal is ReviewSignal => Boolean(signal),
  );
  const snippet = signals.google?.snippet ?? signals.facebook?.snippet ?? signals.tiktok?.snippet;

  return {
    id: place.googlePlaceId,
    googlePlaceId: place.googlePlaceId,
    name: place.name,
    address: place.address,
    coordinates: place.coordinates,
    distanceMeters: place.distanceMeters,
    priceLevel: place.priceLevel,
    cuisineTags: cuisineTags(place, hints),
    photoUrl: place.photoUrl,
    openNow: place.openNow,
    topReviewSnippet: snippet,
    score,
    reviewSignals,
    aiSummary: snippet ?? `${place.name} matches your search and nearby travel context.`,
  };
};

const persistSearchHistory = async (
  request: DiscoverRequest,
  response: DiscoverResponse,
): Promise<void> => {
  if (!request.userId) {
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        clerkId: request.userId,
      },
    });

    if (!user) {
      return;
    }

    await prisma.searchHistory.create({
      data: {
        userId: user.id,
        query: request.query,
        lat: request.lat,
        lng: request.lng,
        results: response,
      },
    });
  } catch (error) {
    logUnknownError('Persisting search history failed', error, { userId: request.userId });
  }
};

export const discoverPlaces = async (request: DiscoverRequest): Promise<DiscoverResponse> => {
  const cacheKey = `discover:${stableHash(request)}`;
  const cached = await getCacheJson<DiscoverResponse>(cacheKey);
  if (cached) {
    return cached;
  }

  const intent = await parseDiscoveryIntent(request.query);
  const { candidates, radiusUsedMeters } = await searchPlaceCandidates({
    query: intent.normalizedQuery,
    lat: request.lat,
    lng: request.lng,
    radiusMeters: request.filters.radiusMeters,
    openNow: request.filters.openNow,
  });

  const filtered = candidates.filter((candidate) => {
    const priceMatches =
      request.filters.priceRange.length === 0 ||
      (candidate.priceLevel !== undefined &&
        request.filters.priceRange.includes(candidate.priceLevel));
    return priceMatches;
  });

  const geocodedCity = await getCityFromCoordinates(request.lat, request.lng);
  const cityHint = geocodedCity || (intent.detectedLanguage === 'vi' ? 'Ho Chi Minh City' : undefined);
  const signalEntries = await Promise.all(
    filtered.map(async (place) => ({
      place,
      signals: await collectSignals(place, cityHint),
    })),
  );
  const maxReviewCount = Math.max(
    1,
    ...signalEntries.map(({ place, signals }) =>
      Math.max(
        signals.google?.reviewCount ?? 0,
        signals.facebook?.reviewCount ?? 0,
        place.reviewCount ?? 0,
      ),
    ),
  );
  const ranked = signalEntries
    .map(({ place, signals }) =>
      toRankedPlace(
        place,
        signals,
        calculateScore(place, signals, maxReviewCount),
        intent.cuisineHints,
      ),
    )
    .sort((a, b) => b.score.compositeScore - a.score.compositeScore);

  const surprisePlaces = ranked
    .filter((place) => place.score.googleRatingScore >= 84 && place.score.reviewVolumeScore <= 45)
    .sort((a, b) => b.score.compositeScore - a.score.compositeScore);
  const selected =
    request.surpriseMe && surprisePlaces[0] ? [surprisePlaces[0]] : ranked.slice(0, 20);
  const summarized = await addPlaceSummaries(selected, request.query);
  const response: DiscoverResponse = {
    queryType: intent.queryType,
    detectedLanguage: intent.detectedLanguage,
    normalizedQuery: intent.normalizedQuery,
    radiusUsedMeters,
    places: summarized,
  };

  await setCacheJson(cacheKey, response, CACHE_TTL_SECONDS.compositeScores);
  await persistSearchHistory(request, response);
  return response;
};
