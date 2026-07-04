import { verifyToken } from '@clerk/backend';
import type { RequestHandler } from 'express';
import { env } from '../config/env.js';
import { AppError } from '../utils/errors.js';

const getBearerToken = (header: string | undefined): string | null => {
  if (!header?.startsWith('Bearer ')) {
    return null;
  }

  return header.slice('Bearer '.length).trim();
};

const authenticate = async (
  authorizationHeader: string | undefined,
): Promise<{ userId: string; sessionId?: string }> => {
  const token = getBearerToken(authorizationHeader);

  if (!token) {
    throw new AppError('UNAUTHORIZED', 'Missing bearer token.', 401);
  }

  const payload = await verifyToken(token, {
    secretKey: env.CLERK_SECRET_KEY,
  });

  if (!payload.sub) {
    throw new AppError('UNAUTHORIZED', 'Invalid Clerk token subject.', 401);
  }

  const sessionId = typeof payload.sid === 'string' ? payload.sid : undefined;
  return { userId: payload.sub, sessionId };
};

export const requireAuth: RequestHandler = async (req, _res, next) => {
  try {
    req.auth = await authenticate(req.header('authorization'));
    next();
  } catch (error) {
    next(error);
  }
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    const token = getBearerToken(req.header('authorization'));
    if (token) {
      req.auth = await authenticate(req.header('authorization'));
    }
    next();
  } catch {
    next();
  }
};
