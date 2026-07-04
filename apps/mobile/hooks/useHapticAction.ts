import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export const useHapticAction = (): ((style?: Haptics.ImpactFeedbackStyle) => Promise<void>) =>
  useCallback(async (style = Haptics.ImpactFeedbackStyle.Medium) => {
    try {
      await Haptics.impactAsync(style);
    } catch {
      // Haptics are best-effort and should not interrupt a primary action.
    }
  }, []);
