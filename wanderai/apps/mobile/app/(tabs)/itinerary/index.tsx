import { useAuth } from '@clerk/clerk-expo';
import { useMutation } from '@tanstack/react-query';
import type { BudgetRange, ItineraryDay, ItineraryPlan, ItinerarySlot } from '@wanderai/shared';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { GripVertical, Link as LinkIcon, Share2, WalletCards } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Share, Text, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { TextField } from '../../../components/TextField';
import { theme } from '../../../constants/theme';
import { generateItinerary } from '../../../services/itinerary';
import { usePreferencesStore } from '../../../stores/preferencesStore';
import { createDeepLink } from '../../../utils/deeplink';

const budgetOptions: readonly BudgetRange[] = ['budget', 'midrange', 'premium'];
const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

const planToSlots = (plan: ItineraryPlan | null): ItinerarySlot[] =>
  plan ? plan.days.flatMap((day) => day.slots) : [];

const bytesToBase64 = (bytes: Uint8Array): string => {
  const chunkSize = 32768;
  let binary = '';

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const safeFileName = (value: string): string => value.replace(/[^a-zA-Z0-9_-]/g, '-');

const planWithCurrentSlotOrder = (
  plan: ItineraryPlan,
  slots: readonly ItinerarySlot[],
): ItineraryPlan => {
  const days: ItineraryDay[] = plan.days.map((day) => {
    const daySlots = slots.filter((slot) => slot.day === day.day);
    return {
      ...day,
      slots: daySlots,
      totalEstimatedSpend: daySlots.reduce((sum, slot) => sum + slot.estimatedSpend, 0),
    };
  });

  return {
    ...plan,
    days,
    totalEstimatedSpend: days.reduce((sum, day) => sum + day.totalEstimatedSpend, 0),
  };
};

export default function ItineraryScreen(): JSX.Element {
  const { getToken, userId } = useAuth();
  const travelStyle = usePreferencesStore((state) => state.travelStyle);
  const [destination, setDestination] = useState('Ho Chi Minh City');
  const [days, setDays] = useState('3');
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('midrange');
  const [plan, setPlan] = useState<ItineraryPlan | null>(null);
  const [slots, setSlots] = useState<ItinerarySlot[]>([]);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [sharingLink, setSharingLink] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return generateItinerary(
        {
          destination,
          days: Number.parseInt(days, 10),
          budgetRange,
          travelStyle,
          userId: userId ?? undefined,
        },
        token,
      );
    },
    onSuccess: (data) => {
      setPlan(data);
      setSlots(planToSlots(data));
      setExportError(null);
    },
  });

  useEffect(() => {
    setSlots(planToSlots(plan));
  }, [plan]);

  const total = useMemo(() => slots.reduce((sum, slot) => sum + slot.estimatedSpend, 0), [slots]);

  const exportPdf = async (): Promise<void> => {
    if (!plan) {
      return;
    }

    setExportingPdf(true);
    setExportError(null);

    try {
      const token = await getToken();
      const response = await fetch(
        `${apiUrl.replace(/\/$/, '')}/api/v1/itineraries/${encodeURIComponent(plan.id)}/export`,
        {
          method: 'POST',
          headers: {
            accept: 'application/pdf',
            'content-type': 'application/json',
            ...(token ? { authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            plan: planWithCurrentSlotOrder(plan, slots),
          }),
        },
      );

      if (!response.ok) {
        throw new Error('Unable to export this itinerary.');
      }

      const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!directory) {
        throw new Error('Device file storage is unavailable.');
      }

      const bytes = new Uint8Array(await response.arrayBuffer());
      const fileUri = `${directory}wanderai-${safeFileName(plan.id)}.pdf`;
      await FileSystem.writeAsStringAsync(fileUri, bytesToBase64(bytes), {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Native sharing is unavailable on this device.');
      }

      await Sharing.shareAsync(fileUri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'PDF export failed.';
      setExportError(message);
    } finally {
      setExportingPdf(false);
    }
  };

  const shareItineraryLink = async (): Promise<void> => {
    if (!plan) {
      return;
    }

    setSharingLink(true);
    setExportError(null);

    try {
      const url = createDeepLink('itinerary', { id: plan.id });
      await Share.share({
        message: `${plan.destination} itinerary\n${url}`,
        title: `${plan.destination} itinerary`,
        url,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to share itinerary link.';
      setExportError(message);
    } finally {
      setSharingLink(false);
    }
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ItinerarySlot>): JSX.Element => (
    <TouchableOpacity
      accessibilityHint="Long press and drag to reorder this itinerary slot."
      accessibilityLabel={`Itinerary slot Day ${item.day}, ${item.startTime} to ${item.endTime}, ${item.title}`}
      accessibilityRole="button"
      accessibilityState={{ disabled: isActive }}
      activeOpacity={0.9}
      onLongPress={drag}
      disabled={isActive}
    >
      <GlassCard className="mb-3">
        <View className="flex-row gap-3">
          <GripVertical color={theme.colors.muted} size={18} />
          <View className="flex-1">
            <Text className="font-inter-semibold text-white">
              Day {item.day} - {item.startTime}-{item.endTime}
            </Text>
            <Text className="mt-1 font-inter-bold text-xl text-white">{item.title}</Text>
            <Text className="mt-2 font-inter text-sm text-zinc-300">{item.description}</Text>
            {item.place ? (
              <Text className="mt-2 font-inter-semibold text-primary">{item.place.name}</Text>
            ) : null}
            <Text className="mt-2 font-inter text-sm text-zinc-300">${item.estimatedSpend}</Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <DraggableFlatList
        ListHeaderComponent={
          <View className="gap-4 px-5 pb-4 pt-5">
            <View>
              <Text className="font-inter-bold text-4xl text-white">Itinerary</Text>
              <Text className="mt-2 font-inter text-base text-zinc-300">
                Generate, reorder, export, and share a real Places-linked plan.
              </Text>
            </View>
            <PrimaryButton
              label="Budget planner"
              icon={WalletCards}
              variant="ghost"
              accessibilityHint="Opens the trip budget planner."
              onPress={() => router.push('/(tabs)/itinerary/budget' as never)}
            />
            <GlassCard>
              <View className="gap-3">
                <TextField
                  value={destination}
                  onChangeText={setDestination}
                  placeholder="Destination city"
                />
                <TextField
                  value={days}
                  onChangeText={setDays}
                  keyboardType="number-pad"
                  placeholder="Days"
                />
                <View className="flex-row gap-2">
                  {budgetOptions.map((option) => (
                    <TouchableOpacity
                      key={option}
                      accessibilityHint={`Sets the itinerary budget range to ${option}.`}
                      accessibilityLabel={`${option} budget range`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: budgetRange === option }}
                      className={`flex-1 rounded-lg px-3 py-2 ${budgetRange === option ? 'bg-primary' : 'bg-white/10'}`}
                      onPress={() => setBudgetRange(option)}
                    >
                      <Text className="text-center font-inter-semibold text-white">{option}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <PrimaryButton
                  label="Generate plan"
                  loading={mutation.isPending}
                  accessibilityHint="Generates a day-by-day travel itinerary."
                  onPress={() => mutation.mutate()}
                />
              </View>
            </GlassCard>
            {plan ? (
              <GlassCard>
                <View className="gap-3">
                  <View>
                    <Text className="font-inter-bold text-2xl text-white">${total}</Text>
                    <Text className="font-inter text-sm text-zinc-300">Estimated trip spend</Text>
                  </View>
                  <View className="flex-row gap-2">
                    <PrimaryButton
                      label="Export"
                      icon={Share2}
                      variant="ghost"
                      className="flex-1"
                      loading={exportingPdf}
                      accessibilityHint="Downloads the itinerary PDF and opens the native share sheet."
                      onPress={() => void exportPdf()}
                    />
                    <PrimaryButton
                      label="Share Link"
                      icon={LinkIcon}
                      variant="ghost"
                      className="flex-1"
                      loading={sharingLink}
                      accessibilityHint="Shares a deep link to this itinerary."
                      onPress={() => void shareItineraryLink()}
                    />
                  </View>
                  {exportError ? (
                    <Text className="font-inter-semibold text-accent">{exportError}</Text>
                  ) : null}
                </View>
              </GlassCard>
            ) : null}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        data={slots}
        keyExtractor={(item) => item.id}
        onDragEnd={({ data }) => setSlots(data)}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}
