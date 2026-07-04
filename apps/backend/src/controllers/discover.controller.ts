import { discoverRequestSchema } from '@traveling/shared';
import { asyncHandler } from '../utils/async-handler.js';
import { sendSuccess } from '../utils/http-response.js';
import { discoverPlaces } from '../services/recommendation.service.js';

export const postDiscover = asyncHandler(async (req, res) => {
  const body = discoverRequestSchema.parse(req.body);
  const data = await discoverPlaces({
    ...body,
    userId: req.auth?.userId ?? body.userId,
  });
  sendSuccess(res, data);
});
