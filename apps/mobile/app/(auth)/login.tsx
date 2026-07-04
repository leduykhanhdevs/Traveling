import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { Apple, Facebook, Plane, Search } from 'lucide-react-native';
import { useCallback } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';
import { theme } from '../../constants/theme';
import { useHapticAction } from '../../hooks/useHapticAction';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen(): JSX.Element {
  const google = useOAuth({ strategy: 'oauth_google' });
  const apple = useOAuth({ strategy: 'oauth_apple' });
  const facebook = useOAuth({ strategy: 'oauth_facebook' });
  const haptic = useHapticAction();

  const authenticate = useCallback(
    async (
      start: () => Promise<{
        createdSessionId?: string | null;
        setActive?: (options: { session: string }) => Promise<void>;
      }>,
    ) => {
      await haptic();
      try {
        const result = await start();
        if (result.createdSessionId && result.setActive) {
          await result.setActive({ session: result.createdSessionId });
        }
      } catch {
        // Clerk surfaces OAuth failures through its own browser/session UI.
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
