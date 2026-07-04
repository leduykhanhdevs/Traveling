import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildOfflinePhrasePack, type OfflinePhrase } from '../utils/offlinePhrases';

type OfflinePhrasesState = {
  packs: Record<string, readonly OfflinePhrase[]>;
  downloadPack: (countryCode: string) => void;
  removePack: (countryCode: string) => void;
};

export const useOfflinePhrasesStore = create<OfflinePhrasesState>()(
  persist(
    (set) => ({
      packs: {},
      downloadPack: (countryCode) =>
        set((state) => ({
          packs: {
            ...state.packs,
            [countryCode]: buildOfflinePhrasePack(countryCode),
          },
        })),
      removePack: (countryCode) =>
        set((state) => {
          const next = { ...state.packs };
          delete next[countryCode];
          return { packs: next };
        }),
    }),
    {
      name: 'traveling-offline-phrases',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
