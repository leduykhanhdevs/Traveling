import type { RequestHandler } from 'express';
import { v4 as uuid } from 'uuid';

export const correlationIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-correlation-id');
  const normalized = incoming?.trim();
  req.correlationId =
    normalized && /^[a-zA-Z0-9._-]{1,64}$/.test(normalized) ? normalized : uuid();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};
