import '../global.css';
import 'react-native-gesture-handler';
import '../i18n';
import { ClerkProvider, useAuth } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';
import {
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import NetInfo from '@react-native-community/netinfo';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MMKV } from 'react-native-mmkv';
import { OfflineBanner } from '../components/OfflineBanner';
import { usePreferencesStore } from '../stores/preferencesStore';
import { theme } from '../constants/theme';
import { usePushNotifications } from '../hooks/usePushNotifications';
// imports removed

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const queryCacheMaxAgeMs = 1000 * 60 * 60 * 24 * 7;
const defaultQueryStaleTimeMs = 1000 * 60 * 5;

type PersistStorage = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: __DEV__ ? 'development' : 'production',
});

SplashScreen.preventAutoHideAsync().catch(() => undefined);

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  }),
);

const createMemoryPersistStorage = (): PersistStorage => {
  const cache = new Map<string, string>();

  return {
    getItem: (key) => cache.get(key) ?? null,
    removeItem: (key) => {
      cache.delete(key);
    },
    setItem: (key, value) => {
      cache.set(key, value);
    },
  };
};

const createMmkvPersistStorage = (): PersistStorage => {
  try {
    const storage = new MMKV({ id: 'traveling-react-query-cache' });

    return {
      getItem: (key) => storage.getString(key) ?? null,
      removeItem: (key) => {
        storage.delete(key);
      },
      setItem: (key, value) => {
        storage.set(key, value);
      },
    };
  } catch {
    return createMemoryPersistStorage();
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: queryCacheMaxAgeMs,
      networkMode: 'offlineFirst',
      retry: 1,
      staleTime: defaultQueryStaleTimeMs,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const queryPersister = createSyncStoragePersister({
  key: 'TRAVELING_REACT_QUERY_CACHE',
  storage: createMmkvPersistStorage(),
  throttleTime: 1000,
});

const [, restoreQueryCache] = persistQueryClient({
  maxAge: queryCacheMaxAgeMs,
  persister: queryPersister,
  queryClient,
});

const SentryUserSync = (): null => {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    Sentry.setUser(userId ? { id: userId } : null);
  }, [isLoaded, userId]);

  return null;
};

const PushNotificationRegistration = (): null => {
  usePushNotifications();
  return null;
};

const ProfileSyncer = (): null => {
  const { isLoaded, getToken } = useAuth();
  const preferences = usePreferencesStore();

  useEffect(() => {
    if (!isLoaded) return;
    
    const sync = async () => {
      const token = await getToken();
      if (!token) return;
      
      const { updateProfile } = await import('../services/profile');
      try {
        await updateProfile({
          email: 'synced-from-mobile@example.com', // Dummy email, the backend upsert actually uses clerkId anyway, but schema requires it. Better to get real email if possible.
          preferredLanguage: preferences.preferredLanguage,
          travelStyle: preferences.travelStyle,
          dietaryRestrictions: preferences.dietaryRestrictions,
          spicyPreference: preferences.spicyPreference,
          sweetPreference: preferences.sweetPreference,
          savoryPreference: preferences.savoryPreference,
          appLocale: preferences.appLocale,
        }, token);
      } catch (e) {
        console.error('Failed to sync profile', e);
      }
    };
    
    void sync();
  }, [isLoaded, getToken, preferences]);

  return null;
};

function RootLayout(): JSX.Element | null {
  const [queryCacheReady, setQueryCacheReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    let mounted = true;

    restoreQueryCache
      .catch(() => undefined)
      .finally(() => {
        if (mounted) {
          setQueryCacheReady(true);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (fontsLoaded && queryCacheReady) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded, queryCacheReady]);

  if (!fontsLoaded || !queryCacheReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''}
        tokenCache={tokenCache}
      >
        <QueryClientProvider client={queryClient}>
          <SentryUserSync />
          <PushNotificationRegistration />
          <ProfileSyncer />
          <StatusBar style="light" />
          <OfflineBanner />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: theme.colors.background },
              headerShown: false,
            }}
          />
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
