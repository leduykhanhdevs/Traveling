import { router } from 'expo-router';
import { Check, X, QrCode } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ScrollView, Text, View, Alert, ActivityIndicator, Modal, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@clerk/clerk-expo';
import { GlassCard } from '../components/GlassCard';
import { PrimaryButton } from '../components/PrimaryButton';
import { theme } from '../constants/theme';
import { configureRevenueCat, getOfferings, purchasePackage, type PurchaseResult } from '../services/revenuecat';
import { useSubscriptionStore } from '../stores/subscriptionStore';
import { createBankTransferOrder, type BankTransferOrder } from '../services/payment';
import { useTranslation } from 'react-i18next';

const getFeatures = (t: (key: string) => string) => [
  { label: t('paywall.features.aiDiscovery'), free: '20/day', premium: t('paywall.features.unlimited') },
  { label: t('paywall.features.translations'), free: '50/day', premium: t('paywall.features.unlimited') },
  { label: t('paywall.features.cameraTranslate'), free: t('paywall.features.no'), premium: t('paywall.features.yes') },
  { label: t('paywall.features.offlinePacks'), free: t('paywall.features.no'), premium: t('paywall.features.yes') },
  { label: t('paywall.features.itineraryPlanner'), free: t('paywall.features.no'), premium: t('paywall.features.yes') },
];

export default function PaywallScreen() {
  const { t } = useTranslation();
  const { getToken } = useAuth();
  const [status, setStatus] = useState<PurchaseResult | null>(null);
  const [availablePackage, setAvailablePackage] = useState<unknown>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [bankOrder, setBankOrder] = useState<BankTransferOrder | null>(null);
  const setTier = useSubscriptionStore((state) => state.setTier);

  useEffect(() => {
    const initRevenueCat = async () => {
      const configureResult = await configureRevenueCat();
      setStatus(configureResult);
      if (configureResult.status === 'ready') {
        const currentOfferings = await getOfferings();
        if (currentOfferings && currentOfferings.availablePackages.length > 0) {
          setAvailablePackage(currentOfferings.availablePackages[0]);
        }
      }
    };
    void initRevenueCat();
  }, []);

  const handlePurchase = async () => {
    if (!availablePackage) {
      if (status?.status === 'unavailable-in-expo-go') {
        setTier('premium');
        router.back();
      } else {
        Alert.alert(t('paywall.notAvailable'), t('paywall.noPackages'));
      }
      return;
    }
    
    setIsPurchasing(true);
    const result = await purchasePackage(availablePackage);
    setIsPurchasing(false);
    
    if (result.status === 'success') {
      setTier('premium');
      Alert.alert(t('paywall.success'), result.message, [{ text: 'OK', onPress: () => router.back() }]);
    } else {
      Alert.alert(t('paywall.purchaseError'), result.message);
    }
  };

  const handleBankTransfer = async () => {
    try {
      setIsPurchasing(true);
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      // For now, hardcode 'monthly' or add a toggle.
      const order = await createBankTransferOrder('monthly', token);
      setBankOrder(order);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create bank transfer order';
      Alert.alert(t('paywall.error'), message);
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
          <Text className="font-inter-bold text-4xl text-white">
            {availablePackage ? availablePackage.product.priceString : '$4.99'}
          </Text>
          <Text className="font-inter text-zinc-300">{t('paywall.perMonth')}</Text>
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
            <PrimaryButton label={t('paywall.subscribeNow')} onPress={handlePurchase} />
            <PrimaryButton 
              label={t('paywall.bankTransfer')} 
              onPress={handleBankTransfer} 
              icon={QrCode}
            />
          </View>
        )}
        {status?.status === 'error' ? <Text className="font-inter text-sm text-zinc-400 text-center">{status.message}</Text> : null}
      </ScrollView>

      <Modal visible={!!bankOrder} transparent animationType="slide">
        <View className="flex-1 justify-center bg-black/80 px-5">
          <GlassCard>
            {bankOrder ? (
              <View className="items-center gap-4 py-4">
                <Text className="font-inter-bold text-2xl text-white">{t('paywall.bankModal.title')}</Text>
                <Image source={{ uri: bankOrder.qrUrl }} className="h-64 w-64 rounded-xl bg-white" />
                <Text className="font-inter text-zinc-300 text-center">
                  {t('paywall.bankModal.instruction')}
                </Text>
                <View className="w-full bg-white/10 rounded-lg p-4 mt-2 gap-2">
                  <Text className="font-inter text-white">{t('paywall.bankModal.bank')}: {bankOrder.bankName}</Text>
                  <Text className="font-inter text-white">{t('paywall.bankModal.account')}: {bankOrder.accountNumber}</Text>
                  <Text className="font-inter text-white">{t('paywall.bankModal.name')}: {bankOrder.accountName}</Text>
                  <Text className="font-inter text-white">{t('paywall.bankModal.amount')}: {bankOrder.amount} VND</Text>
                  <Text className="font-inter-bold text-accent">{t('paywall.bankModal.content')}: {bankOrder.transferContent}</Text>
                </View>
                <Text className="font-inter text-xs text-zinc-400 text-center">
                  {t('paywall.bankModal.note')}
                </Text>
                <TouchableOpacity onPress={() => setBankOrder(null)} className="mt-4 p-3 rounded-full bg-white/10 w-full items-center">
                  <Text className="font-inter-semibold text-white">{t('paywall.bankModal.close')}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </GlassCard>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
