import { discoverRequestSchema } from '@traveling/shared';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { discoverPlaces } from '../services/recommendation.service.js';
import { logUserActivity } from '../services/activity.service.js';

export const postDiscover = asyncHandler(async (req, res) => {
  const userId = req.auth!.userId;
  await checkAndIncrementUsage(userId, 'discover');
  
  const body = discoverRequestSchema.parse(req.body);
  const data = await discoverPlaces({
    ...body,
    userId,
  });
  
  await logUserActivity(userId, 'discover_search', {
    query: body.query,
    lat: body.lat,
    lng: body.lng,
  });
  
  sendSuccess(res, data);
});
