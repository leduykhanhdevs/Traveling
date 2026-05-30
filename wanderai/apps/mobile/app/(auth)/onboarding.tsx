import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';
import type { DietaryRestriction, LanguageCode, TravelStyle } from '@wanderai/shared';
import { router } from 'expo-router';
import { Check, Minus, Plus } from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../components/GlassCard';
import { LanguagePicker } from '../../components/LanguagePicker';
import { PrimaryButton } from '../../components/PrimaryButton';
import { dietaryOptions, travelStyles } from '../../constants/options';
import { theme } from '../../constants/theme';
import { updateProfile } from '../../services/profile';
import { usePreferencesStore } from '../../stores/preferencesStore';

const TasteStepper = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}): JSX.Element => (
  <View className="flex-row items-center justify-between rounded-lg bg-white/10 p-3">
    <Text className="font-inter-semibold text-white">{label}</Text>
    <View className="flex-row items-center gap-3">
      <TouchableOpacity onPress={() => onChange(Math.max(1, value - 1))}>
        <Minus color={theme.colors.text} size={18} />
      </TouchableOpacity>
      <Text className="w-8 text-center font-inter-bold text-white">{value}</Text>
      <TouchableOpacity onPress={() => onChange(Math.min(5, value + 1))}>
        <Plus color={theme.colors.text} size={18} />
      </TouchableOpacity>
    </View>
  </View>
);

export default function OnboardingScreen(): JSX.Element {
  const { getToken } = useAuth();
  const { user } = useUser();
  const preferences = usePreferencesStore();
  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return updateProfile(
        {
          email: user?.primaryEmailAddress?.emailAddress ?? 'traveler@wanderai.local',
          preferredLanguage: preferences.preferredLanguage,
          dietaryRestrictions: preferences.dietaryRestrictions,
          travelStyle: preferences.travelStyle,
          spicyPreference: preferences.spicyPreference,
          sweetPreference: preferences.sweetPreference,
          savoryPreference: preferences.savoryPreference,
        },
        token,
      );
    },
    onSuccess: () => {
      preferences.completeOnboarding();
      router.replace('/(tabs)/discover');
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-5 pb-10 pt-6">
        <View>
          <Text className="font-inter-bold text-4xl text-white">Tune your trip</Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            Your defaults shape recommendations, translations, and offline packs.
          </Text>
        </View>
        <GlassCard>
          <Text className="mb-3 font-inter-semibold text-white">Preferred language</Text>
          <LanguagePicker
            value={preferences.preferredLanguage}
            onChange={(language: LanguageCode) => preferences.setPreferredLanguage(language)}
          />
        </GlassCard>
        <GlassCard>
          <Text className="mb-3 font-inter-semibold text-white">Dietary restrictions</Text>
          <View className="flex-row flex-wrap gap-2">
            {dietaryOptions.map((option) => {
              const selected = preferences.dietaryRestrictions.includes(option.value);
              return (
                <TouchableOpacity
                  key={option.value}
                  className={`flex-row items-center gap-2 rounded-lg border px-3 py-2 ${
                    selected ? 'border-primary bg-primary' : 'border-white/10 bg-white/10'
                  }`}
                  onPress={() =>
                    preferences.toggleDietaryRestriction(option.value as DietaryRestriction)
                  }
                >
                  {selected ? <Check color={theme.colors.text} size={14} /> : null}
                  <Text className="font-inter-semibold text-sm text-white">{option.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>
        <GlassCard>
          <Text className="mb-3 font-inter-semibold text-white">Travel style</Text>
          <View className="flex-row flex-wrap gap-2">
            {travelStyles.map((style) => (
              <TouchableOpacity
                key={style.value}
                className={`rounded-lg border px-3 py-2 ${
                  preferences.travelStyle === style.value
                    ? 'border-accent bg-accent'
                    : 'border-white/10 bg-white/10'
                }`}
                onPress={() => preferences.setTravelStyle(style.value as TravelStyle)}
              >
                <Text className="font-inter-semibold text-sm text-white">{style.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>
        <GlassCard>
          <View className="gap-3">
            <TasteStepper
              label="Spicy"
              value={preferences.spicyPreference}
              onChange={(value) => preferences.setTastePreference('spicyPreference', value)}
            />
            <TasteStepper
              label="Sweet"
              value={preferences.sweetPreference}
              onChange={(value) => preferences.setTastePreference('sweetPreference', value)}
            />
            <TasteStepper
              label="Savory"
              value={preferences.savoryPreference}
              onChange={(value) => preferences.setTastePreference('savoryPreference', value)}
            />
          </View>
        </GlassCard>
        <PrimaryButton
          label="Start exploring"
          loading={mutation.isPending}
          onPress={() => mutation.mutate()}
        />
        <Text className="px-2 text-center font-inter text-xs text-zinc-400">
          By continuing you agree to our{' '}
          <Text
            className="font-inter-semibold text-primary"
            onPress={() => router.push('/legal/terms' as never)}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            className="font-inter-semibold text-primary"
            onPress={() => router.push('/legal/privacy-policy' as never)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
