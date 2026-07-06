import '../global.css';
import 'react-native-gesture-handler';

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
import { AppState, Modal, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { MMKV } from 'react-native-mmkv';
import { OfflineBanner } from '../components/OfflineBanner';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { usePushNotifications } from '../hooks/usePushNotifications';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Lock } from 'lucide-react-native';

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

const BiometricGate = ({ children }: { children: React.ReactNode }) => {
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    let appState = AppState.currentState;

    const checkLock = async () => {
      const enabled = await SecureStore.getItemAsync('biometrics');
      if (enabled === 'true') {
        setLocked(true);
        authenticate();
      }
    };

    const authenticate = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        if (!hasHardware || !isEnrolled) {
          setLocked(false);
          return;
        }
        
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Unlock Traveling',
          disableDeviceFallback: true,
          cancelLabel: 'Cancel',
        });
        if (result.success) {
          setLocked(false);
        } else if (__DEV__) {
          await SecureStore.deleteItemAsync('biometrics'); // Auto-disable to stop annoying the dev
          setLocked(false); // Bypass if canceled in dev mode
        }
      } catch (error) {
        console.error('Biometric auth error:', error);
        if (__DEV__) {
          await SecureStore.deleteItemAsync('biometrics');
          setLocked(false);
        }
      }
    };

    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        void checkLock();
      }
      appState = nextAppState;
    });

    void checkLock();

    return () => {
      subscription.remove();
    };
  }, []);

  const handleManualUnlock = () => {
    LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Traveling',
      disableDeviceFallback: true,
      cancelLabel: 'Cancel',
    })
      .then(result => {
        if (result.success) {
          setLocked(false);
        } else if (__DEV__) {
          void SecureStore.deleteItemAsync('biometrics');
          setLocked(false); // Bypass if canceled in dev mode
        }
      })
      .catch(error => {
        console.error('Manual unlock error:', error);
        if (__DEV__) {
          void SecureStore.deleteItemAsync('biometrics');
          setLocked(false);
        }
      });
  };

  return (
    <>
      {children}
      <Modal visible={locked} transparent={false} animationType="fade">
        <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
          <Lock color="white" size={48} />
          <Text style={{ color: 'white', marginTop: 16, fontSize: 18, fontFamily: 'Inter_600SemiBold' }}>Traveling is locked</Text>
          <View style={{ marginTop: 24, width: 200 }}>
            <PrimaryButton label="Unlock" onPress={handleManualUnlock} />
          </View>
        </View>
      </Modal>
    </>
  );
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
          <StatusBar style="light" />
          <OfflineBanner />
          <BiometricGate>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: theme.colors.background },
                headerShown: false,
              }}
            />
          </BiometricGate>
        </QueryClientProvider>
      </ClerkProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
