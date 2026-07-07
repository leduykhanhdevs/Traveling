import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useState } from 'react';
import { restorePurchases } from '../../../services/revenuecat';
import { useSubscriptionStore } from '../../../stores/subscriptionStore';

export default function AccountScreen(): JSX.Element {
  const [restoring, setRestoring] = useState(false);
  const setTier = useSubscriptionStore((state) => state.setTier);

  const handleRestore = async () => {
    setRestoring(true);
    const result = await restorePurchases();
    setRestoring(false);
    if (result.status === 'success') {
      setTier('premium');
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Restore Error', result.message);
    }
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20 }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </TouchableOpacity>
          <Text className="font-inter-bold text-3xl text-white">Account</Text>
        </View>

        <GlassCard>
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-white">Account Details</Text>
                <Text className="font-inter text-sm text-zinc-400">Managed by Clerk</Text>
              </View>
            </View>
            <View className="h-px bg-white/10" />
            <Text className="font-inter text-sm text-zinc-300">
              Authentication is handled securely via Clerk. All details, active login sessions, and passwords can be modified directly on your Clerk dashboard or via OAuth provider settings.
            </Text>
          </View>
        </GlassCard>

        <GlassCard>
          <View className="gap-6">
            <View>
              <Text className="font-inter-semibold text-lg text-white mb-2">Purchases</Text>
              <Text className="font-inter text-sm text-zinc-400 mb-4">
                Restore your premium subscription if it is not active.
              </Text>
              <PrimaryButton
                label={restoring ? 'Restoring...' : 'Restore Purchases'}
                onPress={handleRestore}
                disabled={restoring}
              />
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
