import { useEffect, useRef } from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';

export type ItineraryDayOption = {
  id: string;
  label: string;
  subtitle: string;
};

type DayPickerProps = {
  days: readonly ItineraryDayOption[];
  activeDayId: string;
  onSelectDay: (dayId: string) => void;
};

const dayPillWidth = 92;
const dayPillGap = 10;

export const DayPicker = ({ days, activeDayId, onSelectDay }: DayPickerProps): JSX.Element => {
  const listRef = useRef<FlatList<ItineraryDayOption>>(null);
  const activeIndex = Math.max(
    0,
    days.findIndex((day) => day.id === activeDayId),
  );

  useEffect(() => {
    listRef.current?.scrollToIndex({
      animated: true,
      index: activeIndex,
      viewPosition: 0.5,
    });
  }, [activeIndex]);

  return (
    <FlatList
      ref={listRef}
      accessibilityLabel="Itinerary day picker"
      data={days}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        index,
        length: dayPillWidth + dayPillGap,
        offset: (dayPillWidth + dayPillGap) * index,
      })}
      horizontal
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => {
        const selected = item.id === activeDayId;

        return (
          <TouchableOpacity
            accessibilityHint={`Shows itinerary activities for ${item.label}.`}
            accessibilityLabel={`${item.label}, ${item.subtitle}`}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`mr-2 h-16 w-[92px] items-center justify-center rounded-full border ${
              selected ? 'border-primary bg-primary' : 'border-white/10 bg-white/10'
            }`}
            onPress={() => onSelectDay(item.id)}
          >
            <Text className="font-inter-bold text-sm text-white">{item.label}</Text>
            <Text className={`mt-0.5 font-inter text-[11px] ${selected ? 'text-white' : 'text-zinc-400'}`}>
              {item.subtitle}
            </Text>
          </TouchableOpacity>
        );
      }}
      showsHorizontalScrollIndicator={false}
      snapToAlignment="start"
      snapToInterval={dayPillWidth + dayPillGap}
    />
  );
};
