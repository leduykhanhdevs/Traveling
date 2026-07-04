import { router } from 'expo-router';
import { CalendarDays, Pencil, Plus, Sparkles, Wallet, X } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityCard,
  type ActivityCategory,
  type TimelineActivity,
} from '../../../components/ActivityCard';
import { DayPicker, type ItineraryDayOption } from '../../../components/DayPicker';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { TextField } from '../../../components/TextField';
import { theme } from '../../../constants/theme';

const itineraryDays = [
  { id: 'day-1', label: 'Day 1', subtitle: 'May 25' },
  { id: 'day-2', label: 'Day 2', subtitle: 'May 26' },
  { id: 'day-3', label: 'Day 3', subtitle: 'May 27' },
  { id: 'day-4', label: 'Day 4', subtitle: 'May 28' },
] as const satisfies readonly ItineraryDayOption[];

const categories: readonly ActivityCategory[] = [
  'culture',
  'food',
  'beach',
  'hotel',
  'nature',
  'shopping',
  'transport',
  'other',
];

const categoryLabels: Record<ActivityCategory, string> = {
  culture: 'Culture',
  food: 'Food',
  beach: 'Beach',
  hotel: 'Hotel',
  nature: 'Nature',
  shopping: 'Shopping',
  transport: 'Transport',
  other: 'Other',
};

const categoryEmojis: Record<ActivityCategory, string> = {
  culture: '🏛',
  food: '🍜',
  beach: '🏖',
  hotel: '🛏',
  nature: '🌿',
  shopping: '🛍',
  transport: '✈️',
  other: '📍',
};

const initialActivitiesByDay: Record<string, TimelineActivity[]> = {
  'day-1': [
    {
      id: 'd1-heritage-walk',
      dayId: 'day-1',
      time: '08:00',
      title: 'Notre-Dame and Book Street Walk',
      duration: '1h 30m',
      category: 'culture',
      aiMatchScore: 96,
      notes: 'Start early while the light is soft and the plaza is still quiet.',
      address: 'Cong Xa Paris, District 1, Ho Chi Minh City',
      weatherNote: 'Warm morning, bring a hat and water.',
    },
    {
      id: 'd1-noodle-stop',
      dayId: 'day-1',
      time: '11:30',
      title: 'Local Bun Bo Lunch',
      duration: '1h',
      category: 'food',
      aiMatchScore: 94,
      notes: 'Order the medium spice bowl first; the house chili oil builds quickly.',
      address: 'Vo Van Tan, District 3, Ho Chi Minh City',
      weatherNote: 'Indoor stop works well during the midday heat.',
    },
    {
      id: 'd1-market',
      dayId: 'day-1',
      time: '15:00',
      title: 'Ben Thanh Market Snack Loop',
      duration: '2h',
      category: 'shopping',
      aiMatchScore: 89,
      notes: 'Save room for grilled banana and fresh sugarcane juice.',
      address: 'Le Loi, District 1, Ho Chi Minh City',
      weatherNote: 'Possible afternoon shower; stalls are covered.',
    },
  ],
  'day-2': [
    {
      id: 'd2-river',
      dayId: 'day-2',
      time: '09:00',
      title: 'Saigon River Morning Ride',
      duration: '1h 15m',
      category: 'transport',
      aiMatchScore: 91,
      notes: 'Use this as a scenic transfer toward the eastern districts.',
      address: 'Bach Dang Wharf, District 1, Ho Chi Minh City',
      weatherNote: 'Breezy by the water, but sun exposure is high.',
    },
    {
      id: 'd2-garden-cafe',
      dayId: 'day-2',
      time: '13:30',
      title: 'Hidden Garden Coffee Reset',
      duration: '1h',
      category: 'food',
      aiMatchScore: 92,
      notes: 'Ask for coconut coffee and sit near the balcony fans.',
      address: 'Nguyen Hue, District 1, Ho Chi Minh City',
      weatherNote: 'Great rain backup if skies turn grey.',
    },
  ],
  'day-3': [
    {
      id: 'd3-nature',
      dayId: 'day-3',
      time: '07:30',
      title: 'Can Gio Mangrove Day Trip',
      duration: '6h',
      category: 'nature',
      aiMatchScore: 88,
      notes: 'Pack insect repellent and keep the afternoon flexible for traffic.',
      address: 'Can Gio, Ho Chi Minh City',
      weatherNote: 'Best before heavy afternoon humidity.',
    },
    {
      id: 'd3-hotel',
      dayId: 'day-3',
      time: '18:30',
      title: 'Rooftop Hotel Wind Down',
      duration: '1h 30m',
      category: 'hotel',
      aiMatchScore: 86,
      notes: 'Book a sunset seat and keep the evening low effort.',
      address: 'District 1, Ho Chi Minh City',
      weatherNote: 'Evening skyline visibility should be clear.',
    },
  ],
  'day-4': [],
};

