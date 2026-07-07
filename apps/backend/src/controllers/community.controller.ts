import { reviewCreateSchema } from '@traveling/shared';
import { z } from 'zod';
import {
  addPostComment,
  createCommunityReview,
  createCommunityPost,
  followTraveler,
  listPostComments,
  listCommunityReviews,
  listCommunityPosts,
  togglePostLike,
  createCommunityStory,
  listCommunityStories,
} from '../services/community.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { logUserActivity } from '../services/activity.service.js';

const filtersSchema = z.object({
  nationality: z.string().optional(),
  foodCategory: z.string().optional(),
  city: z.string().optional(),
});

const postCreateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
  imageUrl: z.string().trim().optional(),
  placeId: z.string().trim().min(1).optional(),
});

const commentCreateSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

const storyCreateSchema = z.object({
  imageUrl: z.string().trim().url(),
  caption: z.string().trim().max(500).optional(),
  placeId: z.string().trim().min(1).optional(),
});

const postIdParamSchema = z.object({
  id: z.string().trim().min(1),
});

const requireUserId = (userId: string | undefined, message: string): string => {
  if (!userId) {
    throw new AppError('UNAUTHORIZED', message, 401);
  }

  return userId;
};

export const getCommunityFeed = asyncHandler(async (req, res) => {
  const filters = filtersSchema.parse(req.query);
  const reviews = await listCommunityReviews(filters);
  sendSuccess(res, { reviews });
});

export const postCommunityReview = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to post a review.', 401);
  }
  const body = reviewCreateSchema.parse(req.body);
  const review = await createCommunityReview({
    userId: req.auth.userId,
    placeId: body.placeId,
    rating: body.rating,
    text: body.text,
    photos: body.photos,
    tags: body.tags,
    nationality: body.nationality,
  });
  await logUserActivity(req.auth.userId, 'post_review', { placeId: body.placeId });
  sendSuccess(res, review, 201);
});

export const postFollowTraveler = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to follow travelers.', 401);
  }
  const body = z.object({ userId: z.string().min(1) }).parse(req.body);
  const result = await followTraveler(req.auth.userId, body.userId);
  await logUserActivity(req.auth.userId, 'follow_user', { followedUserId: body.userId });
  sendSuccess(res, result);
});

export const postCommunityPost = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to create community posts.');
  const body = postCreateSchema.parse(req.body);
  const post = await createCommunityPost({
    clerkUserId,
    content: body.content,
    imageUrl: body.imageUrl,
    placeId: body.placeId,
  });
  await logUserActivity(clerkUserId, 'create_post', { contentSummary: body.content.slice(0, 50) });
  sendSuccess(res, post, 201);
});

export const getPostComments = asyncHandler(async (req, res) => {
  requireUserId(req.auth?.userId, 'Sign in to view community comments.');
  const params = postIdParamSchema.parse(req.params);
  const comments = await listPostComments(params.id);
  sendSuccess(res, { comments });
});

export const postPostComment = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to comment on community posts.');
  const params = postIdParamSchema.parse(req.params);
  const body = commentCreateSchema.parse(req.body);
  const comment = await addPostComment({
    clerkUserId,
    postId: params.id,
    content: body.content,
  });
  await logUserActivity(clerkUserId, 'add_comment', { postId: params.id });
  sendSuccess(res, comment, 201);
});

export const postTogglePostLike = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to react to community posts.');
  const params = postIdParamSchema.parse(req.params);
  const result = await togglePostLike(clerkUserId, params.id);
  await logUserActivity(clerkUserId, 'toggle_like', { postId: params.id });
  sendSuccess(res, result);
});

export const getCommunityPosts = asyncHandler(async (req, res) => {
  const posts = await listCommunityPosts(req.auth?.userId);
  sendSuccess(res, { posts });
});

export const getCommunityStories = asyncHandler(async (req, res) => {
  const stories = await listCommunityStories();
  sendSuccess(res, { stories });
});

export const postCommunityStory = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to create a story.');
  const body = storyCreateSchema.parse(req.body);
  const story = await createCommunityStory({
    clerkUserId,
    imageUrl: body.imageUrl,
    caption: body.caption,
    placeId: body.placeId,
  });
  await logUserActivity(clerkUserId, 'create_story', { placeId: body.placeId });
  sendSuccess(res, story, 201);
});
