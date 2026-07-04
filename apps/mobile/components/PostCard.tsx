import { Heart, MessageCircle, Share2 } from 'lucide-react-native';
import { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { GlassCard } from './GlassCard';

export type CommunityFeedAuthor = {
  id: string;
  name: string;
  username: string;
  initials: string;
  location: string;
};

export type CommunityFeedComment = {
  id: string;
  author: CommunityFeedAuthor;
  content: string;
  timeAgo: string;
};

export type CommunityFeedPost = {
  id: string;
  author: CommunityFeedAuthor;
  content: string;
  imageUrl?: string;
  placeName?: string;
  location: string;
  timeAgo: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

type PostCardProps = {
  post: CommunityFeedPost;
  onOpenComments: (postId: string) => void;
  onShare: (postId: string) => void;
  onToggleLike: (postId: string) => void;
};

const avatarColorClasses = [
  'bg-primary',
  'bg-accent',
  'bg-teal-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
] as const;

export const getAvatarColorClass = (username: string): string => {
  const firstChar = username.trim().charCodeAt(0);
  const index = Number.isFinite(firstChar) ? firstChar % avatarColorClasses.length : 0;
  return avatarColorClasses[index] ?? avatarColorClasses[0];
};

export const PostCard = ({
  post,
  onOpenComments,
  onShare,
  onToggleLike,
}: PostCardProps): JSX.Element => {
  const [expanded, setExpanded] = useState(false);
  const heartScale = useSharedValue(1);
  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));
  const shouldClamp = post.content.length > 118;

  const toggleLike = (): void => {
    heartScale.value = 1.4;
    heartScale.value = withSpring(1, {
      damping: 6,
      stiffness: 240,
    });
    onToggleLike(post.id);
  };

  return (
    <GlassCard className="mb-4">
      <View className="gap-4">
        <View className="flex-row items-center gap-3">
          <View
            accessibilityLabel={`${post.author.name} avatar`}
            className={`h-12 w-12 items-center justify-center rounded-full ${getAvatarColorClass(
              post.author.username,
            )}`}
          >
            <Text className="font-inter-bold text-sm text-white">{post.author.initials}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text className="font-inter-bold text-base text-white" numberOfLines={1}>
                {post.author.name}
              </Text>
              <Text className="font-inter text-xs text-zinc-400" numberOfLines={1}>
                @{post.author.username}
              </Text>
            </View>
            <Text
              accessibilityLabel={`${post.location}, ${post.timeAgo}`}
              className="mt-0.5 font-inter text-xs text-zinc-400"
              numberOfLines={1}
            >
              {post.location} - {post.timeAgo}
            </Text>
          </View>
        </View>

        <View>
          <Text className="font-inter text-base leading-6 text-white" numberOfLines={expanded ? undefined : 3}>
            {post.content}
          </Text>
          {shouldClamp ? (
            <TouchableOpacity
              accessibilityHint={expanded ? 'Collapses the post text.' : 'Expands the full post text.'}
              accessibilityLabel={expanded ? 'See less post content' : 'See more post content'}
              accessibilityRole="button"
              className="mt-1 self-start"
              onPress={() => setExpanded((current) => !current)}
            >
              <Text className="font-inter-semibold text-sm text-primary">
                {expanded ? 'See less' : 'See more'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {post.imageUrl ? (
          <View
            accessibilityLabel={`${post.placeName ?? post.location} media placeholder`}
            className="relative h-52 overflow-hidden rounded-lg bg-primary"
          >
            <Svg height="100%" preserveAspectRatio="none" width="100%">
              <Defs>
                <LinearGradient id={`postGradient-${post.id}`} x1="0" x2="1" y1="0" y2="1">
                  <Stop offset="0" stopColor="#6C63FF" />
                  <Stop offset="0.58" stopColor="#1e3a5f" />
                  <Stop offset="1" stopColor="#FF6584" />
                </LinearGradient>
              </Defs>
              <Rect fill={`url(#postGradient-${post.id})`} height="100%" width="100%" x="0" y="0" />
            </Svg>
            <View className="absolute inset-0 justify-end bg-black/15 p-4">
              <Text className="font-inter-bold text-2xl text-white" numberOfLines={2}>
                {post.placeName ?? 'Travel moment'}
              </Text>
              <Text className="mt-1 font-inter-semibold text-sm text-white/80">{post.location}</Text>
            </View>
          </View>
        ) : null}

        <View className="flex-row gap-3 border-t border-white/10 pt-3">
          <TouchableOpacity
            accessibilityHint="Toggles your like reaction for this post."
            accessibilityLabel={`${post.likedByMe ? 'Unlike' : 'Like'} post from ${post.author.name}`}
            accessibilityRole="button"
            accessibilityState={{ selected: post.likedByMe }}
            activeOpacity={0.82}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white/10 px-3"
            onPress={toggleLike}
          >
            <Animated.View style={heartStyle}>
              <Heart
                color={post.likedByMe ? '#FF3B5F' : '#FFFFFF'}
                fill={post.likedByMe ? '#FF3B5F' : 'transparent'}
                size={20}
              />
            </Animated.View>
            <Text className="font-inter-semibold text-sm text-white">{post.likeCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityHint="Opens comments for this community post."
            accessibilityLabel={`Open comments for post from ${post.author.name}`}
            accessibilityRole="button"
            activeOpacity={0.82}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white/10 px-3"
            onPress={() => onOpenComments(post.id)}
          >
            <MessageCircle color="#FFFFFF" size={20} />
            <Text className="font-inter-semibold text-sm text-white">{post.commentCount}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityHint="Opens the native share sheet for this post."
            accessibilityLabel={`Share post from ${post.author.name}`}
            accessibilityRole="button"
            activeOpacity={0.82}
            className="min-h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full bg-white/10 px-3"
            onPress={() => onShare(post.id)}
          >
            <Share2 color="#FFFFFF" size={20} />
            <Text className="font-inter-semibold text-sm text-white">Share</Text>
          </TouchableOpacity>
        </View>
      </View>
    </GlassCard>
  );
};
