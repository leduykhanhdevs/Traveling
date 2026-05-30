import { router } from 'expo-router';
import { Check, ChevronRight } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { PrimaryButton } from '../../components/PrimaryButton';

type SlideId = 'hero' | 'features' | 'style' | 'final';
type TravelStyleOption = {
  id: string;
  emoji: string;
  label: string;
};

const slides: readonly { id: SlideId }[] = [
  { id: 'hero' },
  { id: 'features' },
  { id: 'style' },
  { id: 'final' },
];

const features = [
  {
    id: 'ai-itineraries',
    emoji: '🤖',
    title: 'AI Itineraries',
    description: 'Day-by-day routes shaped around your mood, pace, and budget.',
  },
  {
    id: 'live-translation',
    emoji: '🌐',
    title: 'Live Translation',
    description: 'Speak, read, and understand local moments with less friction.',
  },
  {
    id: 'smart-discovery',
    emoji: '🗺',
    title: 'Smart Discovery',
    description: 'Find food, places, and experiences with AI-ranked confidence.',
  },
] as const;

const travelStyles: readonly TravelStyleOption[] = [
  { id: 'adventure', emoji: '🏔', label: 'Adventure' },
  { id: 'foodie', emoji: '🍜', label: 'Foodie' },
  { id: 'culture', emoji: '🏛', label: 'Culture' },
  { id: 'beach', emoji: '🏖', label: 'Beach' },
  { id: 'city', emoji: '🏙', label: 'City Explorer' },
  { id: 'eco', emoji: '🌿', label: 'Eco Travel' },
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<{ id: SlideId }>);

const navigateToLogin = (): void => {
  router.replace('/(auth)/login' as never);
};

const navigateToLegal = (screen: 'terms' | 'privacy-policy'): void => {
  router.push(`/legal/${screen}` as never);
};

const OnboardingDot = ({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: Animated.SharedValue<number>;
  width: number;
}): JSX.Element => {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
    return {
      opacity: interpolate(scrollX.value, inputRange, [0.35, 1, 0.35], 'clamp'),
      width: interpolate(scrollX.value, inputRange, [8, 24, 8], 'clamp'),
    };
  });

  return (
    <Animated.View
      accessibilityLabel={`Slide ${index + 1} indicator`}
      className="h-2 rounded-full bg-white"
      style={dotStyle}
    />
  );
};

