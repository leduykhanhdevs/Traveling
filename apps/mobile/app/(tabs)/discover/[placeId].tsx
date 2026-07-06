import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Globe, Navigation, Phone, Share2 } from 'lucide-react-native';
import { Image, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PlaceMap } from '../../../components/PlaceMap';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { Skeleton } from '../../../components/Skeleton';
import { getPlaceDetail, useTrackViewedMutation } from '../../../services/discovery';
import { createDeepLink } from '../../../utils/deeplink';
import { useEffect } from 'react';

export default function PlaceDetailScreen(): JSX.Element {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  const { getToken } = useAuth();
  const query = useQuery({
    queryKey: ['place', placeId],
    queryFn: async () => {
      const token = await getToken();
      return getPlaceDetail(placeId, token);
    },
    enabled: Boolean(placeId),
  });

  const trackViewed = useTrackViewedMutation();

  useEffect(() => {
    if (query.data && placeId) {
      getToken()
        .then(() => {
          trackViewed.mutate({
            placeId,
            name: query.data.name,
            address: query.data.address,
            lat: query.data.coordinates.lat,
            lng: query.data.coordinates.lng,
            emoji: '📍',
          });
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.data, placeId, getToken, trackViewed.mutate]);

  const sharePlace = async (): Promise<void> => {
    if (!placeId || !query.data) {
      return;
    }

    const url = createDeepLink('discover', { placeId });

    try {
      await Share.share({
        message: `${query.data.name}\n${url}`,
        title: query.data.name,
        url,
      });
    } catch {
      // The native share sheet can be cancelled or unavailable on some simulators.
    }
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-28 pt-5">
        {query.isLoading ? <Skeleton className="h-96" /> : null}
        {query.data ? (
          <View className="gap-4">
            {query.data.photoUrl ? (
              <Image
                accessibilityLabel={`${query.data.name} photo`}
                source={{ uri: query.data.photoUrl }}
                className="h-64 w-full rounded-lg bg-white/10"
              />
            ) : null}
            <View>
              <Text className="font-inter-bold text-4xl text-white">{query.data.name}</Text>
              <Text className="mt-2 font-inter text-base text-zinc-300">{query.data.address}</Text>
            </View>
            <PlaceMap
              lat={query.data.coordinates.lat}
              lng={query.data.coordinates.lng}
              title={query.data.name}
            />
            <View className="flex-row gap-2">
              {query.data.phone ? (
                <PrimaryButton
                  label="Call"
                  icon={Phone}
                  className="flex-1"
                  accessibilityHint={`Calls ${query.data.name}.`}
                  onPress={() => {
                    void Linking.openURL(`tel:${query.data.phone ?? ''}`);
                  }}
                />
              ) : null}
              {query.data.website ? (
                <PrimaryButton
                  label="Website"
                  icon={Globe}
                  variant="ghost"
                  className="flex-1"
                  accessibilityHint={`Opens the website for ${query.data.name}.`}
                  onPress={() => {
                    void Linking.openURL(query.data?.website ?? '');
                  }}
                />
              ) : null}
              <PrimaryButton
                label="Navigate"
                icon={Navigation}
                variant="accent"
                className="flex-1"
                accessibilityHint={`Opens map directions to ${query.data.name}.`}
                onPress={() => {
                  void Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query.data.name)}`,
                  );
                }}
              />
            </View>
            <PrimaryButton
              label="Share"
              icon={Share2}
              variant="ghost"
              accessibilityHint={`Shares a deep link to ${query.data.name}.`}
              onPress={() => {
                void sharePlace();
              }}
            />
            <GlassCard>
              <Text className="mb-3 font-inter-bold text-xl text-white">Google reviews</Text>
              <View className="gap-3">
                {query.data.reviews.slice(0, 4).map((review) => (
                  <View
                    key={`${review.authorName}-${review.timestamp}`}
                    className="rounded-lg bg-white/10 p-3"
                  >
                    <Text className="font-inter-semibold text-white">
                      {review.authorName} • {review.rating.toFixed(1)}
                    </Text>
                    <Text className="mt-1 font-inter text-sm text-zinc-300">{review.text}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
            <GlassCard>
              <Text className="mb-3 font-inter-bold text-xl text-white">Traveler reviews</Text>
              <View className="gap-3">
                {query.data.communityReviews.length === 0 ? (
                  <Text className="font-inter text-zinc-300">No community reviews yet.</Text>
                ) : null}
                {query.data.communityReviews.map((review) => (
                  <View key={review.id} className="rounded-lg bg-white/10 p-3">
                    <Text className="font-inter-semibold text-white">
                      {review.nationality} traveler • {review.rating.toFixed(1)}
                    </Text>
                    <Text className="mt-1 font-inter text-sm text-zinc-300">{review.text}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </View>
        ) : null}
        {query.error ? (
          <GlassCard>
            <Text className="font-inter-semibold text-accent">{query.error.message}</Text>
          </GlassCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
