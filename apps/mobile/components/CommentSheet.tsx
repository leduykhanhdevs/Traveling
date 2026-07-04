import { Send, X } from 'lucide-react-native';
import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';
import type { CommunityFeedComment, CommunityFeedPost } from './PostCard';
import { PrimaryButton } from './PrimaryButton';
import { TextField } from './TextField';

type CommentSheetProps = {
  comments: readonly CommunityFeedComment[];
  commentText: string;
  post: CommunityFeedPost | null;
  submitting?: boolean;
  visible: boolean;
  onChangeCommentText: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export const CommentSheet = ({
  comments,
  commentText,
  post,
  submitting = false,
  visible,
  onChangeCommentText,
  onClose,
  onSubmit,
}: CommentSheetProps): JSX.Element => (
  <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
    <View className="flex-1 justify-end bg-black/60">
      <View
        accessibilityLabel="Comments bottom sheet"
        accessibilityViewIsModal
        className="max-h-[82vh] rounded-t-3xl border border-white/10 bg-surface px-5 pb-7 pt-5"
      >
        <View className="mb-4 flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-inter-bold text-2xl text-white">Comments</Text>
            {post ? (
              <Text className="mt-1 font-inter text-sm text-zinc-400" numberOfLines={1}>
                {post.author.name} - {post.placeName ?? post.location}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity
            accessibilityHint="Closes the comments sheet."
            accessibilityLabel="Close comments"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
            onPress={onClose}
          >
            <X color="#FFFFFF" size={18} />
          </TouchableOpacity>
        </View>

        <FlatList
          accessibilityLabel="Post comments"
          className="max-h-96"
          contentContainerClassName="gap-3 pb-3"
          data={comments}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="rounded-lg border border-dashed border-white/20 p-5">
              <Text className="text-center font-inter text-sm text-zinc-300">
                No comments yet. Start the conversation with a useful travel tip.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View className="rounded-lg bg-white/10 p-3">
              <View className="mb-2 flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
                  <Text className="font-inter-bold text-xs text-white">{item.author.initials}</Text>
                </View>
                <View className="flex-1">
                  <Text className="font-inter-semibold text-sm text-white">{item.author.name}</Text>
                  <Text className="font-inter text-xs text-zinc-500">{item.timeAgo}</Text>
                </View>
              </View>
              <Text className="font-inter text-sm leading-5 text-zinc-200">{item.content}</Text>
            </View>
          )}
        />

        <View className="mt-3 gap-3 border-t border-white/10 pt-4">
          <TextField
            accessibilityLabel="Add a comment"
            className="min-h-20"
            multiline
            onChangeText={onChangeCommentText}
            placeholder="Add a helpful comment"
            value={commentText}
          />
          <PrimaryButton
            accessibilityHint="Adds your comment to this post."
            disabled={!commentText.trim()}
            icon={Send}
            label="Comment"
            loading={submitting}
            onPress={onSubmit}
          />
        </View>
      </View>
    </View>
  </Modal>
);
