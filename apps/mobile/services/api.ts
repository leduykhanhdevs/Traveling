import type { ApiResponse } from '@traveling/shared';

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
const developmentApiUrl = 'http://localhost:4000';

export const getApiBaseUrl = (): string => {
  const value =
    configuredApiUrl || (__DEV__ || process.env.NODE_ENV === 'test' ? developmentApiUrl : '');
  if (!value) {
    throw new ApiClientError(
      'API_NOT_CONFIGURED',
      'Traveling services are not configured for this build.',
    );
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new ApiClientError('INVALID_API_URL', 'Traveling services are misconfigured.');
  }

  if (!__DEV__ && parsed.protocol !== 'https:') {
    throw new ApiClientError(
      'INSECURE_API_URL',
      'Traveling services require a secure connection.',
    );
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new ApiClientError('INVALID_API_URL', 'Traveling services are misconfigured.');
  }

  return value.replace(/\/$/, '');
};

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: unknown;
  public readonly status?: number;

  public constructor(code: string, message: string, details?: unknown, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

type AuthTokenProvider = (skipCache: boolean) => Promise<string | null>;

let authTokenProvider: AuthTokenProvider | null = null;

export const setApiAuthTokenProvider = (provider: AuthTokenProvider | null): void => {
  authTokenProvider = provider;
};

const performRequest = async <T>(
  path: string,
  options: RequestOptions,
  token: string | null | undefined,
): Promise<{ data?: T; error?: ApiClientError; status: number }> => {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const json = (await response.json()) as ApiResponse<T>;
  if (!response.ok || !json.success) {
    const message = json.success ? 'Request failed.' : json.error.message;
    const code = json.success ? 'REQUEST_FAILED' : json.error.code;
    const details = json.success ? undefined : json.error.details;
    return {
      error: new ApiClientError(code, message, details, response.status),
      status: response.status,
    };
  }
  return { data: json.data, status: response.status };
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  if (!path.startsWith('/')) {
    throw new ApiClientError('INVALID_API_PATH', 'Traveling services are misconfigured.');
  }

  try {
    const firstResult = await performRequest<T>(path, options, options.token);
    if (firstResult.status === 401 && options.token && authTokenProvider) {
      const refreshedToken = await authTokenProvider(true);
      if (refreshedToken && refreshedToken !== options.token) {
        const retryResult = await performRequest<T>(path, options, refreshedToken);
        if (retryResult.error) {
          throw retryResult.error;
        }
        return retryResult.data as T;
      }
    }

    if (firstResult.error) {
      throw firstResult.error;
    }
    return firstResult.data as T;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError('NETWORK_ERROR', 'Unable to reach Traveling services.', error);
  }
};
