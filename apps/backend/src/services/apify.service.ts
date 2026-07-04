import type { ReviewSignal } from '@traveling/shared';
import { env } from '../config/env.js';
import { stableHash } from '../utils/hash.js';
import { logUnknownError } from '../utils/logger.js';
import { fetchJson } from './http-client.js';
import { getCacheJson, setCacheJson } from './redis.service.js';

type ApifyTikTokItem = {
  text?: string;
  webVideoUrl?: string;
  diggCount?: number;
  shareCount?: number;
  playCount?: number;
  commentCount?: number;
};

type ApifyFacebookItem = {
  title?: string;
  url?: string;
  rating?: number;
  reviewsCount?: number;
  text?: string;
};

const actorPath = (actorId: string): string => actorId.replace('/', '~');

const runApifyActor = async <T>(
  actorId: string,
  input: Record<string, unknown>,
): Promise<readonly T[]> => {
  const url = new URL(
    `https://api.apify.com/v2/acts/${actorPath(actorId)}/run-sync-get-dataset-items`,
  );
  url.searchParams.set('token', env.APIFY_API_KEY);
  url.searchParams.set('timeout', '45');
  return fetchJson<readonly T[]>(
    url,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify(input),
    },
    'Apify',
  );
};

export const fetchTikTokSignal = async (
  placeName: string,
  cityHint?: string,
): Promise<ReviewSignal | null> => {
  const cacheKey = `apify:tiktok:${stableHash({ placeName, cityHint })}`;
  const cached = await getCacheJson<ReviewSignal>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const query = [placeName, cityHint, 'review'].filter(Boolean).join(' ');
    const items = await runApifyActor<ApifyTikTokItem>(env.APIFY_TIKTOK_ACTOR_ID, {
      searchQueries: [query],
      maxItems: 12,
    });
    const engagement = items.reduce(
      (total, item) =>
        total +
        (item.playCount ?? 0) * 0.05 +
        (item.diggCount ?? 0) +
        (item.shareCount ?? 0) * 2 +
        (item.commentCount ?? 0) * 3,
      0,
    );
    const signal: ReviewSignal = {
      source: 'tiktok',
      engagementCount: Math.round(engagement),
      snippet: items[0]?.text,
      url: items[0]?.webVideoUrl,
    };
    await setCacheJson(cacheKey, signal, 60 * 60 * 2);
    return signal;
  } catch (error) {
    logUnknownError('Apify TikTok signal failed', error, { placeName });
    return null;
  }
};

export const fetchFacebookSignal = async (
  placeName: string,
  cityHint?: string,
): Promise<ReviewSignal | null> => {
  const cacheKey = `apify:facebook:${stableHash({ placeName, cityHint })}`;
  const cached = await getCacheJson<ReviewSignal>(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const query = [placeName, cityHint].filter(Boolean).join(' ');
    const items = await runApifyActor<ApifyFacebookItem>(env.APIFY_FACEBOOK_ACTOR_ID, {
      search: query,
      maxItems: 5,
    });
    const first = items[0];
    if (!first) {
      return null;
    }

    const signal: ReviewSignal = {
      source: 'facebook',
      rating: first.rating,
      reviewCount: first.reviewsCount,
      snippet: first.text ?? first.title,
      url: first.url,
    };
    await setCacheJson(cacheKey, signal, 60 * 60 * 2);
    return signal;
  } catch (error) {
    logUnknownError('Apify Facebook signal failed', error, { placeName });
    return null;
  }
};
