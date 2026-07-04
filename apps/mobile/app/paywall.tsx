import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { configureRevenueCat, type PurchaseResult } from '../services/revenuecat';

const features: readonly { label: string; free: string; premium: string }[] = [
  { label: 'AI discovery', free: '20/day', premium: 'Unlimited' },
  { label: 'Translations', free: '50/day', premium: 'Unlimited' },
  { label: 'Camera translate', free: 'No', premium: 'Yes' },
  { label: 'Offline packs', free: 'No', premium: 'Yes' },
  { label: 'Itinerary planner', free: 'No', premium: 'Yes' },
];

export default function PaywallScreen(): JSX.Element {
  const [status, setStatus] = useState<PurchaseResult | null>(null);

  useEffect(() => {
    void configureRevenueCat().then(setStatus);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-10 pt-5">
        <View>
          <Text className="font-inter-bold text-4xl text-white">Traveling Premium</Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            Unlimited discovery, camera translation, offline phrases, and full itineraries.
          </Text>
        </View>
        <GlassCard>
          <Text className="font-inter-bold text-4xl text-white">$4.99</Text>
          <Text className="font-inter text-zinc-300">per month</Text>
        </GlassCard>
        <GlassCard>
          <View className="gap-3">
            {features.map((feature) => (
              <View
                key={feature.label}
                className="grid-cols-3 flex-row items-center gap-3 rounded-lg bg-white/10 p-3"
              >
                <Text className="flex-1 font-inter-semibold text-white">{feature.label}</Text>
                <Text className="w-20 text-center font-inter text-zinc-300">{feature.free}</Text>
                <View className="w-24 flex-row items-center justify-center gap-1">
                  {feature.premium === 'Yes' ? (
                    <Check color={theme.colors.success} size={16} />
                  ) : null}
                  {feature.premium === 'No' ? <X color={theme.colors.danger} size={16} /> : null}
                  <Text className="font-inter-semibold text-white">{feature.premium}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>
        {status ? <Text className="font-inter text-sm text-zinc-300">{status.message}</Text> : null}
        <PrimaryButton label="Continue" onPress={() => router.back()} />
      </ScrollView>
    </SafeAreaView>
  );
}
