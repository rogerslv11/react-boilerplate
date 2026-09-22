import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
  type AxiosRequestConfig,
} from 'axios';
import { toast } from 'sonner';

import { env } from './env';

const DEFAULT_ERROR_MESSAGE = 'An unexpected error occurred. Please try again.';
const NETWORK_ERROR_MESSAGE = 'Network error. Check your connection and try again.';

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  status?: number;
}

export type ApiError = AxiosError<ApiErrorPayload>;

export interface RequestOptions extends AxiosRequestConfig {
  silent?: boolean;
}

function createApiErrorPayload(error: AxiosError, silent?: boolean): ApiErrorPayload {
  const status = error.response?.status;
  const data = error.response?.data;

  if (error.code === 'ERR_CANCELED') {
    return { code: 'CANCELED', message: 'Request canceled', status };
  }

  if (!error.response) {
    if (!silent) toast.error(NETWORK_ERROR_MESSAGE);
    return { code: 'NETWORK_ERROR', message: NETWORK_ERROR_MESSAGE };
  }

  if (status === 401) {
    if (!silent) toast.error('Your session has expired. Please sign in again.');
    return { code: 'UNAUTHORIZED', message: 'Unauthorized', status };
  }

  if (status === 403) {
    if (!silent) toast.error('You do not have permission to perform this action.');
    return { code: 'FORBIDDEN', message: 'Forbidden', status };
  }

  if (status === 404) {
    return { code: 'NOT_FOUND', message: 'Resource not found', status };
  }

  if (status && status >= 500) {
    if (!silent) toast.error('Server error. Please try again later.');
    return { code: 'SERVER_ERROR', message: 'Server error', status };
  }

  const message =
    (typeof data === 'object' &&
    data !== null &&
    'message' in data &&
    typeof data.message === 'string'
      ? data.message
      : undefined) ??
    error.message ??
    DEFAULT_ERROR_MESSAGE;

  return {
    code:
      typeof data === 'object' && data !== null && 'code' in data && typeof data.code === 'string'
        ? data.code
        : `HTTP_${status ?? 'UNKNOWN'}`,
    message,
    status,
    details:
      typeof data === 'object' && data !== null ? (data as Record<string, unknown>) : undefined,
  };
}

export const api: AxiosInstance = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: env.VITE_API_TIMEOUT,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = sessionStorage.getItem(env.VITE_AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const silent = (error.config as RequestOptions | undefined)?.silent;
    const payload = createApiErrorPayload(error, silent);

    if (payload.code === 'UNAUTHORIZED') {
      sessionStorage.removeItem(env.VITE_AUTH_TOKEN_KEY);
      sessionStorage.removeItem(env.VITE_AUTH_REFRESH_KEY);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    const wrapped = new Error(payload.message) as Error & { apiError: ApiErrorPayload };
    wrapped.apiError = payload;
    return Promise.reject(wrapped);
  },
);

export function getApiError(error: unknown): ApiErrorPayload {
  if (error instanceof Error && 'apiError' in error) {
    return (error as Error & { apiError: ApiErrorPayload }).apiError;
  }
  return { code: 'UNKNOWN', message: DEFAULT_ERROR_MESSAGE };
}
