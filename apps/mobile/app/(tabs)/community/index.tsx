import { Plus, Send, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { FlatList, Modal, RefreshControl, Share, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CommentSheet } from '../../../components/CommentSheet';
import { GlassCard } from '../../../components/GlassCard';
import {
  PostCard,
  type CommunityFeedAuthor,
  type CommunityFeedComment,
  type CommunityFeedPost,
  getAvatarColorClass,
} from '../../../components/PostCard';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { Skeleton } from '../../../components/Skeleton';
import { TextField } from '../../../components/TextField';
import { useAuth } from '@clerk/clerk-expo';
import {
  useCommunityPosts,
  useCreatePostMutation,
  usePostComments,
  useAddCommentMutation,
  useToggleLikeMutation,
} from '../../../services/community';

type FeedFilter = 'All' | 'Following' | 'Nearby';
type StoryTraveler = {
  id: string;
  author: CommunityFeedAuthor;
  seen: boolean;
};

type MockPost = CommunityFeedPost & {
  following: boolean;
  nearby: boolean;
};

const filters = ['All', 'Following', 'Nearby'] as const satisfies readonly FeedFilter[];

const authors = {
  maya: {
    id: 'author-maya',
    name: 'Maya Chen',
    username: 'maya',
    initials: 'MC',
    location: 'Singapore',
  },
  leo: {
    id: 'author-leo',
    name: 'Leo Martin',
    username: 'leo',
    initials: 'LM',
    location: 'France',
  },
  an: {
    id: 'author-an',
    name: 'An Nguyen',
    username: 'annguyen',
    initials: 'AN',
    location: 'Vietnam',
  },
  sara: {
    id: 'author-sara',
    name: 'Sara Kim',
    username: 'sarak',
    initials: 'SK',
    location: 'Korea',
  },
  noah: {
    id: 'author-noah',
    name: 'Noah Wells',
    username: 'noahw',
    initials: 'NW',
    location: 'United States',
  },
  lina: {
    id: 'author-lina',
    name: 'Lina Ortiz',
    username: 'linao',
    initials: 'LO',
    location: 'Mexico',
  },
} as const satisfies Record<string, CommunityFeedAuthor>;

const initialComments: Record<string, CommunityFeedComment[]> = {
  'post-market-breakfast': [
    {
      id: 'comment-market-1',
      author: authors.an,
      content: 'The side entrance tip is real. It saves at least ten minutes in the morning.',
      timeAgo: '10 min ago',
    },
    {
      id: 'comment-market-2',
      author: authors.noah,
      content: 'Adding this to tomorrow. Did you pay cash only?',
      timeAgo: '4 min ago',
    },
  ],
  'post-lantern-walk': [
    {
      id: 'comment-lantern-1',
      author: authors.sara,
      content: 'Blue hour there is so good after rain. The reflections make every photo better.',
      timeAgo: '30 min ago',
    },
  ],
  'post-soup-tip': [
    {
      id: 'comment-soup-1',
      author: authors.maya,
      content: 'Extra herbs over extra noodles is excellent advice.',
      timeAgo: '48 min ago',
    },
  ],
};

const stories: readonly StoryTraveler[] = [
  { id: 'story-maya', author: authors.maya, seen: false },
  { id: 'story-leo', author: authors.leo, seen: false },
  { id: 'story-an', author: authors.an, seen: true },
  { id: 'story-sara', author: authors.sara, seen: false },
  { id: 'story-noah', author: authors.noah, seen: true },
  { id: 'story-lina', author: authors.lina, seen: false },
];

export default function CommunityScreen(): JSX.Element {
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    getToken().then(setToken).catch(() => {});
  }, [getToken]);

  const { data: postsData, isLoading: postsLoading, refetch: refetchPosts } = useCommunityPosts(token, { enabled: !!token });

  const posts = useMemo(() => {
    if (postsData?.posts) {
      return postsData.posts.map((post) => {
        const author = post.author as any;
        return {
          id: post.id,
          author: {
            id: author.id,
            name: author.name,
            username: author.username || 'wanderer',
            initials: author.initials || 'TR',
            location: author.location || 'Vietnam',
          },
          content: post.content,
          imageUrl: post.imageUrl || undefined,
          placeName: post.placeId ? 'Tagged location' : undefined,
          location: author.location || 'Vietnam',
          timeAgo: new Date(post.createdAt).toLocaleDateString(),
          likeCount: post.likeCount,
          commentCount: post.commentCount,
          likedByMe: post.likedByMe,
          following: true,
          nearby: true,
        };
      });
    }
    return [];
  }, [postsData]);

  const [activeFilter, setActiveFilter] = useState<FeedFilter>('All');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [createPostVisible, setCreatePostVisible] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostPlace, setNewPostPlace] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const { data: commentsData, refetch: refetchComments } = usePostComments(selectedPostId, token, { enabled: !!selectedPostId });

  const selectedComments = useMemo(() => {
    if (commentsData?.comments) {
      return commentsData.comments.map((comment) => {
        const author = comment.author as any;
        return {
          id: comment.id,
          author: {
            id: author.id,
            name: author.name,
            username: author.username || 'wanderer',
            initials: author.initials || 'TR',
            location: author.location || 'Traveler',
          },
          content: comment.content,
          timeAgo: new Date(comment.createdAt).toLocaleDateString(),
        };
      });
    }
    return [];
  }, [commentsData]);

  const loading = postsLoading;
  const refreshing = false;

  const visiblePosts = useMemo(() => {
    if (activeFilter === 'Following') {
      return posts.filter((post) => post.following);
    }
    if (activeFilter === 'Nearby') {
      return posts.filter((post) => post.nearby);
    }
    return posts;
  }, [activeFilter, posts]);

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );

  const refreshFeed = (): void => {
    refetchPosts();
  };

  const toggleLikeMutation = useToggleLikeMutation(token);

  const toggleLike = (postId: string): void => {
    toggleLikeMutation.mutate(postId, {
      onSuccess: () => {
        refetchPosts();
      },
    });
  };

  const sharePost = (postId: string): void => {
    const post = posts.find((item) => item.id === postId);
    if (!post) {
      return;
    }
    void Share.share({
      message: `${post.author.name} on Traveling: ${post.content}`,
      title: post.placeName ?? 'Traveling community post',
    });
  };

  const addCommentMutation = useAddCommentMutation(token);

  const submitComment = (): void => {
    const trimmed = commentText.trim();
    if (!selectedPostId || !trimmed) {
      return;
    }

    setSubmittingComment(true);
    addCommentMutation.mutate({ postId: selectedPostId, content: trimmed }, {
      onSuccess: () => {
        setCommentText('');
        refetchComments();
        refetchPosts();
        setSubmittingComment(false);
      },
      onError: () => {
        setSubmittingComment(false);
      }
    });
  };

  const createPostMutation = useCreatePostMutation(token);

  const createPost = (): void => {
    const trimmed = newPostContent.trim();
    if (!trimmed) {
      return;
    }

    createPostMutation.mutate({
      content: trimmed,
      placeId: newPostPlace.trim() || undefined,
    }, {
      onSuccess: () => {
        setNewPostContent('');
        setNewPostPlace('');
        setCreatePostVisible(false);
        refetchPosts();
      }
    });
  };

  return (
    <SafeAreaView accessibilityViewIsModal={false} className="flex-1 bg-background">
      <FlatList
        accessibilityLabel="Community travel feed"
        data={loading ? [] : visiblePosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View className="px-5 pb-4 pt-5">
            <View className="mb-5 flex-row items-start justify-between gap-4">
              <View className="flex-1">
                <Text accessibilityLabel="Community" className="font-inter-bold text-4xl text-white">
                  Community
                </Text>
                <Text className="mt-2 font-inter text-base text-zinc-300">
                  Real-time travel notes from people exploring nearby.
                </Text>
              </View>
              <View className="items-end gap-2">
                {filters.map((filter) => {
                  const selected = filter === activeFilter;
                  return (
                    <TouchableOpacity
                      key={filter}
                      accessibilityHint={`Filters the community feed to ${filter}.`}
                      accessibilityLabel={`${filter} community filter`}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      className={`rounded-full px-4 py-2 ${selected ? 'bg-white' : 'bg-white/10'}`}
                      onPress={() => setActiveFilter(filter)}
                    >
                      <Text className={`font-inter-semibold text-xs ${selected ? 'text-slate-950' : 'text-white'}`}>
                        {filter}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <FlatList
              accessibilityLabel="Traveler stories"
              data={stories}
              horizontal
              keyExtractor={(item) => item.id}
              ListHeaderComponent={
                <TouchableOpacity
                  accessibilityHint="Starts the add story flow."
                  accessibilityLabel="Add story"
                  accessibilityRole="button"
                  className="mr-4 items-center"
                >
                  <View className="h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-white/40 bg-white/10">
                    <Plus color="#FFFFFF" size={24} />
                  </View>
                  <Text className="mt-2 font-inter-semibold text-xs text-white">Add Story</Text>
                </TouchableOpacity>
              }
              renderItem={({ item }) => (
                <TouchableOpacity
                  accessibilityHint={`Opens ${item.author.name}'s travel story.`}
                  accessibilityLabel={`${item.author.name} story`}
                  accessibilityRole="button"
                  className="mr-4 items-center"
                >
                  <View
                    className={`h-16 w-16 items-center justify-center rounded-full border-2 ${
                      item.seen ? 'border-white/20' : 'border-accent'
                    }`}
                  >
                    <View
                      className={`h-12 w-12 items-center justify-center rounded-full ${getAvatarColorClass(
                        item.author.username,
                      )}`}
                    >
                      <Text className="font-inter-bold text-xs text-white">{item.author.initials}</Text>
                    </View>
                  </View>
                  <Text className="mt-2 w-16 text-center font-inter text-xs text-zinc-300" numberOfLines={1}>
                    {item.author.username}
                  </Text>
                </TouchableOpacity>
              )}
              showsHorizontalScrollIndicator={false}
            />

            {loading ? (
              <View className="mt-6 gap-4">
                {[0, 1, 2].map((item) => (
                  <Skeleton key={item} className="h-80" />
                ))}
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? null : (
            <View className="px-5">
              <GlassCard>
                <Text className="text-center font-inter text-zinc-300">
                  No posts match this filter yet. Try All or create the first one.
                </Text>
              </GlassCard>
            </View>
          )
        }
        contentContainerClassName="pb-32"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#FFFFFF"
            title="Refreshing community"
            titleColor="#FFFFFF"
            onRefresh={refreshFeed}
          />
        }
        renderItem={({ item }) => (
          <View className="px-5">
            <PostCard
              post={item}
              onOpenComments={setSelectedPostId}
              onShare={sharePost}
              onToggleLike={toggleLike}
            />
          </View>
        )}
      />

      <TouchableOpacity
        accessibilityHint="Opens the create post sheet."
        accessibilityLabel="Create community post"
        accessibilityRole="button"
        activeOpacity={0.85}
        className="absolute bottom-8 right-5 h-16 w-16 items-center justify-center rounded-full bg-accent shadow-lg"
        onPress={() => setCreatePostVisible(true)}
      >
        <Plus color="#FFFFFF" size={28} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        onRequestClose={() => setCreatePostVisible(false)}
        transparent
        visible={createPostVisible}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View
            accessibilityLabel="Create post bottom sheet"
            accessibilityViewIsModal
            className="rounded-t-3xl border border-white/10 bg-surface px-5 pb-8 pt-5"
          >
            <View className="mb-5 flex-row items-center justify-between">
              <View>
                <Text className="font-inter-bold text-2xl text-white">Create post</Text>
                <Text className="mt-1 font-inter text-sm text-zinc-400">Share a tip with nearby travelers</Text>
              </View>
              <TouchableOpacity
                accessibilityHint="Closes the create post sheet."
                accessibilityLabel="Close create post sheet"
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-full bg-white/10"
                onPress={() => setCreatePostVisible(false)}
              >
                <X color="#FFFFFF" size={20} />
              </TouchableOpacity>
            </View>

            <View className="gap-4">
              <TextField
                accessibilityLabel="Post content"
                className="min-h-32"
                multiline
                onChangeText={setNewPostContent}
                placeholder="What should another traveler know?"
                value={newPostContent}
              />
              <TextField
                accessibilityLabel="Tag a place"
                onChangeText={setNewPostPlace}
                placeholder="Tag a place"
                value={newPostPlace}
              />
              <PrimaryButton
                accessibilityHint="Publishes this community post."
                disabled={!newPostContent.trim()}
                icon={Send}
                label="Post"
                onPress={createPost}
              />
            </View>
          </View>
        </View>
      </Modal>

      <CommentSheet
        comments={selectedComments}
        commentText={commentText}
        post={selectedPost}
        submitting={submittingComment}
        visible={Boolean(selectedPost)}
        onChangeCommentText={setCommentText}
        onClose={() => {
          setSelectedPostId(null);
          setCommentText('');
        }}
        onSubmit={submitComment}
      />
    </SafeAreaView>
  );
}
