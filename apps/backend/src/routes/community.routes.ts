import { Router } from 'express';
import {
  getCommunityFeed,
  getCommunityPosts,
  getPostComments,
  postCommunityReview,
  postCommunityPost,
  postFollowTraveler,
  postPostComment,
  postTogglePostLike,
  getCommunityStories,
  postCommunityStory,
} from '../controllers/community.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const communityRouter = Router();

communityRouter.get('/', getCommunityFeed);
communityRouter.get('/posts', getCommunityPosts);
communityRouter.post('/posts', requireAuth, postCommunityPost);
communityRouter.get('/posts/:id/comments', requireAuth, getPostComments);
communityRouter.post('/posts/:id/comments', requireAuth, postPostComment);
communityRouter.post('/posts/:id/like', requireAuth, postTogglePostLike);
communityRouter.post('/reviews', postCommunityReview);
communityRouter.post('/follow', postFollowTraveler);
communityRouter.get('/stories', getCommunityStories);
communityRouter.post('/stories', requireAuth, postCommunityStory);
