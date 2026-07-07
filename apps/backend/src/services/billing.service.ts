import { QUERY_TIERS } from '@traveling/shared';
import { env } from '../config/env.js';
import { fetchJson } from './http-client.js';
import { redis } from './redis.service.js';
import { AppError } from '../utils/errors.js';

type RevenueCatSubscriberResponse = {
  subscriber?: {
    entitlements?: Record<
      string,
      {
        expires_date?: string | null;
      }
    >;
  };
};

export type EntitlementStatus = {
  tier: 'free' | 'premium';
  freeLimits: typeof QUERY_TIERS;
};

import { prisma } from '../services/prisma.service.js';

export const getEntitlementStatus = async (appUserId: string): Promise<EntitlementStatus> => {
  try {
    // 1. Check DB for active manual or bank-transfer grants
    const activeGrant = await prisma.premiumGrant.findFirst({
      where: {
        userId: appUserId,
        expiresAt: { gt: new Date() },
      },
    });

    if (activeGrant) {
      return { tier: 'premium', freeLimits: QUERY_TIERS };
    }

    // 2. Check RevenueCat API
    const url = new URL(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    );
    const data = await fetchJson<RevenueCatSubscriberResponse>(
      url,
      {
        headers: {
          authorization: `Bearer ${env.REVENUECAT_API_KEY}`,
        },
      },
      'RevenueCat',
    );
    const premium = data.subscriber?.entitlements?.premium;
    const expires = premium?.expires_date
      ? Date.parse(premium.expires_date)
      : Number.POSITIVE_INFINITY;
    return {
      tier: expires > Date.now() ? 'premium' : 'free',
      freeLimits: QUERY_TIERS,
    };
  } catch (error) {
    console.error('Error in getEntitlementStatus', error);
    return {
      tier: 'free',
      freeLimits: QUERY_TIERS,
    };
  }
};

export const checkAndIncrementUsage = async (
  userId: string,
  feature: 'itinerary' | 'translation' | 'discover' | 'transcribe',
): Promise<void> => {
  const status = await getEntitlementStatus(userId);
  if (status.tier === 'premium') return;

  const limit =
    feature === 'translation'
      ? status.freeLimits.freeTranslationsPerDay
      : status.freeLimits.freeAiQueriesPerDay;

  const dateStr = new Date().toISOString().split('T')[0];
  const key = `usage:${userId}:${feature}:${dateStr}`;

  const current = await redis.incr(key);
  if (current === 1) {
    await redis.expire(key, 86400); // 24 hours
  }

  if (current > limit) {
    throw new AppError(
      'PAYMENT_REQUIRED',
      `You have exceeded your daily free limit for ${feature}s. Please upgrade to premium.`,
      402,
    );
  }
};
