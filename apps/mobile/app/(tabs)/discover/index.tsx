import type { RankedPlace, DiscoverRequest } from '@traveling/shared';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { Bookmark, Compass, List, Map, MapPin, Search, Sparkles } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { GlassCard } from '../../../components/GlassCard';
import { PlaceMap } from '../../../components/PlaceMap';
import { ResultCard } from '../../../components/ResultCard';
import { Skeleton } from '../../../components/Skeleton';
import { SOSButton } from '../../../components/SOSButton';
import { theme } from '../../../constants/theme';
import { useCurrentLocation } from '../../../hooks/useCurrentLocation';
import { useHapticAction } from '../../../hooks/useHapticAction';

const categories = ['All', 'Beaches', 'Mountains', 'Culture', 'Food', 'Adventure', 'Wellness'] as const;
type DiscoverCategory = (typeof categories)[number];
type ViewMode = 'list' | 'map';

const categoryChipWidth = 112;
const categoryChipGap = 8;

const demoPlaces = [
  {
    id: 'demo-ben-thanh-eats',
    googlePlaceId: 'ben-thanh-eats',
    name: 'Ben Thanh Night Bites',
    address: 'Le Loi, District 1, Ho Chi Minh City',
    coordinates: { lat: 10.7721, lng: 106.6983 },
    distanceMeters: 420,
    priceLevel: 2,
    cuisineTags: ['Street food', 'Vietnamese', 'Late night'],
    openNow: true,
    topReviewSnippet: 'Tiny stalls, huge flavor, and the grilled beef skewers are worth the queue.',
    score: {
      googleRatingScore: 4.7,
      reviewVolumeScore: 4.5,
      socialProofScore: 4.8,
      compositeScore: 4.7,
    },
    reviewSignals: [
      { source: 'google', rating: 4.7, reviewCount: 2410 },
      { source: 'tiktok', engagementCount: 182000 },
    ],
    aiSummary: 'A vivid first-night food crawl with strong local signals and easy walking routes.',
  },
  {
    id: 'demo-secret-cafe',
    googlePlaceId: 'secret-cafe-saigon',
    name: 'Hidden Garden Coffee',
    address: 'Nguyen Hue, District 1, Ho Chi Minh City',
    coordinates: { lat: 10.7749, lng: 106.7041 },
    distanceMeters: 680,
    priceLevel: 2,
    cuisineTags: ['Cafe', 'Rooftop', 'Quiet'],
    openNow: true,
    topReviewSnippet: 'A calm rooftop pause above the city with excellent coconut coffee.',
    score: {
      googleRatingScore: 4.6,
      reviewVolumeScore: 4.1,
      socialProofScore: 4.5,
      compositeScore: 4.4,
    },
    reviewSignals: [
      { source: 'google', rating: 4.6, reviewCount: 890 },
      { source: 'facebook', reviewCount: 320 },
    ],
    aiSummary: 'Best for a slow recharge between sightseeing stops, especially before sunset.',
  },
  {
    id: 'demo-river-walk',
    googlePlaceId: 'saigon-river-walk',
    name: 'Saigon River Walk',
    address: 'Bach Dang Wharf, District 1, Ho Chi Minh City',
    coordinates: { lat: 10.7735, lng: 106.7068 },
    distanceMeters: 920,
    priceLevel: 0,
    cuisineTags: ['Scenic', 'Walk', 'Sunset'],
    openNow: true,
    topReviewSnippet: 'The skyline views are best just after golden hour when the lights turn on.',
    score: {
      googleRatingScore: 4.5,
      reviewVolumeScore: 4.2,
      socialProofScore: 4.4,
      compositeScore: 4.4,
    },
    reviewSignals: [
      { source: 'google', rating: 4.5, reviewCount: 1520 },
      { source: 'tiktok', engagementCount: 96000 },
    ],
    aiSummary: 'A low-effort, high-reward route for photos, river breeze, and skyline views.',
  },
  {
    id: 'demo-bun-bo',
    googlePlaceId: 'bun-bo-local-favorite',
    name: 'Local Bun Bo Corner',
    address: 'Vo Van Tan, District 3, Ho Chi Minh City',
    coordinates: { lat: 10.7798, lng: 106.6922 },
    distanceMeters: 1200,
    priceLevel: 1,
    cuisineTags: ['Noodles', 'Spicy', 'Hidden gem'],
    openNow: true,
    topReviewSnippet: 'Broth is deep, spicy, and balanced without feeling touristy.',
    score: {
      googleRatingScore: 4.8,
      reviewVolumeScore: 3.9,
      socialProofScore: 4.2,
      compositeScore: 4.3,
    },
    reviewSignals: [
      { source: 'google', rating: 4.8, reviewCount: 530 },
      { source: 'tiktok', engagementCount: 41000 },
    ],
    aiSummary: 'A compact lunch stop with authentic flavor and unusually strong repeat reviews.',
  },
] as const satisfies readonly RankedPlace[];

