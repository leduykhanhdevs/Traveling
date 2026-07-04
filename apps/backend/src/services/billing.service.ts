import { QUERY_TIERS } from '@traveling/shared';
import { env } from '../config/env.js';
import { fetchJson } from './http-client.js';

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

export const getEntitlementStatus = async (appUserId: string): Promise<EntitlementStatus> => {
  try {
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
  } catch {
    return {
      tier: 'free',
      freeLimits: QUERY_TIERS,
    };
  }
};
