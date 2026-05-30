import { ChevronDown, ChevronUp, GripVertical, Trash2 } from 'lucide-react-native';
import { Text, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { GlassCard } from './GlassCard';

export type ActivityCategory =
  | 'culture'
  | 'food'
  | 'beach'
  | 'hotel'
  | 'nature'
  | 'shopping'
  | 'transport'
  | 'other';

export type TimelineActivity = {
  id: string;
  dayId: string;
  time: string;
  title: string;
  duration: string;
  category: ActivityCategory;
  aiMatchScore: number;
  notes: string;
  address: string;
  weatherNote: string;
};

const activityCategoryEmoji: Record<ActivityCategory, string> = {
  culture: '🏛',
  food: '🍜',
  beach: '🏖',
  hotel: '🛏',
  nature: '🌿',
  shopping: '🛍',
  transport: '✈️',
  other: '📍',
};

const activityCategoryLabel: Record<ActivityCategory, string> = {
  culture: 'Culture',
  food: 'Food',
  beach: 'Beach',
  hotel: 'Hotel',
  nature: 'Nature',
  shopping: 'Shopping',
  transport: 'Transport',
  other: 'Other',
};

type ActivityCardProps = {
  activity: TimelineActivity;
  expanded: boolean;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onDelete: () => void;
  onLongPress: () => void;
  onPress: () => void;
};

export const ActivityCard = ({
  activity,
  expanded,
  isActive,
  isFirst,
  isLast,
  onDelete,
  onLongPress,
  onPress,
}: ActivityCardProps): JSX.Element => {
  const emoji = activityCategoryEmoji[activity.category];
  const categoryLabel = activityCategoryLabel[activity.category];

  return (
    <Swipeable
      overshootRight={false}
      renderRightActions={() => (
        <TouchableOpacity
          accessibilityHint={`Deletes ${activity.title} from this day.`}
          accessibilityLabel={`Delete ${activity.title}`}
          accessibilityRole="button"
          className="mb-4 ml-3 w-24 items-center justify-center rounded-lg bg-red-500"
          onPress={onDelete}
        >
          <Trash2 color="#ffffff" size={22} />
          <Text className="mt-1 font-inter-bold text-xs text-white">Delete</Text>
        </TouchableOpacity>
      )}
    >
      <View className={`mb-4 flex-row ${isActive ? 'opacity-80' : ''}`}>
        <View className="w-16 pr-3 pt-6">
          <Text accessibilityLabel={`Time slot ${activity.time}`} className="font-inter-bold text-sm text-white">
            {activity.time}
          </Text>
        </View>
        <View className="w-5 items-center self-stretch">
          <View className={`w-px flex-1 ${isFirst ? 'bg-transparent' : 'bg-white/15'}`} />
          <View className="h-4 w-4 rounded-full border-2 border-background bg-accent" />
          <View className={`w-px flex-1 ${isLast ? 'bg-transparent' : 'bg-white/15'}`} />
        </View>
        <TouchableOpacity
          accessibilityHint="Expands or collapses activity details. Long press and drag to reorder."
          accessibilityLabel={`${activity.title}, ${categoryLabel}, ${activity.duration}, AI match ${activity.aiMatchScore} percent`}
          accessibilityRole="button"
          accessibilityState={{ expanded, disabled: isActive }}
          activeOpacity={0.9}
          className="ml-3 flex-1"
          disabled={isActive}
          onLongPress={onLongPress}
          onPress={onPress}
        >
          <GlassCard className={isActive ? 'border-primary' : ''}>
            <View className="flex-row items-start gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-lg bg-white/10">
                <Text accessibilityLabel={`${categoryLabel} activity icon`} className="text-2xl">
                  {emoji}
                </Text>
              </View>
              <View className="flex-1">
                <View className="flex-row items-start justify-between gap-2">
                  <View className="flex-1">
                    <Text className="font-inter-bold text-lg text-white" numberOfLines={2}>
                      {activity.title}
                    </Text>
                    <Text className="mt-1 font-inter text-sm text-zinc-300">
                      {categoryLabel} - {activity.duration}
                    </Text>
                  </View>
                  <View className="items-center rounded-full bg-primary px-3 py-1">
                    <Text className="font-inter-bold text-sm text-white">{activity.aiMatchScore}</Text>
                    <Text className="font-inter text-[10px] text-white">AI</Text>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <GripVertical color="#a1a1aa" size={16} />
                    <Text className="font-inter text-xs text-zinc-400">Hold to reorder</Text>
                  </View>
                  {expanded ? <ChevronUp color="#ffffff" size={18} /> : <ChevronDown color="#ffffff" size={18} />}
                </View>
                {expanded ? (
                  <View className="mt-4 gap-3 rounded-lg bg-white/10 p-3">
                    <View>
                      <Text className="font-inter-semibold text-xs uppercase text-zinc-400">Notes</Text>
                      <Text className="mt-1 font-inter text-sm text-white">{activity.notes}</Text>
                    </View>
                    <View>
                      <Text className="font-inter-semibold text-xs uppercase text-zinc-400">Address</Text>
                      <Text className="mt-1 font-inter text-sm text-white">{activity.address}</Text>
                    </View>
                    <View>
                      <Text className="font-inter-semibold text-xs uppercase text-zinc-400">Weather</Text>
                      <Text className="mt-1 font-inter text-sm text-white">{activity.weatherNote}</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </TouchableOpacity>
      </View>
    </Swipeable>
  );
};
