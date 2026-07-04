import type { CommunityReview } from '@traveling/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from './api';

const communityStaleTimeMs = 1000 * 60 * 10;

export type CommunityFilters = {
  nationality?: string;
  foodCategory?: string;
  city?: string;
};

export type CommunityPage = {
  page: number;
  filters: CommunityFilters;
};

export type CommunityAuthor = {
  id: string;
  name: string;
  initials: string;
};

export type CommunityPost = {
  id: string;
  userId: string;
  author: CommunityAuthor;
  content: string;
  imageUrl?: string;
  placeId?: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

export type CommunityComment = {
  id: string;
  postId: string;
  userId: string;
  author: CommunityAuthor;
  content: string;
  createdAt: string;
};

export type CreateCommunityPostInput = {
  content: string;
  imageUrl?: string;
  placeId?: string;
};

export const getCommunityFeed = (
  filters: CommunityFilters,
  token?: string | null,
): Promise<{ reviews: readonly CommunityReview[] }> => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/community${suffix}`, { token });
};

export const postReview = (
  review: {
    placeId: string;
    rating: number;
    text: string;
    photos: readonly string[];
    tags: readonly string[];
    nationality: string;
  },
  token?: string | null,
): Promise<CommunityReview> =>
  apiRequest('/api/v1/community/reviews', {
    method: 'POST',
    body: review,
    token,
  });

export const createCommunityPost = (
  post: CreateCommunityPostInput,
  token?: string | null,
): Promise<CommunityPost> =>
  apiRequest('/api/v1/community/posts', {
    method: 'POST',
    body: post,
    token,
  });

export const getPostComments = (
  postId: string,
  token?: string | null,
): Promise<{ comments: readonly CommunityComment[] }> =>
  apiRequest(`/api/v1/community/posts/${encodeURIComponent(postId)}/comments`, { token });

export const addPostComment = (
  postId: string,
  content: string,
  token?: string | null,
): Promise<CommunityComment> =>
  apiRequest(`/api/v1/community/posts/${encodeURIComponent(postId)}/comments`, {
    method: 'POST',
    body: { content },
    token,
  });

export const togglePostLike = (
  postId: string,
  token?: string | null,
): Promise<{ liked: boolean; count: number }> =>
  apiRequest(`/api/v1/community/posts/${encodeURIComponent(postId)}/like`, {
    method: 'POST',
    token,
  });

export const communityQueryKey = (page: CommunityPage) => ['community', page] as const;

export const useCommunityFeed = (
  page: CommunityPage,
  token?: string | null,
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => getCommunityFeed(page.filters, token),
    queryKey: communityQueryKey(page),
    staleTime: communityStaleTimeMs,
  });

export const usePostReviewMutation = (token?: string | null) =>
  useMutation({
    mutationFn: (review: {
      placeId: string;
      rating: number;
      text: string;
      photos: readonly string[];
      tags: readonly string[];
      nationality: string;
    }) => postReview(review, token),
  });

export const getCommunityPosts = (
  token?: string | null,
): Promise<{ posts: readonly CommunityPost[] }> =>
  apiRequest('/api/v1/community/posts', { token });

export const useCommunityPosts = (
  token?: string | null,
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    enabled: options.enabled ?? true,
    queryFn: () => getCommunityPosts(token),
    queryKey: ['community', 'posts'] as const,
    staleTime: communityStaleTimeMs,
  });
