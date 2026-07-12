import type { ApiFailure } from '@traveling/shared';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: unknown;

  public constructor(code: string, message: string, statusCode = 500, details?: unknown) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const toErrorResponse = (error: AppError): ApiFailure => ({
  success: false,
  error: {
    code: error.code,
    message: error.message,
    details: error.details,
  },
});

export const normalizeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
  }

  return new AppError('INTERNAL_ERROR', 'An unexpected error occurred.', 500);
};
