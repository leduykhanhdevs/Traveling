import { useAuth, useUser } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import {
  Bell,
  ChevronRight,
  CreditCard,
  FileText,
  LogOut,
  Pencil,
  ShieldCheck,
  UserRound,
} from 'lucide-react-native';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BadgeCard } from '../../../components/BadgeCard';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { StatCard } from '../../../components/StatCard';
import { theme } from '../../../constants/theme';
import { useSubscriptionStore } from '../../../stores/subscriptionStore';
import { useState, useEffect, useMemo } from 'react';
import { useProfileStats } from '../../../services/profile';
import { useItinerariesList } from '../../../services/itinerary';


type SettingRow = {
  id: string;
  label: string;
  hint: string;
  icon: typeof UserRound;
  badge?: string;
  danger?: boolean;
  onPress: () => void;
};

const getInitials = (name: string, email?: string): string => {
  const source = name.trim() || email?.split('@')[0] || 'Traveler';
  const parts = source.split(/\s+/).filter(Boolean);
  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  return initials || 'TR';
};

const getHandle = (username: string | null | undefined, email?: string): string => {
  if (username) {
    return `@${username}`;
  }
  const emailName = email?.split('@')[0];
  return `@${emailName || 'wanderer'}`;
};

export default function ProfileScreen(): JSX.Element {
  const { signOut, getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken).catch(() => {});
  }, [getToken]);

  const { data: stats } = useProfileStats(token, { enabled: !!token });
  const { data: itineraries } = useItinerariesList(token, { enabled: !!token });

  const travelerStats = useMemo(() => [
    { label: 'Countries visited', value: stats?.countriesVisited ?? 1, emoji: '🌍' },
    { label: 'Trips planned', value: stats?.tripsPlanned ?? 0, emoji: '✈️' },
    { label: 'Places saved', value: stats?.placesSaved ?? 0, emoji: '📍' },
  ], [stats]);

  const recentTrips = useMemo(() => {
    if (itineraries && itineraries.length > 0) {
      return itineraries.slice(0, 3).map((it, idx) => ({
        id: it.id,
        destination: it.destination,
        dates: `Day 1 - Day ${it.days}`,
        colorClass: idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-accent' : 'bg-teal-500',
      }));
    }
    return [
      {
        id: 'trip-saigon',
        destination: 'Ho Chi Minh City',
        dates: 'May 25 - May 28',
        colorClass: 'bg-primary',
      },
    ];
  }, [itineraries]);

  const badges = useMemo(() => [
    {
      id: 'first-itinerary',
      icon: '🗺',
      name: 'First Itinerary',
      description: 'Built your first AI-powered trip plan.',
      earned: (stats?.tripsPlanned ?? 0) > 0,
    },
    {
      id: 'world-explorer',
      icon: '🌏',
      name: 'World Explorer',
      description: 'Saved places across multiple countries.',
      earned: (stats?.countriesVisited ?? 0) > 1,
    },
    {
      id: 'foodie',
      icon: '🍜',
      name: 'Foodie',
      description: 'Found local food gems with Traveling.',
      earned: (stats?.placesSaved ?? 0) > 0,
    },
    {
      id: 'mountain-lover',
      icon: '🏔',
      name: 'Mountain Lover',
      description: 'Planned high-altitude adventures.',
      earned: false,
    },
    {
      id: 'solo-traveler',
      icon: '🔒',
      name: 'Solo Traveler',
      description: 'Unlock after your first solo route.',
      earned: (stats?.tripsPlanned ?? 0) >= 3,
    },
  ], [stats]);

  const travelerTitle = useMemo(() => {
    if (!stats) return 'Adventure Seeker';
    if (stats.countriesVisited > 2) return 'World Explorer';
    if (stats.tripsPlanned > 0) return 'Adventure Seeker';
    if (stats.placesSaved > 0) return 'Local Guide';
    return 'Travel Planner';
  }, [stats]);

  const { user } = useUser();
  const tier = useSubscriptionStore((state) => state.tier);
  const isPro = tier === 'premium';
  const displayName = user?.fullName ?? user?.username ?? 'Traveling Traveler';
  const email = user?.primaryEmailAddress?.emailAddress;
  const handle = getHandle(user?.username, email);
  const initials = getInitials(displayName, email);

  const settings: readonly SettingRow[] = [
    {
      id: 'account',
      label: 'Account',
      hint: 'Opens account settings.',
      icon: UserRound,
      onPress: () => router.push('/(tabs)/profile/account' as never),
    },
    {
      id: 'notifications',
      label: 'Notifications',
      hint: 'Opens notification preferences.',
      icon: Bell,
      onPress: () => router.push('/(tabs)/profile/notifications' as never),
    },
    {
      id: 'subscription',
      label: 'Subscription',
      hint: 'Opens the subscription and paywall screen.',
      icon: CreditCard,
      badge: isPro ? 'PRO' : undefined,
      onPress: () => router.push('/paywall' as never),
    },
    {
      id: 'privacy',
      label: 'Privacy Policy',
      hint: 'Opens the Privacy Policy screen.',
      icon: ShieldCheck,
      onPress: () => router.push('/legal/privacy-policy' as never),
    },
    {
      id: 'terms',
      label: 'Terms of Service',
      hint: 'Opens the Terms of Service screen.',
      icon: FileText,
      onPress: () => router.push('/legal/terms' as never),
    },
    {
      id: 'sign-out',
      label: 'Sign Out',
      hint: 'Signs out of Traveling.',
      icon: LogOut,
      danger: true,
      onPress: () => {
        void signOut().then(() => router.replace('/(auth)/login'));
      },
    },
  ];

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-6 pb-32 pt-5">
        <GlassCard>
          <View className="items-center">
            <View className="relative mb-4 h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-primary">
              <View className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-accent/70" />
              <View className="absolute -bottom-6 -left-4 h-20 w-20 rounded-full bg-sky-500/60" />
              {user?.imageUrl ? (
                <Image
                  accessibilityLabel={`${displayName} profile avatar`}
                  className="h-full w-full rounded-full"
                  source={{ uri: user.imageUrl }}
                />
              ) : (
                <Text
                  accessibilityLabel={`${displayName} initials avatar`}
                  className="font-inter-bold text-4xl text-white"
                >
                  {initials}
                </Text>
              )}
            </View>
            <Text accessibilityLabel={`Username ${displayName}`} className="font-inter-bold text-3xl text-white">
              {displayName}
            </Text>
            <Text accessibilityLabel={`Handle ${handle}`} className="mt-1 font-inter text-sm text-zinc-400">
              {handle}
            </Text>
            <View className="mt-4 rounded-full bg-white/10 px-4 py-2">
              <Text accessibilityLabel={`Travel Personality ${travelerTitle}`} className="font-inter-semibold text-sm text-white">
                {travelerTitle}
              </Text>
            </View>
            <PrimaryButton
              accessibilityHint="Navigates to the edit profile screen placeholder."
              className="mt-5 w-full"
              icon={Pencil}
              label="Edit Profile"
              onPress={() => router.push('/(tabs)/profile/edit' as never)}
            />
          </View>
        </GlassCard>

        <View className="flex-row gap-3">
          {travelerStats.map((stat) => (
            <StatCard key={stat.label} emoji={stat.emoji} label={stat.label} value={stat.value} />
          ))}
        </View>

        <View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text accessibilityLabel="Your Badges" className="font-inter-bold text-2xl text-white">
              Your Badges
            </Text>
            <TouchableOpacity
              accessibilityHint="Shows all traveler badges."
              accessibilityLabel="See all badges"
              accessibilityRole="button"
              className="rounded-full bg-white/10 px-3 py-2"
            >
              <Text className="font-inter-semibold text-xs text-white">See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {badges.map((badge) => (
              <BadgeCard key={badge.id} badge={badge} />
            ))}
          </ScrollView>
        </View>

        <View>
          <Text accessibilityLabel="Recent trips" className="mb-3 font-inter-bold text-2xl text-white">
            Recent Trips
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recentTrips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                accessibilityHint={`Opens trip history for ${trip.destination}.`}
                accessibilityLabel={`${trip.destination}, ${trip.dates}`}
                accessibilityRole="button"
                className="mr-3 w-48 overflow-hidden rounded-lg border border-white/10 bg-white/10"
              >
                <View className={`h-24 justify-end p-4 ${trip.colorClass}`}>
                  <Text className="font-inter-bold text-xl text-white" numberOfLines={1}>
                    {trip.destination}
                  </Text>
                </View>
                <View className="p-4">
                  <Text className="font-inter text-sm text-zinc-300">{trip.dates}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <GlassCard>
          <Text accessibilityLabel="Settings" className="mb-3 font-inter-bold text-2xl text-white">
            Settings
          </Text>
          <View className="gap-1">
            {settings.map((row, index) => {
              const Icon = row.icon;
              return (
                <View key={row.id}>
                  <TouchableOpacity
                    accessibilityHint={row.hint}
                    accessibilityLabel={row.label}
                    accessibilityRole="button"
                    className="min-h-14 flex-row items-center justify-between rounded-lg py-2"
                    onPress={row.onPress}
                  >
                    <View className="flex-row items-center gap-3">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-white/10">
                        <Icon color={row.danger ? theme.colors.accent : theme.colors.text} size={20} />
                      </View>
                      <Text
                        className={`font-inter-semibold text-base ${
                          row.danger ? 'text-accent' : 'text-white'
                        }`}
                      >
                        {row.label}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      {row.badge ? (
                        <View className="rounded-full bg-accent px-2 py-1">
                          <Text className="font-inter-bold text-[10px] text-white">{row.badge}</Text>
                        </View>
                      ) : null}
                      <ChevronRight color={theme.colors.muted} size={18} />
                    </View>
                  </TouchableOpacity>
                  {index < settings.length - 1 ? <View className="h-px bg-white/10" /> : null}
                </View>
              );
            })}
          </View>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}
