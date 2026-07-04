import type { RequestHandler } from 'express';
import { v4 as uuid } from 'uuid';

export const correlationIdMiddleware: RequestHandler = (req, res, next) => {
  const incoming = req.header('x-correlation-id');
  req.correlationId = incoming && incoming.trim().length > 0 ? incoming : uuid();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
};
