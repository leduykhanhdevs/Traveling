import { router } from 'expo-router';
import { ArrowLeft, User } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { theme } from '../../../constants/theme';

export default function AccountScreen(): JSX.Element {
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
          <Text className="font-inter-bold text-3xl text-white">Account Settings</Text>
        </View>

        <GlassCard>
          <View className="items-center py-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <User color={theme.colors.text} size={32} />
            </View>
            <Text className="font-inter-bold text-xl text-white">Account Details</Text>
            <Text className="mt-1 font-inter text-sm text-zinc-400">Manage login credentials and secure store keys.</Text>
          </View>
        </GlassCard>

        <GlassCard>
          <View className="gap-4">
            <View className="h-px bg-white/10" />
            <Text className="font-inter text-sm text-zinc-300">
              Authentication is handled securely via Clerk. All details, active login sessions, and passwords can be modified directly on your Clerk dashboard or via OAuth provider settings.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
