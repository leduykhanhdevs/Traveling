// router removed
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
  type SharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { PrimaryButton } from '../../components/PrimaryButton';
import { usePreferencesStore } from '../../stores/preferencesStore';
import { useTranslation } from 'react-i18next';


type SlideId = 'language' | 'hero' | 'features' | 'style' | 'final';
type TravelStyleOption = {
  id: string;
  emoji: string;
  labelKey: string;
};

const slides: readonly { id: SlideId }[] = [
  { id: 'language' },
  { id: 'hero' },
  { id: 'features' },
  { id: 'style' },
  { id: 'final' },
];

const getFeatures = (t: (key: string) => string) => [
  {
    id: 'ai-itineraries',
    emoji: '🤖',
    title: t('onboarding.features.aiItineraries'),
    description: t('onboarding.features.aiItinerariesDesc'),
  },
  {
    id: 'live-translation',
    emoji: '🌍',
    title: t('onboarding.features.liveTranslation'),
    description: t('onboarding.features.liveTranslationDesc'),
  },
  {
    id: 'smart-discovery',
    emoji: '🗺️',
    title: t('onboarding.features.smartDiscovery'),
    description: t('onboarding.features.smartDiscoveryDesc'),
  },
];

const travelStyles: readonly TravelStyleOption[] = [
  { id: 'adventure', emoji: '🏕️', labelKey: 'onboarding.styles.adventure' },
  { id: 'foodie', emoji: '🍜', labelKey: 'onboarding.styles.foodie' },
  { id: 'culture', emoji: '🏛️', labelKey: 'onboarding.styles.culture' },
  { id: 'beach', emoji: '🏖️', labelKey: 'onboarding.styles.beach' },
  { id: 'city', emoji: '🏙️', labelKey: 'onboarding.styles.city' },
  { id: 'eco', emoji: '🌿', labelKey: 'onboarding.styles.eco' },
];

const languages = [
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'es', label: 'Español' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'fr', label: 'Français' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'ja', label: '日本語' }
];

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<{ id: SlideId }>);

