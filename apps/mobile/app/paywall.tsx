import { router } from 'expo-router';
import { Check, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import type { PurchasesPackage } from 'react-native-purchases';
import { QUERY_TIERS } from '@traveling/shared';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { configureRevenueCat, getOfferings, purchasePackage, type PurchaseResult } from '../services/revenuecat';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { useTranslation } from 'react-i18next';
import { getProfile } from '../services/profile';

const getFeatures = (t: (key: string) => string) => [
  { label: t('paywall.features.aiDiscovery'), free: String(QUERY_TIERS.freeAiQueriesPerDay), premium: t('paywall.features.unlimited') },
  { label: t('paywall.features.translations'), free: String(QUERY_TIERS.freeTranslationsPerDay), premium: t('paywall.features.unlimited') },
  { label: t('paywall.features.cameraTranslate'), free: t('paywall.features.no'), premium: t('paywall.features.yes') },
  { label: t('paywall.features.offlinePacks'), free: t('paywall.features.no'), premium: t('paywall.features.yes') },
  { label: t('paywall.features.itineraryPlanner'), free: t('paywall.features.no'), premium: t('paywall.features.yes') },
];

export default function PaywallScreen() {
  const { t } = useTranslation();
  const { getToken, userId } = useAuth();
  const [status, setStatus] = useState<PurchaseResult | null>(null);
  const [availablePackage, setAvailablePackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const setTier = useSubscriptionStore((state) => state.setTier);

  useEffect(() => {
    let active = true;
    const initRevenueCat = async () => {
      const configureResult = await configureRevenueCat(userId);
      if (!active) return;
      setStatus(configureResult);
      if (configureResult.status === 'ready') {
        const currentOfferings = await getOfferings();
        const firstPackage = currentOfferings?.availablePackages[0];
        if (active && firstPackage) {
          setAvailablePackage(firstPackage);
        }
      }
    };
    void initRevenueCat();
    return () => {
      active = false;
    };
  }, [userId]);

  const handlePurchase = async () => {
    if (!availablePackage) {
      Alert.alert(t('paywall.notAvailable'), t('paywall.noPackages'));
      return;
    }

    setIsPurchasing(true);
    try {
      const result = await purchasePackage(availablePackage);
      if (result.status === 'cancelled') return;
      if (result.status !== 'success') {
        Alert.alert(t('paywall.purchaseError'), t('paywall.noPackages'));
        return;
      }

      const token = await getToken();
      if (token) {
        const profile = await getProfile(token);
        setTier(profile.entitlement.tier);
      }
      Alert.alert(t('paywall.success'), t('paywall.success'), [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(t('paywall.purchaseError'), t('paywall.noPackages'));
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-10 pt-5">
        <View>
          <Text className="font-inter-bold text-4xl text-white">{t('paywall.title')}</Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            {t('paywall.subtitle')}
          </Text>
        </View>
        <GlassCard>
          {availablePackage ? (
            <>
              <Text className="font-inter-bold text-4xl text-white">
                {availablePackage.product.priceString}
              </Text>
              <Text className="font-inter text-zinc-300">{t('paywall.perMonth')}</Text>
            </>
          ) : (
            <ActivityIndicator color={theme.colors.primary} />
          )}
        </GlassCard>
        <GlassCard>
          <View className="gap-3">
            {getFeatures(t).map((feature) => (
              <View
                key={feature.label}
                className="grid-cols-3 flex-row items-center gap-3 rounded-lg bg-white/10 p-3"
              >
                <Text className="flex-1 font-inter-semibold text-white">{feature.label}</Text>
                <Text className="w-20 text-center font-inter text-zinc-300">{feature.free}</Text>
                <View className="w-24 flex-row items-center justify-center gap-1">
                  {feature.premium === t('paywall.features.yes') ? (
                    <Check color={theme.colors.success} size={16} />
                  ) : null}
                  {feature.premium === t('paywall.features.no') ? <X color={theme.colors.danger} size={16} /> : null}
                  <Text className="font-inter-semibold text-white">{feature.premium}</Text>
                </View>
              </View>
            ))}
          </View>
        </GlassCard>
        
        {isPurchasing ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
        ) : (
          <View className="gap-3">
            <PrimaryButton
              disabled={!availablePackage}
              label={t('paywall.subscribeNow')}
              onPress={handlePurchase}
            />
          </View>
        )}
        {status?.status === 'error' || status?.status === 'unavailable-in-expo-go' ? (
          <Text className="text-center font-inter text-sm text-zinc-400">
            {t('paywall.noPackages')}
          </Text>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