const aiPicks = [
  {
    id: 'lantern-market',
    emoji: '🏮',
    title: 'Lantern Market Loop',
    subtitle: 'Culture walk - 1.4 km away',
    score: '96',
  },
  {
    id: 'island-brunch',
    emoji: '🥥',
    title: 'Island Brunch Table',
    subtitle: 'Food pick - open now',
    score: '94',
  },
  {
    id: 'spa-reset',
    emoji: '🌿',
    title: 'Rainy Day Spa Reset',
    subtitle: 'Wellness - calm crowd',
    score: '91',
  },
] as const;

const recentlyViewed = [
  { id: 'old-quarter', emoji: '🍜', title: 'Old Quarter Noodles', subtitle: 'Saved yesterday' },
  { id: 'temple-light', emoji: '🛕', title: 'Temple Light Walk', subtitle: 'Viewed 2 days ago' },
  { id: 'sunset-hill', emoji: '🌄', title: 'Sunset Hill Lookout', subtitle: 'Viewed last week' },
] as const;

const getGreeting = (): string => 'Good morning 🌅';

const openDirections = (place: RankedPlace): void => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
  void Linking.openURL(url);
};

import { useAuth } from '@clerk/clerk-expo';
import { useDiscover, useSavePlaceMutation, useViewedPlaces } from '../../../services/discovery';

