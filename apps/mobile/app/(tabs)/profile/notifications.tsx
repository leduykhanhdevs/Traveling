import { router } from 'expo-router';
import { ArrowLeft, BellRing } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { theme } from '../../../constants/theme';

export default function NotificationsScreen(): JSX.Element {
  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ gap: 16, padding: 20 }}>
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            accessibilityHint="Goes back to the profile screen."
            accessibilityLabel="Back"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={20} />
          </TouchableOpacity>
          <Text className="font-inter-bold text-3xl text-white">Notifications</Text>
        </View>

        <GlassCard>
          <View className="items-center py-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <BellRing color={theme.colors.text} size={32} />
            </View>
            <Text className="font-inter-bold text-xl text-white">Alert Preferences</Text>
            <Text className="mt-1 font-inter text-sm text-zinc-400">Configure push alerts, email digests, and flight reminders.</Text>
          </View>
        </GlassCard>

        <GlassCard>
          <View className="gap-4">
            <Text className="font-inter text-sm text-zinc-300">
              Traveling keeps you notified about flight delays, budget limits, emergency SOS alerts, and translation pack updates.
            </Text>
            <Text className="font-inter text-xs text-zinc-400">
              Configure system permission controls in your device settings to enable push notifications.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
