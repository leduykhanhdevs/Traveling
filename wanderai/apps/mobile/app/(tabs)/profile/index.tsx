import { useAuth, useUser } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import {
  ChevronRight,
  CreditCard,
  FileLock2,
  FileText,
  LogOut,
  RefreshCcw,
  ShieldCheck,
} from 'lucide-react-native';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { LanguagePicker } from '../../../components/LanguagePicker';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { theme } from '../../../constants/theme';
import { useDocumentVault } from '../../../hooks/useDocumentVault';
import { getProfile } from '../../../services/profile';
import { getCurrencyRates, getWeather } from '../../../services/utilities';
import { useOfflinePhrasesStore } from '../../../stores/offlinePhrasesStore';
import { usePreferencesStore } from '../../../stores/preferencesStore';

export default function ProfileScreen(): JSX.Element {
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const preferences = usePreferencesStore();
  const phrasePacks = useOfflinePhrasesStore((state) => state.packs);
  const downloadPack = useOfflinePhrasesStore((state) => state.downloadPack);
  const vault = useDocumentVault();

  const profile = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const token = await getToken();
      return getProfile(token);
    },
  });

  const currency = useQuery({
    queryKey: ['currency', 'USD'],
    queryFn: async () => {
      const token = await getToken();
      return getCurrencyRates('USD', token);
    },
  });

  const weather = useQuery({
    queryKey: ['weather', 'Ho Chi Minh City'],
    queryFn: async () => {
      const token = await getToken();
      return getWeather('Ho Chi Minh City', token);
    },
  });

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-32 pt-5">
        <View>
          <Text className="font-inter-bold text-4xl text-white">Profile</Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            {user?.primaryEmailAddress?.emailAddress ?? 'Traveler'}
          </Text>
        </View>

        <GlassCard>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-inter-semibold text-white">Plan</Text>
              <Text className="font-inter-bold text-2xl text-primary">
                {profile.data?.entitlement.tier ?? 'free'}
              </Text>
            </View>
            <Link href="/paywall" asChild>
              <PrimaryButton
                label="Upgrade"
                icon={CreditCard}
                variant="accent"
                accessibilityHint="Opens the premium subscription screen."
              />
            </Link>
          </View>
        </GlassCard>

        <GlassCard>
          <Text className="mb-3 font-inter-semibold text-white">Language</Text>
          <LanguagePicker
            value={preferences.preferredLanguage}
            onChange={preferences.setPreferredLanguage}
          />
        </GlassCard>

        <View className="flex-row gap-3">
          <GlassCard className="flex-1">
            <Text className="font-inter-semibold text-white">Weather</Text>
            <Text className="mt-2 font-inter-bold text-2xl text-white">
              {weather.data ? `${weather.data.temperatureCelsius.toFixed(0)}°C` : '--'}
            </Text>
            <Text className="font-inter text-sm text-zinc-300">
              {weather.data?.description ?? 'Loading'}
            </Text>
          </GlassCard>
          <GlassCard className="flex-1">
            <Text className="font-inter-semibold text-white">Currency</Text>
            <Text className="mt-2 font-inter-bold text-2xl text-white">
              {currency.data?.rates.VND ? currency.data.rates.VND.toFixed(0) : '--'}
            </Text>
            <Text className="font-inter text-sm text-zinc-300">VND per USD</Text>
          </GlassCard>
        </View>

        <GlassCard>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-inter-semibold text-white">Document vault</Text>
              <Text className="font-inter text-sm text-zinc-300">
                {vault.documents.length} encrypted entries
              </Text>
            </View>
            <TouchableOpacity
              accessibilityHint="Adds a new travel document to the encrypted vault."
              accessibilityLabel="Add travel document"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-lg bg-white/10"
              onPress={() => {
                void vault.addDocument('Travel document');
              }}
            >
              <FileLock2 color={theme.colors.text} size={20} />
            </TouchableOpacity>
          </View>
          {vault.documents.map((document) => (
            <Text key={document.id} className="mt-3 font-inter text-sm text-zinc-300">
              {document.label} • {new Date(document.createdAt).toLocaleDateString()}
            </Text>
          ))}
        </GlassCard>

        <GlassCard>
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="font-inter-semibold text-white">Offline packs</Text>
              <Text className="font-inter text-sm text-zinc-300">
                Vietnam pack: {phrasePacks.vn?.length ?? 0} phrases
              </Text>
            </View>
            <TouchableOpacity
              accessibilityHint="Downloads or refreshes the Vietnam offline phrase pack."
              accessibilityLabel="Refresh Vietnam offline phrase pack"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-lg bg-white/10"
              onPress={() => downloadPack('vn')}
            >
              <RefreshCcw color={theme.colors.text} size={20} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <GlassCard>
          <View className="gap-1">
            <TouchableOpacity
              accessibilityHint="Opens the Privacy Policy screen."
              accessibilityLabel="Privacy Policy"
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-lg py-2"
              onPress={() => router.push('/legal/privacy-policy' as never)}
            >
              <View className="flex-row items-center gap-3">
                <ShieldCheck color={theme.colors.text} size={20} />
                <Text className="font-inter-semibold text-white">Privacy Policy</Text>
              </View>
              <ChevronRight color={theme.colors.muted} size={18} />
            </TouchableOpacity>
            <View className="h-px bg-white/10" />
            <TouchableOpacity
              accessibilityHint="Opens the Terms of Service screen."
              accessibilityLabel="Terms of Service"
              accessibilityRole="button"
              className="flex-row items-center justify-between rounded-lg py-2"
              onPress={() => router.push('/legal/terms' as never)}
            >
              <View className="flex-row items-center gap-3">
                <FileText color={theme.colors.text} size={20} />
                <Text className="font-inter-semibold text-white">Terms of Service</Text>
              </View>
              <ChevronRight color={theme.colors.muted} size={18} />
            </TouchableOpacity>
          </View>
        </GlassCard>

        <PrimaryButton
          label="Sign out"
          icon={LogOut}
          variant="ghost"
          accessibilityHint="Signs out and returns to the login screen."
          onPress={() => {
            void signOut().then(() => router.replace('/(auth)/login'));
          }}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
