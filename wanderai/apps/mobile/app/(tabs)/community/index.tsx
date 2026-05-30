import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Camera, Send } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '../../../components/GlassCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { TextField } from '../../../components/TextField';
import { getCommunityFeed, postReview } from '../../../services/community';

export default function CommunityScreen(): JSX.Element {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [nationality, setNationality] = useState('Vietnamese');
  const [city, setCity] = useState('Ho Chi Minh City');
  const [foodCategory, setFoodCategory] = useState('hotpot');
  const [reviewText, setReviewText] = useState('');
  const [placeId, setPlaceId] = useState('');
  const [rating, setRating] = useState(5);

  const feed = useQuery({
    queryKey: ['community', nationality, city, foodCategory],
    queryFn: async () => {
      const token = await getToken();
      return getCommunityFeed({ nationality, city, foodCategory }, token);
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken();
      return postReview(
        {
          placeId: placeId || `${city}-community`,
          rating,
          text: reviewText,
          photos: [],
          tags: [foodCategory],
          nationality,
        },
        token,
      );
    },
    onSuccess: () => {
      setReviewText('');
      void queryClient.invalidateQueries({ queryKey: ['community'] });
    },
  });

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <ScrollView className="flex-1 px-5" contentContainerClassName="gap-4 pb-32 pt-5">
        <View>
          <Text className="font-inter-bold text-4xl text-white">Community</Text>
          <Text className="mt-2 font-inter text-base text-zinc-300">
            Reviews from travelers with familiar taste and context.
          </Text>
        </View>

        <GlassCard>
          <View className="gap-3">
            <TextField
              value={nationality}
              onChangeText={setNationality}
              placeholder="Reviewer nationality"
            />
            <TextField value={city} onChangeText={setCity} placeholder="City" />
            <TextField
              value={foodCategory}
              onChangeText={setFoodCategory}
              placeholder="Food category"
            />
            <PrimaryButton
              label="Apply filters"
              variant="ghost"
              accessibilityHint="Refreshes the community feed using the current filters."
              onPress={() => void feed.refetch()}
            />
          </View>
        </GlassCard>

        <GlassCard>
          <View className="gap-3">
            <Text className="font-inter-bold text-xl text-white">Post a review</Text>
            <TextField value={placeId} onChangeText={setPlaceId} placeholder="Place ID" />
            <TextField
              multiline
              className="min-h-24"
              value={reviewText}
              onChangeText={setReviewText}
              placeholder="What should another traveler know?"
            />
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  accessibilityHint={`Sets the review rating to ${star} stars.`}
                  accessibilityLabel={`${star} star rating`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: rating === star }}
                  className={`h-10 w-10 items-center justify-center rounded-lg ${
                    rating === star ? 'bg-accent' : 'bg-white/10'
                  }`}
                  onPress={() => setRating(star)}
                >
                  <Text className="font-inter-bold text-white">{star}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View className="flex-row gap-2">
              <PrimaryButton
                label="Photo"
                icon={Camera}
                variant="ghost"
                className="flex-1"
                accessibilityHint="Adds a photo to the review."
              />
              <PrimaryButton
                label="Post"
                icon={Send}
                className="flex-1"
                loading={reviewMutation.isPending}
                accessibilityHint="Posts your community review."
                onPress={() => reviewMutation.mutate()}
              />
            </View>
          </View>
        </GlassCard>

        <View className="gap-3">
          {feed.data?.reviews.map((review) => (
            <GlassCard key={review.id}>
              <View className="flex-row justify-between">
                <Text className="font-inter-semibold text-white">{review.userName}</Text>
                <Text className="font-inter-bold text-accent">{review.rating.toFixed(1)}</Text>
              </View>
              <Text className="mt-1 font-inter text-sm text-zinc-300">
                {review.nationality} • {review.tags.join(', ')}
              </Text>
              <Text className="mt-3 font-inter text-base text-white">{review.text}</Text>
            </GlassCard>
          ))}
          {feed.data?.reviews.length === 0 ? (
            <GlassCard>
              <Text className="font-inter text-zinc-300">No matching community reviews yet.</Text>
            </GlassCard>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
