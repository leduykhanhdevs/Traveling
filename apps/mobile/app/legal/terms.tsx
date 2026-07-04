import * as WebBrowser from 'expo-web-browser';
import { Stack, router } from 'expo-router';
import { ExternalLink } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { PrimaryButton } from '../../components/PrimaryButton';

const legalUrl = (): string => {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';
  return `${baseUrl.replace(/\/$/, '')}/legal/terms`;
};

export default function TermsScreen(): JSX.Element {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const url = legalUrl();

  const openTerms = useCallback(async (): Promise<void> => {
    setOpening(true);
    setError(null);

    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to open the Terms.';
      setError(message);
    } finally {
      setOpening(false);
    }
  }, [url]);

  useEffect(() => {
    void openTerms();
  }, [openTerms]);

  return (
    <SafeAreaView className="flex-1 bg-background px-5 pt-6">
      <Stack.Screen options={{ headerShown: false }} />
      <View className="flex-1 justify-center">
        <GlassCard>
          <View className="gap-4">
            <View>
              <Text className="font-inter-bold text-3xl text-white">Terms of Service</Text>
              <Text className="mt-2 font-inter text-sm text-zinc-300">{url}</Text>
            </View>
            {error ? (
              <Text className="rounded-lg bg-accent/20 p-3 font-inter-semibold text-accent">
                {error}
              </Text>
            ) : null}
            <PrimaryButton
              label="Open Terms"
              icon={ExternalLink}
              loading={opening}
              onPress={() => {
                void openTerms();
              }}
            />
            <PrimaryButton label="Back" variant="ghost" onPress={() => router.back()} />
          </View>
        </GlassCard>
      </View>
    </SafeAreaView>
  );
}
