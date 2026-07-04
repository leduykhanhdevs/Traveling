import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError, normalizeError, toErrorResponse } from '../utils/errors.js';
import { logUnknownError } from '../utils/logger.js';

export const notFoundHandler: ErrorRequestHandler = (error, _req, _res, next) => {
  next(error);
};

export const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const appError =
    error instanceof ZodError
      ? new AppError('VALIDATION_ERROR', 'Request validation failed.', 400, error.flatten())
      : normalizeError(error);

  if (appError.statusCode >= 500) {
    logUnknownError('Request failed', error, {
      correlationId: req.correlationId,
      path: req.path,
    });
  }

  res.status(appError.statusCode).json(toErrorResponse(appError));
};
