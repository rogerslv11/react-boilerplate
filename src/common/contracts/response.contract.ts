import type { PaginationMeta } from '@/shared/types/pagination';

export interface SuccessResponse<T> {
  data: T;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ErrorResponseBody {
  statusCode: number;
  error: string;
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
  timestamp: string;
  path?: string;
}
