import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';
import type { DiscoverResponse, PriceRange } from '@wanderai/shared';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Filter, MapPin, Mic, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { ResultCard } from '../../../components/ResultCard';
import { SOSButton } from '../../../components/SOSButton';
import { Skeleton } from '../../../components/Skeleton';
import { TextField } from '../../../components/TextField';
import { queryTypes } from '../../../constants/options';
import { theme } from '../../../constants/theme';
import { useCurrentLocation } from '../../../hooks/useCurrentLocation';
import { useHapticAction } from '../../../hooks/useHapticAction';
import { useVoiceRecorder } from '../../../hooks/useVoiceRecorder';
import { discoverPlaces, savePlace } from '../../../services/discovery';
import { transcribeAudio } from '../../../services/translation';
import { trackEvent } from '../../../services/analytics';
import { usePreferencesStore } from '../../../stores/preferencesStore';
import { useSubscriptionStore } from '../../../stores/subscriptionStore';

const priceOptions: readonly PriceRange[] = [1, 2, 3, 4];

export default function DiscoverScreen(): JSX.Element {
  const { getToken, userId } = useAuth();
  const [query, setQuery] = useState('lẩu bò');
  const [selectedPrompt, setSelectedPrompt] = useState<(typeof queryTypes)[number]>('What to eat');
  const [radiusMeters, setRadiusMeters] = useState(2000);
  const [priceRange, setPriceRange] = useState<readonly PriceRange[]>([]);
  const [openNow, setOpenNow] = useState(true);
  const [response, setResponse] = useState<DiscoverResponse | null>(null);
  const preferences = usePreferencesStore();
  const incrementAiQuery = useSubscriptionStore((state) => state.incrementAiQuery);
  const haptic = useHapticAction();
  const {
    location,
    loading: locating,
    error: locationError,
    refreshLocation,
  } = useCurrentLocation();
  const recorder = useVoiceRecorder();

  useEffect(() => {
    void refreshLocation();
  }, [refreshLocation]);

  const mutation = useMutation({
    mutationFn: async (surpriseMe: boolean) => {
      const token = await getToken();
      const coords = location ?? (await refreshLocation()) ?? { lat: 10.7769, lng: 106.7009 };
      return discoverPlaces(
        {
          query: `${selectedPrompt}: ${query}`,
          lat: coords.lat,
          lng: coords.lng,
          filters: {
            radiusMeters,
            priceRange,
            dietaryRestrictions: preferences.dietaryRestrictions,
            openNow,
          },
          userId: userId ?? undefined,
          surpriseMe,
        },
        token,
      );
    },
    onSuccess: (data) => {
      setResponse(data);
      incrementAiQuery();
      void trackEvent('discover_search', {
        query,
        resultCount: data.places.length,
        radiusUsedMeters: data.radiusUsedMeters,
      });
    },
  });

  const activeLocationText = useMemo(() => {
    if (locating) {
      return 'Locating...';
    }
    if (location) {
      return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
    }
    return locationError ?? 'Ho Chi Minh City fallback';
  }, [locating, location, locationError]);

  const togglePrice = (price: PriceRange): void => {
    setPriceRange((current) =>
      current.includes(price) ? current.filter((value) => value !== price) : [...current, price],
    );
  };

  const startVoiceSearch = async (): Promise<void> => {
    await haptic();
    await recorder.startRecording();
  };

  const stopVoiceSearch = async (): Promise<void> => {
    await haptic();
    const audio = await recorder.stopRecording();
    if (!audio) {
      return;
    }
    try {
      const token = await getToken();
      const transcription = await transcribeAudio(audio.base64, 'vi-VN', token);
      setQuery(transcription.transcript);
    } catch {
      // The visible recorder error covers microphone issues; API errors keep the previous query.
    }
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="pb-32 pt-5">
        <View className="mb-5">
          <Text className="font-inter-bold text-4xl text-white">Discover</Text>
          <View className="mt-2 flex-row items-center gap-2">
            <MapPin size={16} color={theme.colors.muted} />
            <Text className="font-inter text-sm text-zinc-300">{activeLocationText}</Text>
          </View>
        </View>

        <GlassCard className="mb-4">
          <View className="gap-3">
            <View className="flex-row gap-2">
              {queryTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  accessibilityHint={`Sets the discovery query type to ${type}.`}
                  accessibilityLabel={`${type} discovery type`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedPrompt === type }}
                  className={`flex-1 rounded-lg px-2 py-2 ${
                    selectedPrompt === type ? 'bg-primary' : 'bg-white/10'
                  }`}
                  onPress={() => setSelectedPrompt(type)}
                >
                  <Text className="text-center font-inter-semibold text-xs text-white">{type}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2">
              <TextField
                className="flex-1"
                value={query}
                onChangeText={setQuery}
                placeholder="Search food, places, experiences"
              />
              <TouchableOpacity
                accessibilityHint="Hold to record a voice search, release to transcribe it."
                accessibilityLabel="Voice search microphone"
                accessibilityRole="button"
                accessibilityState={{ selected: recorder.recording }}
                className={`h-12 w-12 items-center justify-center rounded-lg ${
                  recorder.recording ? 'bg-accent' : 'bg-white/10'
                }`}
                onPressIn={() => {
                  void startVoiceSearch();
                }}
                onPressOut={() => {
                  void stopVoiceSearch();
                }}
              >
                <Mic size={20} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <View className="rounded-lg bg-white/10 p-3">
              <View className="mb-3 flex-row items-center gap-2">
                <Filter size={16} color={theme.colors.text} />
                <Text className="font-inter-semibold text-white">Filters</Text>
              </View>
              <View className="mb-3 flex-row gap-2">
                {[500, 2000, 5000].map((radius) => (
                  <TouchableOpacity
                    key={radius}
                    accessibilityHint={`Sets the search radius to ${
                      radius >= 1000 ? `${radius / 1000} kilometers` : `${radius} meters`
                    }.`}
                    accessibilityLabel={`Radius ${
                      radius >= 1000 ? `${radius / 1000} kilometers` : `${radius} meters`
                    }`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: radiusMeters === radius }}
                    className={`flex-1 rounded-lg px-2 py-2 ${radiusMeters === radius ? 'bg-primary' : 'bg-white/10'}`}
                    onPress={() => setRadiusMeters(radius)}
                  >
                    <Text className="text-center font-inter text-xs text-white">
                      {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="flex-row items-center gap-2">
                {priceOptions.map((price) => (
                  <TouchableOpacity
                    key={price}
                    accessibilityHint={`Toggles price level ${price}.`}
                    accessibilityLabel={`Price level ${price}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: priceRange.includes(price) }}
                    className={`rounded-lg px-3 py-2 ${priceRange.includes(price) ? 'bg-accent' : 'bg-white/10'}`}
                    onPress={() => togglePrice(price)}
                  >
                    <Text className="font-inter-semibold text-white">{'$'.repeat(price)}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  accessibilityHint="Toggles whether results must be open now."
                  accessibilityLabel="Open now filter"
                  accessibilityRole="switch"
                  accessibilityState={{ checked: openNow }}
                  className={`ml-auto rounded-lg px-3 py-2 ${openNow ? 'bg-success' : 'bg-white/10'}`}
                  onPress={() => setOpenNow((value) => !value)}
                >
                  <Text className="font-inter-semibold text-white">Open now</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View className="flex-row gap-2">
              <PrimaryButton
                label="Search"
                className="flex-1"
                loading={mutation.isPending}
                accessibilityHint="Searches nearby places using the current filters."
                onPress={() => {
                  void haptic();
                  mutation.mutate(false);
                }}
              />
              <PrimaryButton
                label="Surprise"
                icon={Sparkles}
                variant="accent"
                className="flex-1"
                loading={mutation.isPending}
                accessibilityHint="Finds a surprise recommendation using the current filters."
                onPress={() => {
                  void haptic();
                  mutation.mutate(true);
                }}
              />
            </View>
          </View>
        </GlassCard>

        {mutation.isPending ? (
          <View className="gap-4">
            <Skeleton className="h-52" />
            <Skeleton className="h-52" />
          </View>
        ) : null}

        {mutation.error ? (
          <GlassCard className="mb-4">
            <Text className="font-inter-semibold text-accent">{mutation.error.message}</Text>
          </GlassCard>
        ) : null}

        {response ? (
          <View>
            <Text className="mb-3 font-inter-semibold text-zinc-300">
              {response.places.length} ranked results • radius {response.radiusUsedMeters}m
            </Text>
            {response.places.map((place) => (
              <ResultCard
                key={place.id}
                place={place}
                onOpen={() => router.push(`/discover/${place.googlePlaceId}`)}
                onNavigate={() => {
                  const url = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
                  void Linking.openURL(url);
                }}
                onSave={() => {
                  void (async () => {
                    const token = await getToken();
                    await savePlace(
                      {
                        placeId: place.googlePlaceId,
                        name: place.name,
                        address: place.address,
                        lat: place.coordinates.lat,
                        lng: place.coordinates.lng,
                      },
                      token,
                    );
                  })();
                }}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <SOSButton />
    </SafeAreaView>
  );
}
