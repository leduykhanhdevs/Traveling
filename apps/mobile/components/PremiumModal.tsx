import { Sparkles, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PremiumModal({ visible, onClose }: PremiumModalProps): JSX.Element {
  const { t } = useTranslation();

  const openPaywall = (): void => {
    onClose();
    router.push('/paywall');
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/70 px-5 pb-8">
        <GlassCard accessibilityViewIsModal>
          <View className="gap-6 pt-2">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <View className="flex-row items-center gap-2 mb-2">
                  <Sparkles color="#F59E0B" size={24} />
                  <Text className="font-inter-bold text-2xl text-white">{t('paywall.title')}</Text>
                </View>
                <Text className="font-inter text-sm text-zinc-300 leading-5">
                  {t('paywall.subtitle')}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('sos.close')}
                className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
                onPress={onClose}
              >
                <X color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full bg-accent" />
                <Text className="font-inter-semibold text-white">
                  {t('paywall.features.itineraryPlanner')}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full bg-accent" />
                <Text className="font-inter-semibold text-white">
                  {t('paywall.features.translations')}
                </Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full bg-accent" />
                <Text className="font-inter-semibold text-white">
                  {t('paywall.features.aiDiscovery')}
                </Text>
              </View>
            </View>

            <View className="gap-2">
              <PrimaryButton
                label={t('paywall.subscribeNow')}
                onPress={openPaywall}
              />
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}
