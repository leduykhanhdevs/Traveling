import { Text, View } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export const OfflineBanner = (): JSX.Element | null => {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      accessibilityLabel="Offline mode. Showing cached discoveries, itineraries, and community posts."
      pointerEvents="none"
      className="absolute left-4 right-4 top-12 z-50 rounded-lg border border-amber-300/30 bg-[#2B2535]/95 px-4 py-3"
    >
      <Text className="text-center text-sm font-semibold text-amber-100">Offline mode</Text>
      <Text className="mt-1 text-center text-xs text-amber-100/80">
        Showing cached discoveries, itineraries, and community posts.
      </Text>
    </View>
  );
};
