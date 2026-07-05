import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { AppError } from '../utils/errors.js';
import {
  logUserActivity,
  getUserActivities,
  trackViewedPlace,
  getViewedPlaces,
} from '../services/activity.service.js';

export const postLogActivity = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { action, details } = req.body;
  if (!action) {
    throw new AppError('BAD_REQUEST', 'Action is required.', 400);
  }

  await logUserActivity(userId, action, details);
  sendSuccess(res, { success: true });
});

export const getActivityHistory = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
  const history = await getUserActivities(userId, limit);
  sendSuccess(res, history);
});

export const postTrackViewed = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const { placeId, name, address, lat, lng, emoji } = req.body;
  if (!placeId || !name) {
    throw new AppError('BAD_REQUEST', 'placeId and name are required.', 400);
  }

  await trackViewedPlace(userId, { placeId, name, address, lat, lng, emoji });
  // Also log it as an activity!
  await logUserActivity(userId, 'view_place', { placeId, name });
  
  sendSuccess(res, { success: true });
});

export const getViewedHistory = asyncHandler(async (req, res) => {
  const userId = req.auth?.userId;
  if (!userId) {
    throw new AppError('UNAUTHORIZED', 'Authentication required.', 401);
  }

  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
  const viewed = await getViewedPlaces(userId, limit);
  sendSuccess(res, viewed);
});
