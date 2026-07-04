import type { ApiResponse } from '@traveling/shared';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiClientError extends Error {
  public readonly code: string;
  public readonly details?: unknown;

  public constructor(code: string, message: string, details?: unknown) {
    super(message);
    this.code = code;
    this.details = details;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
};

export const apiRequest = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
  try {
    const response = await fetch(`${apiUrl}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const json = (await response.json()) as ApiResponse<T>;
    if (!response.ok || !json.success) {
      const message = json.success ? 'Request failed.' : json.error.message;
      const code = json.success ? 'REQUEST_FAILED' : json.error.code;
      const details = json.success ? undefined : json.error.details;
      throw new ApiClientError(code, message, details);
    }
    return json.data;
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error;
    }
    throw new ApiClientError('NETWORK_ERROR', 'Unable to reach Traveling services.', error);
  }
};
