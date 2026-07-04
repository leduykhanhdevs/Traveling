import { router } from 'expo-router';
import { ArrowLeft, UserPen } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { theme } from '../../../constants/theme';

export default function EditProfileScreen(): JSX.Element {
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
          <Text className="font-inter-bold text-3xl text-white">Edit Profile</Text>
        </View>

        <GlassCard>
          <View className="items-center py-6">
            <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <UserPen color={theme.colors.text} size={32} />
            </View>
            <Text className="font-inter-bold text-xl text-white">Traveler Profile</Text>
            <Text className="mt-1 font-inter text-sm text-zinc-400">Update your preferred language, travel styles, and food preferences.</Text>
          </View>
        </GlassCard>

        <GlassCard>
          <View className="gap-4">
            <Text className="font-inter text-sm text-zinc-300">
              Personalized preferences such as dietary restrictions, spicy limits, and preferred travel styles shape your AI itinerary recommendation signals. You can configure them securely during onboarding or directly update them on this page in future updates.
            </Text>
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
