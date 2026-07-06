import { Sparkles, X } from 'lucide-react-native';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';
import { useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '@clerk/clerk-expo';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PremiumModal({ visible, onClose, onSuccess }: PremiumModalProps): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock purchase logic - wait a bit then resolve
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call an API to grant unlimited quota. We will hit a non-existent or mock endpoint for now.
      // In a real app we would verify a RevenueCat receipt with our backend.
      const token = await getToken();
      await apiRequest('/api/v1/profile/upgrade', {
        method: 'POST',
        token,
        body: { plan: 'premium' }
      }).catch(() => {
        // Ignoring error for mock
      });
      
      onSuccess();
    } catch (err) {
      setError('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
                  <Text className="font-inter-bold text-2xl text-white">Traveling Premium</Text>
                </View>
                <Text className="font-inter text-sm text-zinc-300 leading-5">
                  You&apos;ve hit your daily limit for AI requests. Upgrade to Premium for unlimited AI itineraries, instant translations, and priority discovery.
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close"
                className="h-8 w-8 items-center justify-center rounded-full bg-white/10"
                onPress={onClose}
              >
                <X color="#FFFFFF" size={16} />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              <View className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full bg-accent" />
                <Text className="font-inter-semibold text-white">Unlimited AI Itineraries</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full bg-accent" />
                <Text className="font-inter-semibold text-white">Unlimited Instant Translations</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <View className="h-2 w-2 rounded-full bg-accent" />
                <Text className="font-inter-semibold text-white">Ad-free Community Feed</Text>
              </View>
            </View>

            {error && (
              <Text className="text-danger font-inter-semibold text-sm">{error}</Text>
            )}

            <View className="gap-2">
              <PrimaryButton
                label={loading ? "Processing..." : "Upgrade for $4.99/mo"}
                onPress={handleUpgrade}
                disabled={loading}
              />
              <Text className="text-center font-inter text-xs text-zinc-500 mt-2">
                Cancel anytime. Subscription auto-renews.
              </Text>
            </View>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}