const buildGeneratedActivity = (dayId: string): TimelineActivity => ({
  id: `${dayId}-ai-generated`,
  dayId,
  time: '10:00',
  title: 'AI Hidden Gem Discovery',
  duration: '2h',
  category: 'other',
  aiMatchScore: 93,
  notes: 'Traveling balances review quality, walking distance, and your pace for this slot.',
  address: 'Generated route near your hotel area',
  weatherNote: 'Flexible indoor/outdoor option depending on the morning forecast.',
});

export default function ItineraryScreen(): JSX.Element {
  const [tripName, setTripName] = useState('Saigon Long Weekend');
  const [editingTripName, setEditingTripName] = useState(false);
  const [activeDayId, setActiveDayId] = useState('day-1');
  const [activitiesByDay, setActivitiesByDay] = useState<Record<string, TimelineActivity[]>>(
    initialActivitiesByDay,
  );
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [newPlace, setNewPlace] = useState('');
  const [newTime, setNewTime] = useState('14:00');
  const [newCategory, setNewCategory] = useState<ActivityCategory>('culture');

  const activeActivities = activitiesByDay[activeDayId] ?? [];
  const totalActivities = useMemo(
    () => Object.values(activitiesByDay).reduce((sum, dayActivities) => sum + dayActivities.length, 0),
    [activitiesByDay],
  );
  const activeDay = itineraryDays.find((day) => day.id === activeDayId) ?? itineraryDays[0];

  const updateActiveDay = (nextActivities: TimelineActivity[]): void => {
    setActivitiesByDay((current) => ({
      ...current,
      [activeDayId]: nextActivities,
    }));
  };

  const deleteActivity = (activityId: string): void => {
    updateActiveDay(activeActivities.filter((activity) => activity.id !== activityId));
    if (expandedActivityId === activityId) {
      setExpandedActivityId(null);
    }
  };

  const addActivity = (): void => {
    const title = newPlace.trim() || 'New Traveling Stop';
    const nextActivity: TimelineActivity = {
      id: `${activeDayId}-${Date.now()}`,
      dayId: activeDayId,
      time: newTime.trim() || '14:00',
      title,
      duration: '1h 30m',
      category: newCategory,
      aiMatchScore: 90,
      notes: 'Added manually. Traveling can refine this stop once live planning is connected.',
      address: 'Address to be confirmed',
      weatherNote: 'Check live weather before departure.',
    };

    updateActiveDay([...activeActivities, nextActivity].sort((left, right) => left.time.localeCompare(right.time)));
    setNewPlace('');
    setNewTime('14:00');
    setNewCategory('culture');
    setSheetVisible(false);
  };

  const generateEmptyDay = (): void => {
    updateActiveDay([buildGeneratedActivity(activeDayId)]);
  };

  const renderActivity = ({
    item,
    drag,
    isActive,
    getIndex,
  }: RenderItemParams<TimelineActivity>): JSX.Element => {
    const index = getIndex() ?? 0;
    return (
      <ActivityCard
        activity={item}
        expanded={expandedActivityId === item.id}
        isActive={isActive}
        isFirst={index === 0}
        isLast={index === activeActivities.length - 1}
        onDelete={() => deleteActivity(item.id)}
        onLongPress={drag}
        onPress={() => setExpandedActivityId((current) => (current === item.id ? null : item.id))}
      />
    );
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <View className="flex-1">
        <DraggableFlatList
          ListHeaderComponent={
            <View className="px-5 pb-5 pt-5">
              <View className="mb-5">
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1">
                    {editingTripName ? (
                      <TextInput
                        accessibilityLabel="Trip name"
                        accessibilityHint="Edit the itinerary trip name."
                        autoFocus
                        className="border-b border-primary pb-1 font-inter-bold text-3xl text-white"
                        onBlur={() => setEditingTripName(false)}
                        onChangeText={setTripName}
                        onSubmitEditing={() => setEditingTripName(false)}
                        returnKeyType="done"
                        value={tripName}
                      />
                    ) : (
                      <TouchableOpacity
                        accessibilityHint="Tap to edit the trip name inline."
                        accessibilityLabel={`Trip name ${tripName}`}
                        accessibilityRole="button"
                        className="flex-row items-center gap-2"
                        onPress={() => setEditingTripName(true)}
                      >
                        <Text className="flex-1 font-inter-bold text-3xl text-white" numberOfLines={2}>
                          {tripName}
                        </Text>
                        <Pencil color={theme.colors.muted} size={18} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      accessibilityHint="Opens the budget and expenses screen."
                      accessibilityLabel="View budget"
                      accessibilityRole="button"
                      className="h-12 w-12 items-center justify-center rounded-full bg-emerald-600"
                      onPress={() => router.push('/(tabs)/itinerary/budget' as never)}
                    >
                      <Wallet color="#ffffff" size={22} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityHint="Opens the add activity sheet."
                      accessibilityLabel="Add activity"
                      accessibilityRole="button"
                      className="h-12 w-12 items-center justify-center rounded-full bg-primary"
                      onPress={() => setSheetVisible(true)}
                    >
                      <Plus color="#ffffff" size={22} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="mt-3 flex-row items-center gap-2">
                  <CalendarDays color={theme.colors.muted} size={16} />
                  <Text accessibilityLabel="May 25 to May 28, 4 days" className="font-inter text-sm text-zinc-300">
                    May 25 — May 28 · 4 days
                  </Text>
                </View>
              </View>

              <DayPicker days={itineraryDays} activeDayId={activeDayId} onSelectDay={setActiveDayId} />

              <View className="mt-6 flex-row items-end justify-between">
                <View>
                  <Text
                    accessibilityLabel={`${activeDay.label} activity timeline`}
                    className="font-inter-bold text-2xl text-white"
                  >
                    {activeDay.label} Timeline
                  </Text>
                  <Text className="mt-1 font-inter text-sm text-zinc-400">
                    {activeActivities.length} activities planned
                  </Text>
                </View>
                <View className="rounded-full bg-white/10 px-3 py-2">
                  <Text
                    accessibilityLabel={`${totalActivities} total itinerary activities`}
                    className="font-inter-semibold text-xs text-white"
                  >
                    {totalActivities} total
                  </Text>
                </View>
              </View>

              {activeActivities.length === 0 ? (
                <View className="mt-5 gap-4">
                  <GlassCard>
                    <View className="items-start gap-3">
                      <View className="rounded-full bg-primary/30 px-3 py-1">
                        <Text className="font-inter-bold text-xs text-white">AI Planner</Text>
                      </View>
                      <Text
                        accessibilityLabel="Let Traveling build your perfect itinerary"
                        className="font-inter-bold text-2xl text-white"
                      >
                        Let Traveling build your perfect itinerary
                      </Text>
                      <Text className="font-inter text-sm leading-5 text-zinc-300">
                        Fill this day with a balanced route using your pace, interests, meal timing, and nearby gems.
                      </Text>
                      <PrimaryButton
                        accessibilityHint="Generates a mock AI activity for the selected day."
                        icon={Sparkles}
                        label="Generate"
                        onPress={generateEmptyDay}
                      />
                    </View>
                  </GlassCard>
                  <TouchableOpacity
                    accessibilityHint="Opens the add activity sheet for this empty day."
                    accessibilityLabel={`Add an activity to ${activeDay.label}`}
                    accessibilityRole="button"
                    className="items-center justify-center rounded-lg border border-dashed border-white/30 bg-white/5 px-5 py-8"
                    onPress={() => setSheetVisible(true)}
                  >
                    <View className="mb-3 h-12 w-12 items-center justify-center rounded-full bg-white/10">
                      <Plus color="#ffffff" size={24} />
                    </View>
                    <Text className="font-inter-bold text-lg text-white">Add the first activity</Text>
                    <Text className="mt-1 text-center font-inter text-sm text-zinc-400">
                      Search a place, choose a time, and set the activity type.
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}
            </View>
          }
          activationDistance={12}
          contentContainerClassName="pb-32"
          data={activeActivities}
          key={activeDayId}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => updateActiveDay(data)}
          renderItem={renderActivity}
        />

        <TouchableOpacity
          accessibilityHint="Opens the add activity sheet."
          accessibilityLabel="Add activity floating button"
          accessibilityRole="button"
          className="absolute bottom-8 right-5 h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg"
          onPress={() => setSheetVisible(true)}
        >
          <Plus color="#ffffff" size={28} />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
        transparent
        visible={sheetVisible}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View
            accessibilityLabel="Add activity sheet"
            accessibilityViewIsModal
            className="rounded-t-3xl border border-white/10 bg-surface px-5 pb-8 pt-5"
          >
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="font-inter-bold text-2xl text-white">Add Activity</Text>
                <Text className="mt-1 font-inter text-sm text-zinc-400">{activeDay.label} - {activeDay.subtitle}</Text>
              </View>
              <TouchableOpacity
                accessibilityHint="Closes the add activity sheet."
                accessibilityLabel="Close add activity sheet"
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                onPress={() => setSheetVisible(false)}
              >
                <X color="#ffffff" size={20} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <TextField
                accessibilityLabel="Search place"
                onChangeText={setNewPlace}
                placeholder="Search place"
                value={newPlace}
              />
              <TextField
                accessibilityLabel="Set time"
                onChangeText={setNewTime}
                placeholder="Set time"
                value={newTime}
              />
              <View>
                <Text className="mb-2 font-inter-semibold text-sm text-zinc-300">Category</Text>
                <View className="flex-row flex-wrap gap-2">
                  {categories.map((category) => {
                    const selected = category === newCategory;
                    return (
                      <TouchableOpacity
                        key={category}
                        accessibilityHint={`Sets the activity category to ${categoryLabels[category]}.`}
                        accessibilityLabel={`${categoryLabels[category]} category`}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        className={`flex-row items-center gap-2 rounded-full px-3 py-2 ${
                          selected ? 'bg-primary' : 'bg-white/10'
                        }`}
                        onPress={() => setNewCategory(category)}
                      >
                        <Text className="text-base">{categoryEmojis[category]}</Text>
                        <Text className="font-inter-semibold text-sm text-white">{categoryLabels[category]}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
              <PrimaryButton
                accessibilityHint="Adds this activity to the selected day."
                label="Add activity"
                onPress={addActivity}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