export default function OnboardingScreen(): JSX.Element {
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<{ id: SlideId }>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<readonly string[]>(['adventure']);
  const reducedMotion = useReducedMotion();
  const scrollX = useSharedValue(0);
  const globeY = useSharedValue(0);

  useEffect(() => {
    if (reducedMotion) {
      globeY.value = 0;
      return;
    }

    globeY.value = withRepeat(
      withTiming(-16, {
        duration: 1800,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [globeY, reducedMotion]);

  const globeStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: globeY.value }],
  }));

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const selectedStyleLabels = useMemo(
    () =>
      selectedStyles
        .map((styleId) => travelStyles.find((style) => style.id === styleId)?.label)
        .filter((label): label is string => Boolean(label)),
    [selectedStyles],
  );

  const toggleTravelStyle = (styleId: string): void => {
    setSelectedStyles((current) =>
      current.includes(styleId)
        ? current.filter((selectedStyleId) => selectedStyleId !== styleId)
        : [...current, styleId],
    );
  };

  const goToIndex = (index: number): void => {
    const nextIndex = Math.min(Math.max(index, 0), slides.length - 1);
    listRef.current?.scrollToIndex({ animated: !reducedMotion, index: nextIndex });
    setActiveIndex(nextIndex);
  };

  const handleMomentumEnd = (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setActiveIndex(nextIndex);
  };

  const renderHeroSlide = (): JSX.Element => (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View accessibilityLabel="Floating globe" className="mb-10" style={globeStyle}>
        <Text className="text-8xl">🌍</Text>
      </Animated.View>
      <Text
        accessibilityLabel="Discover the world with AI"
        className="text-center font-inter-bold text-[32px] leading-10 text-white"
      >
        Discover the world with AI
      </Text>
      <Text
        accessibilityLabel="WanderAI plans your perfect trip in seconds"
        className="mt-4 text-center font-inter text-lg leading-7 text-white/75"
      >
        WanderAI plans your perfect trip in seconds
      </Text>
    </View>
  );

  const renderFeaturesSlide = (): JSX.Element => (
    <View className="flex-1 justify-center px-6">
      <Text accessibilityLabel="Everything you need on the road" className="mb-7 font-inter-bold text-3xl text-white">
        Everything you need on the road
      </Text>
      <View className="gap-4">
        {features.map((feature, index) => (
          <Animated.View
            key={feature.id}
            entering={reducedMotion ? undefined : FadeInUp.delay(index * 150).springify()}
            className="rounded-2xl border border-white/10 bg-white/10 p-5"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Text accessibilityLabel={`${feature.title} icon`} className="text-3xl">
                  {feature.emoji}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="font-inter-bold text-xl text-white">{feature.title}</Text>
                <Text className="mt-1 font-inter text-sm leading-5 text-white/70">
                  {feature.description}
                </Text>
              </View>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );

  const renderTravelStyleSlide = (): JSX.Element => (
    <View className="flex-1 justify-center px-6">
      <Text
        accessibilityLabel="What kind of traveler are you?"
        className="mb-3 text-center font-inter-bold text-3xl text-white"
      >
        What kind of traveler are you?
      </Text>
      <Text className="mb-7 text-center font-inter text-base text-white/70">
        Pick one or more. WanderAI will tune the trip mood around you.
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {travelStyles.map((style) => {
          const selected = selectedStyles.includes(style.id);
          return (
            <TouchableOpacity
              key={style.id}
              accessibilityHint={`Toggles ${style.label} as a travel preference.`}
              accessibilityLabel={`${style.label} travel style`}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={`min-h-28 w-[47%] justify-between rounded-2xl border p-4 ${
                selected ? 'border-primary bg-primary' : 'border-white/10 bg-white/10'
              }`}
              onPress={() => toggleTravelStyle(style.id)}
            >
              <View className="flex-row items-start justify-between">
                <Text className="text-3xl">{style.emoji}</Text>
                {selected ? (
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-white">
                    <Check color="#6C63FF" size={16} />
                  </View>
                ) : null}
              </View>
              <Text className="font-inter-bold text-base text-white">{style.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedStyles.length === 0 ? (
        <Text accessibilityLabel="Select at least one travel style to continue" className="mt-4 text-center font-inter-semibold text-accent">
          Select at least one travel style to continue.
        </Text>
      ) : null}
    </View>
  );

  const renderFinalSlide = (): JSX.Element => (
    <View className="flex-1 justify-center px-6">
      <Text accessibilityLabel="Almost there!" className="text-center font-inter-bold text-[32px] text-white">
        Almost there!
      </Text>
      <Text className="mt-3 text-center font-inter text-base leading-6 text-white/70">
        Your first recommendations will start with these travel signals.
      </Text>
      <View className="my-8 flex-row flex-wrap justify-center gap-2">
        {selectedStyleLabels.map((label) => (
          <View key={label} className="rounded-full bg-white/10 px-4 py-2">
            <Text accessibilityLabel={`${label} selected`} className="font-inter-semibold text-sm text-white">
              {label}
            </Text>
          </View>
        ))}
      </View>
      <Text className="mb-5 px-2 text-center font-inter text-xs leading-5 text-white/60">
        By continuing you agree to our{' '}
        <Text
          accessibilityHint="Opens the Terms of Service screen."
          accessibilityLabel="Terms of Service"
          className="font-inter-semibold text-white"
          onPress={() => navigateToLegal('terms')}
        >
          Terms of Service
        </Text>{' '}
        and{' '}
        <Text
          accessibilityHint="Opens the Privacy Policy screen."
          accessibilityLabel="Privacy Policy"
          className="font-inter-semibold text-white"
          onPress={() => navigateToLegal('privacy-policy')}
        >
          Privacy Policy
        </Text>
        .
      </Text>
      <PrimaryButton
        accessibilityHint="Continues to the WanderAI sign in screen."
        disabled={selectedStyles.length === 0}
        label="Get Started"
        onPress={navigateToLogin}
      />
      <TouchableOpacity
        accessibilityHint="Navigates to the login screen."
        accessibilityLabel="Already have an account? Sign in"
        accessibilityRole="button"
        className="mt-5 items-center"
        onPress={navigateToLogin}
      >
        <Text className="font-inter-semibold text-sm text-white/80">Already have an account? Sign in</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSlide = ({ item }: { item: { id: SlideId } }): JSX.Element => (
    <View className="flex-1" style={{ width }}>
      {item.id === 'hero' ? renderHeroSlide() : null}
      {item.id === 'features' ? renderFeaturesSlide() : null}
      {item.id === 'style' ? renderTravelStyleSlide() : null}
      {item.id === 'final' ? renderFinalSlide() : null}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="absolute inset-0">
        <Svg height="100%" preserveAspectRatio="none" width="100%">
          <Defs>
            <LinearGradient id="onboardingGradient" x1="0" x2="1" y1="0" y2="1">
              <Stop offset="0" stopColor="#0a1628" />
              <Stop offset="1" stopColor="#1a3a5c" />
            </LinearGradient>
          </Defs>
          <Rect fill="url(#onboardingGradient)" height="100%" width="100%" x="0" y="0" />
        </Svg>
      </View>

      <TouchableOpacity
        accessibilityHint="Skips onboarding and opens the login screen."
        accessibilityLabel="Skip onboarding"
        accessibilityRole="button"
        className="absolute right-5 top-5 z-20 rounded-full bg-white/10 px-4 py-2"
        onPress={navigateToLogin}
      >
        <Text className="font-inter-semibold text-sm text-white">Skip</Text>
      </TouchableOpacity>

      <AnimatedFlatList
        ref={listRef}
        accessibilityLabel="WanderAI onboarding slides"
        bounces={false}
        data={slides}
        horizontal
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={handleMomentumEnd}
        onScroll={scrollHandler}
        pagingEnabled
        renderItem={renderSlide}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
      />

      <View className="absolute bottom-8 left-0 right-0 px-6">
        <View className="mb-5 flex-row items-center justify-center gap-2">
          {slides.map((slide, index) => (
            <OnboardingDot key={slide.id} index={index} scrollX={scrollX} width={width} />
          ))}
        </View>
        {activeIndex < slides.length - 1 ? (
          <PrimaryButton
            accessibilityHint="Moves to the next onboarding slide."
            disabled={activeIndex === 2 && selectedStyles.length === 0}
            icon={ChevronRight}
            label="Next"
            onPress={() => goToIndex(activeIndex + 1)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
