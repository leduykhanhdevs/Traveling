import { AppError } from '../utils/errors.js';
import { logUnknownError } from '../utils/logger.js';

export const fetchJson = async <T>(
  url: string | URL,
  init: RequestInit | undefined,
  serviceName: string,
): Promise<T> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  const abortFromCaller = (): void => controller.abort();
  init?.signal?.addEventListener('abort', abortFromCaller, { once: true });

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    });
    const text = await response.text();

    if (!response.ok) {
      logUnknownError(`${serviceName} returned an error response`, new Error('Upstream error'), {
        status: response.status,
      });
      throw new AppError('UPSTREAM_ERROR', `${serviceName} request failed.`, 502);
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
  } finally {
    clearTimeout(timeout);
    init?.signal?.removeEventListener('abort', abortFromCaller);
  }
};
