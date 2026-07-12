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
import { onlineManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Sentry from '@sentry/react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { OfflineBanner } from '../components/OfflineBanner';
import { theme } from '../constants/theme';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { setApiAuthTokenProvider } from '../services/api';
import { updateProfile } from '../services/profile';
import { usePreferencesStore } from '../stores/preferencesStore';
import { useSubscriptionStore } from '../stores/subscriptionStore';

const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const defaultQueryStaleTimeMs = 1000 * 60 * 5;

Sentry.init({
  dsn: sentryDsn,
  enabled: Boolean(sentryDsn),
  environment: __DEV__ ? 'development' : 'production',
  sendDefaultPii: false,
  beforeBreadcrumb: (breadcrumb) =>
    breadcrumb.category?.includes('http') ? { ...breadcrumb, data: undefined } : breadcrumb,
  beforeSend: (event) => ({
    ...event,
    request: event.request
      ? {
          ...event.request,
          cookies: undefined,
          data: undefined,
          headers: undefined,
          query_string: undefined,
        }
      : undefined,
  }),
});

SplashScreen.preventAutoHideAsync().catch(() => undefined);

onlineManager.setEventListener((setOnline) =>
  NetInfo.addEventListener((state) => {
    setOnline(state.isConnected !== false);
  }),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst',
      retry: 1,
      staleTime: defaultQueryStaleTimeMs,
    },
    mutations: {
      networkMode: 'offlineFirst',
    },
  },
});

const AuthSessionBoundary = (): null => {
  const { getToken, isLoaded, userId } = useAuth();
  const previousUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    setApiAuthTokenProvider((skipCache) => getToken({ skipCache }));
    return () => {
      setApiAuthTokenProvider(null);
    };
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const nextUserId = userId ?? null;
    if (previousUserId.current !== undefined && previousUserId.current !== nextUserId) {
      queryClient.clear();
      useSubscriptionStore.getState().setTier('free');
    }
    previousUserId.current = nextUserId;
    Sentry.setUser(userId ? { id: userId } : null);
  }, [isLoaded, userId]);

  return null;
};

const PushNotificationRegistration = (): null => {
  usePushNotifications();
  return null;
};

const ProfileSyncer = (): null => {
  const { getToken, isLoaded, userId } = useAuth();
  const preferredLanguage = usePreferencesStore((state) => state.preferredLanguage);
  const dietaryRestrictions = usePreferencesStore((state) => state.dietaryRestrictions);
  const travelStyle = usePreferencesStore((state) => state.travelStyle);
  const spicyPreference = usePreferencesStore((state) => state.spicyPreference);
  const sweetPreference = usePreferencesStore((state) => state.sweetPreference);
  const savoryPreference = usePreferencesStore((state) => state.savoryPreference);
  const appLocale = usePreferencesStore((state) => state.appLocale);

  useEffect(() => {
    if (!isLoaded || !userId) {
      return;
    }

    const syncProfile = async (): Promise<void> => {
      const token = await getToken();
      if (!token) return;
      await updateProfile(
        {
          appLocale,
          dietaryRestrictions,
          preferredLanguage,
          savoryPreference,
          spicyPreference,
          sweetPreference,
          travelStyle,
        },
        token,
      );
    };

    void syncProfile().catch((error: unknown) => {
      Sentry.captureException(error);
    });
  }, [
    appLocale,
    dietaryRestrictions,
    getToken,
    isLoaded,
    preferredLanguage,
    savoryPreference,
    spicyPreference,
    sweetPreference,
    travelStyle,
    userId,
  ]);

  return null;
};

function RootLayout(): JSX.Element | null {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ClerkProvider
        publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? ''}
        tokenCache={tokenCache}
      >
        <QueryClientProvider client={queryClient}>
          <AuthSessionBoundary />
          <ProfileSyncer />
          <PushNotificationRegistration />
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
