import { reviewCreateSchema } from '@wanderai/shared';
import { z } from 'zod';
import {
  addPostComment,
  createCommunityReview,
  createCommunityPost,
  followTraveler,
  listPostComments,
  listCommunityReviews,
  togglePostLike,
} from '../services/community.service.js';
import { AppError } from '../utils/errors.js';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';

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
  sendSuccess(res, review, 201);
});

export const postFollowTraveler = asyncHandler(async (req, res) => {
  if (!req.auth?.userId) {
    throw new AppError('UNAUTHORIZED', 'Sign in to follow travelers.', 401);
  }
  const body = z.object({ userId: z.string().min(1) }).parse(req.body);
  const result = await followTraveler(req.auth.userId, body.userId);
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
  sendSuccess(res, comment, 201);
});

export const postTogglePostLike = asyncHandler(async (req, res) => {
  const clerkUserId = requireUserId(req.auth?.userId, 'Sign in to react to community posts.');
  const params = postIdParamSchema.parse(req.params);
  const result = await togglePostLike(clerkUserId, params.id);
  sendSuccess(res, result);
});
