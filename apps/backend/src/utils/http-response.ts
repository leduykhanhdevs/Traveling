import type { ApiSuccess } from '@traveling/shared';
import type { Response } from 'express';

export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  const response: ApiSuccess<T> = {
    success: true,
    data,
  };

  res.status(statusCode).json(response);
};
