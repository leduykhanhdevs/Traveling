import rateLimit from 'express-rate-limit';
import { AppError, toErrorResponse } from '../utils/errors.js';

import RedisStore from 'rate-limit-redis';
import { redis } from '../services/redis.service.js';

export const apiRateLimiter = rateLimit({
  legacyHeaders: false,
  limit: (req) => (req.auth?.userId ? 300 : 60),
  standardHeaders: 'draft-7',
  windowMs: 60 * 1000,
  store: new RedisStore({
    sendCommand: async (...args: string[]) => {
      const reply = await redis.call(args[0]!, ...args.slice(1));
      return reply as unknown as import('rate-limit-redis').RedisReply;
    },
  }),
  keyGenerator: (req) => req.auth?.userId ?? req.ip ?? 'unknown',
  handler: (_req, res) => {
    const error = new AppError('RATE_LIMITED', 'Too many requests. Please retry in a minute.', 429);
    res.status(error.statusCode).json(toErrorResponse(error));
  },
});