export default function DiscoverScreen(): JSX.Element {
  const { userId, getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken).catch(() => {});
  }, [getToken]);

  const [activeCategory, setActiveCategory] = useState<DiscoverCategory>('All');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiQuery, setApiQuery] = useState('attractions');
  const [savedPlaceIds, setSavedPlaceIds] = useState<readonly string[]>([]);
  const { location, loading: locating, error: locationError, refreshLocation } = useCurrentLocation();
  const haptic = useHapticAction();
  const reducedMotion = useReducedMotion();
  const categoryListRef = useRef<FlatList<DiscoverCategory>>(null);
  const activeCategoryIndex = categories.indexOf(activeCategory);
  const categoryIndicatorX = useSharedValue(0);
  const waveX = useSharedValue(0);

  const savePlaceMutation = useSavePlaceMutation(token);

  useEffect(() => {
    void refreshLocation();
  }, [refreshLocation]);

  useEffect(() => {
    categoryIndicatorX.value = withTiming(activeCategoryIndex * (categoryChipWidth + categoryChipGap), {
      duration: reducedMotion ? 0 : 260,
      easing: Easing.out(Easing.cubic),
    });
    categoryListRef.current?.scrollToIndex({
      animated: !reducedMotion,
      index: activeCategoryIndex,
      viewPosition: 0.5,
    });
  }, [activeCategoryIndex, categoryIndicatorX, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) {
      waveX.value = 0;
      return;
    }
    waveX.value = withRepeat(
      withTiming(28, {
        duration: 3600,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [reducedMotion, waveX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: categoryIndicatorX.value }],
  }));

  const waveStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: waveX.value }],
  }));

  const activeLocationText = useMemo(() => {
    if (locating) {
      return 'Finding your area';
    }
    if (location) {
      return `Near ${location.lat.toFixed(3)}, ${location.lng.toFixed(3)}`;
    }
    return locationError ? 'Near Ho Chi Minh City' : 'Near Ho Chi Minh City';
  }, [locating, location, locationError]);

  const discoverParams = useMemo<DiscoverRequest | null>(() => {
    if (!location) {
      return null;
    }
    return {
      query: apiQuery,
      lat: location.lat,
      lng: location.lng,
      filters: {
        radiusMeters: 5000,
        priceRange: [],
        dietaryRestrictions: [],
        openNow: false,
      },
      userId: userId ?? undefined,
    };
  }, [apiQuery, location, userId]);

  const { data: discoverData, isLoading: isDiscoverLoading } = useDiscover(
    discoverParams,
    token,
    { enabled: !!location }
  );

  const { data: viewedHistoryData } = useViewedPlaces(token, { enabled: !!token });

  const visiblePlaces = useMemo(() => {
    if (discoverData?.places && discoverData.places.length > 0) {
      return discoverData.places;
    }
    if (activeCategory === 'All') {
      return demoPlaces;
    }
    if (activeCategory === 'Food') {
      return demoPlaces.filter((place) =>
        place.cuisineTags.some((tag) => ['Street food', 'Vietnamese', 'Noodles', 'Spicy'].includes(tag)),
      );
    }
    if (activeCategory === 'Culture') {
      return demoPlaces.filter((place) => place.cuisineTags.some((tag) => tag === 'Scenic'));
    }
    return demoPlaces;
  }, [discoverData, activeCategory]);

  const recentlyViewedPlaces = useMemo(() => {
    if (viewedHistoryData && viewedHistoryData.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return viewedHistoryData.map((item: any) => ({
        placeId: item.placeId,
        name: item.name,
        address: item.address,
        emoji: item.emoji || '📍',
      }));
    }
    return recentlyViewed.map((item) => ({
      placeId: item.id,
      name: item.title,
      address: item.subtitle,
      emoji: item.emoji,
    }));
  }, [viewedHistoryData]);

  const mapPlace = visiblePlaces[0] ?? demoPlaces[0];

  const toggleSave = (place: RankedPlace): void => {
    const isSaved = savedPlaceIds.includes(place.id);
    setSavedPlaceIds((current) =>
      isSaved ? current.filter((id) => id !== place.id) : [...current, place.id],
    );
    if (!isSaved) {
      savePlaceMutation.mutate({
        placeId: place.googlePlaceId,
        name: place.name,
        address: place.address,
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
      });
    }
  };

  const selectCategory = (category: DiscoverCategory): void => {
    void haptic();
    setActiveCategory(category);
    setApiQuery(category === 'All' ? 'attractions' : category);
  };

  const switchViewMode = (): void => {
    void haptic();
    setViewMode((current) => (current === 'list' ? 'map' : 'list'));
  };

  const isDemoLoading = isDiscoverLoading || locating;

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <View className="flex-1 bg-background">
        <FlatList
          accessibilityLabel="Discover travel recommendations"
          data={[viewMode]}
          keyExtractor={(item) => item}
          ListHeaderComponent={
            <>
              <View className="relative min-h-[330px] overflow-hidden px-5 pb-8 pt-8">
                <View className="absolute inset-0">
                  <Svg height="100%" preserveAspectRatio="none" width="100%">
                    <Defs>
                      <LinearGradient id="heroGradient" x1="0" x2="1" y1="0" y2="1">
                        <Stop offset="0" stopColor="#0f172a" />
                        <Stop offset="1" stopColor="#1e3a5f" />
                      </LinearGradient>
                    </Defs>
                    <Rect fill="url(#heroGradient)" height="100%" width="100%" x="0" y="0" />
                    <Path
                      d="M0 250 C80 210 160 285 240 242 C320 200 390 220 460 185 L460 330 L0 330 Z"
                      fill="rgba(255,255,255,0.08)"
                    />
                  </Svg>
                </View>
                {!reducedMotion ? (
                  <>
                    <Animated.View
                      pointerEvents="none"
                      className="absolute -bottom-8 left-0 h-20 w-[140%] rounded-full bg-white/10"
                      style={waveStyle}
                    />
                    <Animated.View
                      pointerEvents="none"
                      className="absolute right-12 top-16 h-3 w-3 rounded-full bg-white/40"
                      style={waveStyle}
                    />
                    <Animated.View
                      pointerEvents="none"
                      className="absolute right-28 top-28 h-2 w-2 rounded-full bg-accent/60"
                      style={waveStyle}
                    />
                  </>
                ) : null}
                <View className="relative z-10 flex-1 justify-end">
                  <View className="mb-8">
                    <View className="mb-3 flex-row items-center gap-2">
                      <Text
                        accessibilityLabel={`${getGreeting()}. ${activeLocationText}`}
                        className="font-inter-semibold text-base text-white/80"
                      >
                        {getGreeting()}
                      </Text>
                      <View className="flex-row items-center gap-1 rounded-full bg-white/10 px-3 py-1">
                        <MapPin size={14} color="rgba(255,255,255,0.8)" />
                        <Text
                          accessibilityLabel={activeLocationText}
                          className="font-inter text-xs text-white/80"
                          numberOfLines={1}
                        >
                          {activeLocationText}
                        </Text>
                      </View>
                    </View>
                    <Text
                      accessibilityLabel="Where to next?"
                      className="font-inter-bold text-[28px] leading-9 text-white"
                    >
                      Where to next?
                    </Text>
                    <Text
                      accessibilityLabel="AI-ranked places curated for your trip."
                      className="mt-2 max-w-[300px] font-inter text-sm leading-5 text-white/70"
                    >
                      AI-ranked places curated for your next few hours.
                    </Text>
                  </View>
                  <View
                    accessibilityLabel="Search destinations input container"
                    className="flex-row items-center gap-3 rounded-full bg-white px-4 py-3 shadow-lg"
                  >
                    <Search size={20} color="#0f172a" />
                    <TextInput
                      accessibilityLabel="Search destinations"
                      accessibilityHint="Enter a destination, food, attraction, or experience to explore."
                      className="min-h-10 flex-1 font-inter text-base text-slate-950"
                      onChangeText={setSearchQuery}
                      placeholder="Search destinations..."
                      placeholderTextColor="#64748b"
                      returnKeyType="search"
                      value={searchQuery}
                      onSubmitEditing={() => {
                        if (searchQuery.trim()) {
                          setApiQuery(searchQuery);
                        }
                      }}
                    />
                    <Sparkles size={18} color="#6C63FF" />
                  </View>
                </View>
              </View>

              <View className="px-5 pt-6">
                <View className="relative h-14">
                  <Animated.View
                    className="absolute bottom-0 left-0 h-1 w-20 rounded-full bg-white"
                    style={indicatorStyle}
                  />
                  <FlatList
                    ref={categoryListRef}
                    accessibilityLabel="Discover category filters"
                    data={categories}
                    getItemLayout={(_, index) => ({
                      index,
                      length: categoryChipWidth + categoryChipGap,
                      offset: (categoryChipWidth + categoryChipGap) * index,
                    })}
                    horizontal
                    keyExtractor={(item) => item}
                    renderItem={({ item }) => {
                      const selected = item === activeCategory;
                      return (
                        <TouchableOpacity
                          accessibilityHint={`Filters discover recommendations by ${item}.`}
                          accessibilityLabel={`${item} category filter`}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          className={`mr-2 h-11 w-28 items-center justify-center rounded-full ${
                            selected ? 'bg-white shadow-lg' : 'bg-white/10'
                          }`}
                          onPress={() => selectCategory(item)}
                        >
                          <Text
                            className={`font-inter-semibold text-sm ${
                              selected ? 'text-slate-950' : 'text-white/60'
                            }`}
                          >
                            {item}
                          </Text>
                        </TouchableOpacity>
                      );
                    }}
                    showsHorizontalScrollIndicator={false}
                  />
                </View>

                <View className="mt-5 flex-row items-center justify-between">
                  <View>
                    <Text
                      accessibilityLabel="Trending near you"
                      className="font-inter-bold text-2xl text-white"
                    >
                      Trending near you
                    </Text>
                    <Text
                      accessibilityLabel={`${visiblePlaces.length} premium recommendations available`}
                      className="mt-1 font-inter text-sm text-zinc-400"
                    >
                      {visiblePlaces.length} premium recommendations
                    </Text>
                  </View>
                  <TouchableOpacity
                    accessibilityHint={`Switches to ${viewMode === 'list' ? 'map' : 'list'} view.`}
                    accessibilityLabel={viewMode === 'list' ? 'Switch to map view' : 'Switch to list view'}
                    accessibilityRole="button"
                    className="flex-row items-center gap-2 rounded-full bg-white/10 px-4 py-3"
                    onPress={switchViewMode}
                  >
                    {viewMode === 'list' ? (
                      <Map size={18} color={theme.colors.text} />
                    ) : (
                      <List size={18} color={theme.colors.text} />
                    )}
                    <Text className="font-inter-semibold text-sm text-white">
                      {viewMode === 'list' ? 'Map' : 'List'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          }
          contentContainerClassName="pb-32"
          renderItem={() =>
            viewMode === 'map' ? (
              <Animated.View
                entering={reducedMotion ? undefined : FadeIn.duration(180)}
                exiting={reducedMotion ? undefined : FadeOut.duration(160)}
                className="px-5 pt-4"
              >
                <GlassCard className="overflow-hidden">
                  <View accessibilityLabel="Full screen discover map preview">
                    <PlaceMap lat={mapPlace.coordinates.lat} lng={mapPlace.coordinates.lng} title="Trending near you" />
                  </View>
                  <View className="mt-4 gap-3">
                    {visiblePlaces.map((place) => (
                      <TouchableOpacity
                        key={place.id}
                        accessibilityHint={`Opens details for ${place.name}.`}
                        accessibilityLabel={`${place.name}. ${place.distanceMeters} meters away.`}
                        accessibilityRole="button"
                        className="flex-row items-center gap-3 rounded-lg bg-white/10 p-3"
                        onPress={() => router.push(`/discover/${place.googlePlaceId}`)}
                      >
                        <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/30">
                          <MapPin size={18} color={theme.colors.text} />
                        </View>
                        <View className="flex-1">
                          <Text className="font-inter-semibold text-white" numberOfLines={1}>
                            {place.name}
                          </Text>
                          <Text className="font-inter text-xs text-zinc-400" numberOfLines={1}>
                            AI score {place.score.compositeScore} - {place.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </GlassCard>
              </Animated.View>
            ) : (
              <Animated.View
                entering={reducedMotion ? undefined : FadeIn.duration(180)}
                exiting={reducedMotion ? undefined : FadeOut.duration(160)}
                className="px-5 pt-4"
              >
                {isDemoLoading ? (
                  <View>
                    <View className="flex-row flex-wrap justify-between gap-y-4">
                      {[0, 1, 2, 3].map((item) => (
                        <Skeleton key={item} className="h-64 w-[48%]" />
                      ))}
                    </View>
                    <View className="mt-8">
                      <Skeleton className="h-8 w-44" />
                      <View className="mt-4 flex-row gap-3">
                        {[0, 1, 2].map((item) => (
                          <Skeleton key={item} className="h-36 w-56" />
                        ))}
                      </View>
                    </View>
                  </View>
                ) : (
                  <View>
                    <View className="flex-row justify-between gap-x-3">
                      <View className="flex-1">
                        {visiblePlaces
                          .filter((_, index) => index % 2 === 0)
                          .map((place) => (
                            <ResultCard
                              key={place.id}
                              place={place}
                              onNavigate={() => openDirections(place)}
                              onOpen={() => router.push(`/discover/${place.googlePlaceId}`)}
                              onSave={() => toggleSave(place)}
                            />
                          ))}
                      </View>
                      <View className="flex-1 pt-8">
                        {visiblePlaces
                          .filter((_, index) => index % 2 === 1)
                          .map((place) => (
                            <ResultCard
                              key={place.id}
                              place={place}
                              onNavigate={() => openDirections(place)}
                              onOpen={() => router.push(`/discover/${place.googlePlaceId}`)}
                              onSave={() => toggleSave(place)}
                            />
                          ))}
                      </View>
                    </View>

                    <View className="mt-6">
                      <View className="mb-3 flex-row items-center justify-between">
                        <Text accessibilityLabel="AI Recommended" className="font-inter-bold text-xl text-white">
                          AI Recommended
                        </Text>
                        <Compass size={20} color={theme.colors.muted} />
                      </View>
                      <FlatList
                        accessibilityLabel="AI recommended places"
                        data={aiPicks}
                        horizontal
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                          <GlassCard className="mr-3 w-64">
                            <View className="mb-4 flex-row items-center justify-between">
                              <View
                                accessibilityLabel={`${item.title} destination image placeholder`}
                                className="h-16 w-16 items-center justify-center rounded-lg bg-primary/30"
                              >
                                <Text className="text-3xl">{item.emoji}</Text>
                              </View>
                              <View className="rounded-full bg-accent px-3 py-1">
                                <Text className="font-inter-bold text-xs text-white">AI Pick</Text>
                              </View>
                            </View>
                            <Text className="font-inter-bold text-lg text-white" numberOfLines={1}>
                              {item.title}
                            </Text>
                            <Text className="mt-1 font-inter text-sm text-zinc-300" numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                            <Text className="mt-4 font-inter-bold text-2xl text-white">{item.score}</Text>
                          </GlassCard>
                        )}
                        showsHorizontalScrollIndicator={false}
                      />
                    </View>

                    <View className="mt-6">
                      <Text accessibilityLabel="Recently Viewed" className="mb-3 font-inter-bold text-xl text-white">
                        Recently Viewed
                      </Text>
                      <FlatList
                        accessibilityLabel="Recently viewed places"
                        data={recentlyViewedPlaces}
                        horizontal
                        keyExtractor={(item) => item.placeId}
                        renderItem={({ item }) => (
                          <TouchableOpacity
                            accessibilityHint={`Opens ${item.name}.`}
                            accessibilityLabel={`Recently viewed ${item.name}. ${item.address}.`}
                            accessibilityRole="button"
                            className="mr-3 w-56 flex-row items-center gap-3 rounded-lg bg-white/10 p-3"
                            onPress={() => router.push(`/discover/${item.placeId}`)}
                          >
                            <View
                              accessibilityLabel={`${item.name} image placeholder`}
                              className="h-12 w-12 items-center justify-center rounded-lg bg-white/10"
                            >
                              <Text className="text-2xl">{item.emoji}</Text>
                            </View>
                            <View className="flex-1">
                              <Text className="font-inter-semibold text-white" numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text className="mt-1 font-inter text-xs text-zinc-400" numberOfLines={1}>
                                {item.address}
                              </Text>
                            </View>
                          </TouchableOpacity>
                        )}
                        showsHorizontalScrollIndicator={false}
                      />
                    </View>
                  </View>
                )}
              </Animated.View>
            )
          }
        />
        {savedPlaceIds.length > 0 ? (
          <View
            accessibilityLabel={`${savedPlaceIds.length} places saved in this demo session`}
            className="absolute bottom-24 left-5 right-5 flex-row items-center gap-2 rounded-full bg-white px-4 py-3 shadow-lg"
          >
            <Bookmark size={18} color="#0f172a" />
            <Text className="font-inter-semibold text-sm text-slate-950">
              {savedPlaceIds.length} saved for later
            </Text>
          </View>
        ) : null}
      </View>
      <SOSButton />
    </SafeAreaView>
  );
}
