import { Router } from 'express';
import {
  postLogActivity,
  getActivityHistory,
  postTrackViewed,
  getViewedHistory,
} from '../controllers/activity.controller.js';
import { requireAuth } from '../middleware/auth.js';

export const activityRouter = Router();

activityRouter.use(requireAuth);
activityRouter.post('/log', postLogActivity);
activityRouter.get('/history', getActivityHistory);
activityRouter.post('/viewed', postTrackViewed);
activityRouter.get('/viewed/history', getViewedHistory);