const OnboardingDot = ({
  index,
  scrollX,
  width,
}: {
  index: number;
  scrollX: SharedValue<number>;
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

  const { t, i18n } = useTranslation();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<{ id: SlideId }>>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedStyles, setSelectedStyles] = useState<readonly string[]>(['adventure']);
  const reducedMotion = useReducedMotion();
  const scrollX = useSharedValue(0);
  const globeY = useSharedValue(0);

  const changeLanguage = async (code: string) => {
    await i18n.changeLanguage(code);
    usePreferencesStore.getState().setAppLocale(code);
  };

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
        .map((styleId) => travelStyles.find((style) => style.id === styleId)?.labelKey)
        .filter((labelKey): labelKey is string => Boolean(labelKey))
        .map(key => t(key)),
    [selectedStyles, t],
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

  const renderLanguageSlide = (): JSX.Element => (
    <View className="flex-1 justify-center px-6">
      <Text className="mb-3 text-center font-inter-bold text-3xl text-white">
        {t('onboarding.languageTitle')}
      </Text>
      <Text className="mb-7 text-center font-inter text-base text-white/70">
        {t('onboarding.languageSubtitle')}
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {languages.map((lang) => {
          const selected = i18n.language.startsWith(lang.code);
          return (
            <TouchableOpacity
              key={lang.code}
              className={`w-[48%] rounded-xl border p-4 items-center ${
                selected ? 'border-primary bg-primary' : 'border-white/10 bg-white/10'
              }`}
              onPress={() => void changeLanguage(lang.code)}
            >
              <Text className="font-inter-semibold text-white">{lang.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderHeroSlide = (): JSX.Element => (
    <View className="flex-1 items-center justify-center px-8">
      <Animated.View accessibilityLabel="Floating globe" className="mb-10" style={globeStyle}>
        <Text className="text-8xl">🌍 </Text>
      </Animated.View>
      <Text
        className="text-center font-inter-bold text-[32px] leading-10 text-white"
      >
        {t('onboarding.heroTitle')}
      </Text>
      <Text
        className="mt-4 text-center font-inter text-lg leading-7 text-white/75"
      >
        {t('onboarding.heroSubtitle')}
      </Text>
    </View>
  );

  const renderFeaturesSlide = (): JSX.Element => (
    <View className="flex-1 justify-center px-6">
      <Text className="mb-7 font-inter-bold text-3xl text-white">
        {t('onboarding.featuresTitle')}
      </Text>
      <View className="gap-4">
        {getFeatures(t).map((feature, index) => (
          <Animated.View
            key={feature.id}
            entering={reducedMotion ? undefined : FadeInUp.delay(index * 150).springify()}
            className="rounded-2xl border border-white/10 bg-white/10 p-5"
          >
            <View className="flex-row items-center gap-4">
              <View className="h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <Text className="text-3xl">
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
        className="mb-3 text-center font-inter-bold text-3xl text-white"
      >
        {t('onboarding.styleTitle')}
      </Text>
      <Text className="mb-7 text-center font-inter text-base text-white/70">
        {t('onboarding.styleSubtitle')}
      </Text>
      <View className="flex-row flex-wrap gap-3">
        {travelStyles.map((style) => {
          const selected = selectedStyles.includes(style.id);
          return (
            <TouchableOpacity
              key={style.id}
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
              <Text className="font-inter-bold text-base text-white">{t(style.labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedStyles.length === 0 ? (
        <Text className="mt-4 text-center font-inter-semibold text-accent">
          {t('onboarding.styleRequired')}
        </Text>
      ) : null}
    </View>
  );

  const renderFinalSlide = (): JSX.Element => (
    <View className="flex-1 justify-center px-6">
      <Text className="text-center font-inter-bold text-[32px] text-white">
        {t('onboarding.finalTitle')}
      </Text>
      <Text className="mt-3 text-center font-inter text-base leading-6 text-white/70">
        {t('onboarding.finalSubtitle')}
      </Text>
      <View className="my-8 flex-row flex-wrap justify-center gap-2">
        {selectedStyleLabels.map((label) => (
          <View key={label} className="rounded-full bg-white/10 px-4 py-2">
            <Text className="font-inter-semibold text-sm text-white">
              {label}
            </Text>
          </View>
        ))}
      </View>
      <Text className="mb-5 px-2 text-center font-inter text-xs leading-5 text-white/60">
        {t('onboarding.terms1')}
        <Text
          className="font-inter-semibold text-white"
          onPress={() => navigateToLegal('terms')}
        >
          {t('onboarding.termsLink')}
        </Text>
        {t('onboarding.terms2')}
        <Text
          className="font-inter-semibold text-white"
          onPress={() => navigateToLegal('privacy-policy')}
        >
          {t('onboarding.privacyLink')}
        </Text>
        {t('onboarding.terms3')}
      </Text>
      <PrimaryButton
        disabled={selectedStyles.length === 0}
        label={t('onboarding.getStarted')}
        onPress={navigateToLogin}
      />
      <TouchableOpacity
        accessibilityRole="button"
        className="mt-5 items-center"
        onPress={navigateToLogin}
      >
        <Text className="font-inter-semibold text-sm text-white/80">{t('onboarding.signIn')}</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSlide = ({ item }: { item: { id: SlideId } }): JSX.Element => (
    <View className="flex-1" style={{ width }}>
      {item.id === 'language' ? renderLanguageSlide() : null}
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
        accessibilityRole="button"
        className="absolute right-5 top-5 z-20 rounded-full bg-white/10 px-4 py-2"
        onPress={navigateToLogin}
      >
        <Text className="font-inter-semibold text-sm text-white">{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      <AnimatedFlatList
        ref={listRef}
        accessibilityLabel="Traveling onboarding slides"
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
            disabled={activeIndex === 3 && selectedStyles.length === 0}
            icon={ChevronRight}
            label={t('onboarding.next')}
            onPress={() => goToIndex(activeIndex + 1)}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}
