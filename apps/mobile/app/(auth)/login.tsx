import { useAuth, useOAuth } from '@clerk/clerk-expo';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Apple, Facebook, Plane, Search } from 'lucide-react-native';
import { useCallback, useEffect } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { theme } from '../../constants/theme';
import { useHapticAction } from '../../hooks/useHapticAction';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen(): JSX.Element {
  const { isSignedIn, isLoaded } = useAuth();
  const google = useOAuth({ strategy: 'oauth_google' });
  const apple = useOAuth({ strategy: 'oauth_apple' });
  const facebook = useOAuth({ strategy: 'oauth_facebook' });
  const haptic = useHapticAction();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.replace('/(tabs)/discover');
    }
  }, [isLoaded, isSignedIn, router]);

  const authenticate = useCallback(
    async (
      start: (options?: { redirectUrl?: string }) => Promise<{
        createdSessionId?: string | null;
        setActive?: (options: { session: string }) => Promise<void>;
      }>,
    ) => {
      await haptic();
      try {
        const redirectUrl = Linking.createURL('/', { scheme: 'traveling' });
        const result = await start({ redirectUrl });
        if (result.createdSessionId && result.setActive) {
          await result.setActive({ session: result.createdSessionId });
        }
      } catch (error: unknown) {
        const err = error as Record<string, unknown>;
        console.error('Clerk OAuth error message:', err?.message);
        console.error('Clerk OAuth error keys:', Object.keys(err || {}));
        try {
          console.error('Clerk OAuth error stringified:', JSON.stringify(error));
        } catch (e) {
          console.error('Clerk OAuth error could not stringify:', e);
        }
      }
    },
    [haptic],
  );

  return (
    <SafeAreaView className="flex-1 bg-background px-5 py-6">
      <View className="flex-1 justify-between">
        <View className="pt-10">
          <View className="mb-8 h-20 w-20 items-center justify-center rounded-lg bg-primary">
            <Plane size={34} color={theme.colors.text} />
          </View>
          <Text className="font-inter-bold text-5xl text-white">Traveling</Text>
          <Text className="mt-4 max-w-xs font-inter text-lg text-zinc-300">
            Translate instantly and discover places locals actually love.
          </Text>
        </View>
        <GlassCard>
          <View className="gap-3">
            <PrimaryButton
              label="Continue with Google"
              icon={Search}
              onPress={() => {
                void authenticate(google.startOAuthFlow);
              }}
            />
            <PrimaryButton
              label="Continue with Apple"
              icon={Apple}
              variant="ghost"
              onPress={() => {
                void authenticate(apple.startOAuthFlow);
              }}
            />
            <PrimaryButton
              label="Continue with Facebook"
              icon={Facebook}
              variant="ghost"
              onPress={() => {
                void authenticate(facebook.startOAuthFlow);
              }}
            />
          </View>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}
