import type { RankedPlace } from '@wanderai/shared';
import { Bookmark, MapPinned, Navigation } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';
import { metersToDisplay, priceLevelToDisplay } from '../utils/format';
import { GlassCard } from './GlassCard';
import { PrimaryButton } from './PrimaryButton';
import { ScoreBreakdown } from './ScoreBreakdown';

type ResultCardProps = {
  place: RankedPlace;
  onOpen: () => void;
  onNavigate: () => void;
  onSave: () => void;
};

export const ResultCard = ({ place, onOpen, onNavigate, onSave }: ResultCardProps): JSX.Element => (
  <TouchableOpacity
    accessibilityHint="Opens detailed information for this place."
    accessibilityLabel={`Open ${place.name}. AI score ${place.score.compositeScore}. ${metersToDisplay(
      place.distanceMeters,
    )} away.`}
    accessibilityRole="button"
    activeOpacity={0.9}
    onPress={onOpen}
  >
    <GlassCard className="mb-4">
      <View className="flex-row gap-3">
        {place.photoUrl ? (
          <Image
            accessibilityLabel={`${place.name} photo`}
            source={{ uri: place.photoUrl }}
            className="h-24 w-24 rounded-lg bg-white/10"
          />
        ) : (
          <View
            accessibilityLabel={`${place.name} location placeholder image`}
            className="h-24 w-24 items-center justify-center rounded-lg bg-white/10"
          >
            <MapPinned size={28} color={theme.colors.muted} />
          </View>
        )}
        <View className="flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="font-inter-bold text-lg text-white" numberOfLines={2}>
                {place.name}
              </Text>
              <Text className="font-inter text-sm text-zinc-300" numberOfLines={1}>
                {metersToDisplay(place.distanceMeters)} • {priceLevelToDisplay(place.priceLevel)}
              </Text>
            </View>
            <View className="items-center rounded-lg bg-primary px-3 py-2">
              <Text className="font-inter-bold text-lg text-white">
                {place.score.compositeScore}
              </Text>
              <Text className="font-inter text-[10px] text-white">AI</Text>
            </View>
          </View>
          <Text className="font-inter text-sm text-zinc-200" numberOfLines={2}>
            {place.aiSummary}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {place.cuisineTags.slice(0, 3).map((tag) => (
              <Text
                key={tag}
                className="rounded-full bg-white/10 px-2 py-1 font-inter text-xs text-zinc-200"
              >
                {tag}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <View className="mt-4">
        <ScoreBreakdown score={place.score} />
      </View>
      {place.topReviewSnippet ? (
        <Text className="mt-3 font-inter text-sm italic text-zinc-300" numberOfLines={2}>
          “{place.topReviewSnippet}”
        </Text>
      ) : null}
      <View className="mt-4 flex-row gap-2">
        <PrimaryButton
          label="Navigate"
          icon={Navigation}
          className="flex-1"
          accessibilityHint={`Opens directions to ${place.name}.`}
          onPress={onNavigate}
        />
        <PrimaryButton
          label="Save"
          icon={Bookmark}
          variant="ghost"
          className="flex-1"
          accessibilityHint={`Saves ${place.name} to your saved places.`}
          onPress={onSave}
        />
      </View>
    </GlassCard>
  </TouchableOpacity>
);
