import { AppError } from '../utils/errors.js';
import { logUnknownError } from '../utils/logger.js';

export const fetchJson = async <T>(
  url: string | URL,
  init: RequestInit | undefined,
  serviceName: string,
): Promise<T> => {
  try {
    const response = await fetch(url, init);
    const text = await response.text();

    if (!response.ok) {
      throw new AppError('UPSTREAM_ERROR', `${serviceName} request failed.`, response.status, {
        status: response.status,
        body: text.slice(0, 600),
      });
    }

    if (text.trim().length === 0) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    logUnknownError(`${serviceName} request failed`, error);
    throw new AppError('UPSTREAM_ERROR', `${serviceName} is unavailable.`, 502);
  }
};
