import rateLimit from 'express-rate-limit';
import { AppError, toErrorResponse } from '../utils/errors.js';

export const apiRateLimiter = rateLimit({
  legacyHeaders: false,
  limit: (req) => (req.auth?.userId ? 300 : 60),
  standardHeaders: 'draft-7',
  windowMs: 60 * 1000,
  keyGenerator: (req) => req.auth?.userId ?? req.ip ?? 'unknown',
  handler: (_req, res) => {
    const error = new AppError('RATE_LIMITED', 'Too many requests. Please retry in a minute.', 429);
    res.status(error.statusCode).json(toErrorResponse(error));
  },
});
