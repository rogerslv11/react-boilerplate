/**
 * Global constants used across the application.
 */
export const APP_CONSTANTS = {
  /** Default pagination values */
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  /** Stable, machine-readable error codes returned in API responses. */
  ERROR_CODES: {
    VALIDATION: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    CONFLICT: 'CONFLICT',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    INTERNAL: 'INTERNAL_SERVER_ERROR',
    BAD_REQUEST: 'BAD_REQUEST',
    THROTTLE: 'TOO_MANY_REQUESTS',
  },
} as const;

export type AppConstants = typeof APP_CONSTANTS;
