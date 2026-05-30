import { Text, useColorScheme, View } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineBanner = (): JSX.Element | null => {
  const { isOffline } = useNetworkStatus();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme !== 'light';

  if (!isOffline) {
    return null;
  }

  return (
    <View
      accessibilityLabel="Offline mode. Showing cached discoveries, itineraries, and community posts."
      pointerEvents="none"
      className={`absolute left-4 right-4 top-12 z-50 rounded-lg border px-4 py-3 ${
        isDarkMode
          ? 'border-amber-300/30 bg-[#2B2535]/95'
          : 'border-amber-500/40 bg-amber-50/95'
      }`}
    >
      <Text
        className={`text-center text-sm font-semibold ${
          isDarkMode ? 'text-amber-100' : 'text-amber-950'
        }`}
      >
        Offline mode
      </Text>
      <Text
        className={`mt-1 text-center text-xs ${
          isDarkMode ? 'text-amber-100/80' : 'text-amber-900'
        }`}
      >
        Showing cached discoveries, itineraries, and community posts.
      </Text>
    </View>
  );
};
