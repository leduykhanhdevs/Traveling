import { beforeEach, describe, expect, it } from '@jest/globals';
import { useSubscriptionStore } from '../stores/subscriptionStore';

describe('subscriptionStore', () => {
  beforeEach(() => {
    useSubscriptionStore.setState({
      tier: 'free',
      aiQueriesUsedToday: 0,
      translationsUsedToday: 0,
    });
  });

  it('starts on the free tier with zero usage counters', () => {
    expect(useSubscriptionStore.getState()).toMatchObject({
      tier: 'free',
      aiQueriesUsedToday: 0,
      translationsUsedToday: 0,
    });
  });

  it('updates the subscription tier', () => {
    useSubscriptionStore.getState().setTier('premium');

    expect(useSubscriptionStore.getState().tier).toBe('premium');
  });

  it('increments AI query and translation usage independently', () => {
    useSubscriptionStore.getState().incrementAiQuery();
    useSubscriptionStore.getState().incrementAiQuery();
    useSubscriptionStore.getState().incrementTranslation();

    expect(useSubscriptionStore.getState().aiQueriesUsedToday).toBe(2);
    expect(useSubscriptionStore.getState().translationsUsedToday).toBe(1);
  });
});
