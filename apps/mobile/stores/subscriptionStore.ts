import { create } from 'zustand';

type SubscriptionState = {
  tier: 'free' | 'premium';
  aiQueriesUsedToday: number;
  translationsUsedToday: number;
  setTier: (tier: 'free' | 'premium') => void;
  incrementAiQuery: () => void;
  incrementTranslation: () => void;
};

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  tier: 'free',
  aiQueriesUsedToday: 0,
  translationsUsedToday: 0,
  setTier: (tier) => set({ tier }),
  incrementAiQuery: () => set((state) => ({ aiQueriesUsedToday: state.aiQueriesUsedToday + 1 })),
  incrementTranslation: () =>
    set((state) => ({
      translationsUsedToday: state.translationsUsedToday + 1,
    })),
}));
