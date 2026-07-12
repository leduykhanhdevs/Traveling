import { router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { useState } from 'react';
import { configureRevenueCat, restorePurchases } from '../../../services/revenuecat';
import { useSubscriptionStore } from '../../../stores/subscriptionStore';
import { useAuth } from '@clerk/clerk-expo';
import { useTranslation } from 'react-i18next';
import { getProfile } from '../../../services/profile';

export default function AccountScreen(): JSX.Element {
  const { t } = useTranslation();
  const { getToken, userId } = useAuth();
  const [restoring, setRestoring] = useState(false);
  const setTier = useSubscriptionStore((state) => state.setTier);

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const configuration = await configureRevenueCat(userId);
      if (configuration.status !== 'ready') {
        Alert.alert(t('paywall.notAvailable'), t('paywall.noPackages'));
        return;
      }

      const result = await restorePurchases();
      if (result.status !== 'success') {
        Alert.alert(t('paywall.purchaseError'), t('paywall.noPackages'));
        return;
      }

      const token = await getToken();
      if (token) {
        const profile = await getProfile(token);
        setTier(profile.entitlement.tier);
      }
      Alert.alert(t('paywall.success'), t('paywall.success'));
    } catch {
      Alert.alert(t('paywall.purchaseError'), t('paywall.noPackages'));
    } finally {
      setRestoring(false);
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
          <Text className="font-inter-bold text-3xl text-white">
            {t('profile.settings.account')}
          </Text>
        </View>

        <GlassCard>
          <View className="gap-6">
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="font-inter-semibold text-lg text-white">
                  {t('profile.account.details')}
                </Text>
                <Text className="font-inter text-sm text-zinc-400">
                  {t('profile.account.managedByClerk')}
                </Text>
              </View>
            </View>
            <View className="h-px bg-white/10" />
            <Text className="font-inter text-sm text-zinc-300">
              {t('profile.account.authDescription')}
            </Text>
          </View>
        </GlassCard>

        <GlassCard>
          <View className="gap-6">
            <View>
              <Text className="font-inter-semibold text-lg text-white mb-2">
                {t('profile.settings.subscription')}
              </Text>
              <Text className="font-inter text-sm text-zinc-400 mb-4">
                {t('profile.account.restoreDescription')}
              </Text>
              <PrimaryButton
                label={
                  restoring
                    ? t('profile.account.restoring')
                    : t('profile.account.restorePurchases')
                }
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
