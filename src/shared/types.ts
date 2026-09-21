/**
 * API response wrappers. The application returns these consistent
 * shapes for all successful and error responses.
 */

/** Successful response envelope (200 / 201 / 204). */
export interface ApiResponse<T = unknown> {
  success: true;
  statusCode: number;
  data: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/** Paginated items envelope returned by list endpoints. */
export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

/** Single standardized error field description. */
export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

/** Error response envelope produced by the global exception filter. */
export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  error: string;
  message: string;
  code?: string;
  errors?: ApiErrorDetail[];
  path?: string;
  timestamp: string;
  requestId?: string;
}
