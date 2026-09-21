import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';
import type { Request } from 'express';
import type { ApiResponse } from '../../shared/types';
import { getRequestId } from '../utils/request-id.util';

/**
 * Standardizes successful responses into a consistent envelope:
 * `{ success, statusCode, data, timestamp, requestId }`.
 *
 * Pass-through behavior:
 *  - Controllers returning raw data are wrapped in the envelope.
 *  - Controllers that already produced the envelope are augmented with
 *    a requestId and timestamp (when missing).
 *  - Empty bodies (status 204) are returned as `undefined`.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data: unknown) => {
        const ctx = context.switchToHttp();
        const response = ctx.getResponse<{ statusCode: number }>();
        const request = ctx.getRequest<Request>();
        const statusCode = response.statusCode ?? 200;
        const requestId = getRequestId(request);
        const now = new Date().toISOString();

        // Pass-through empty bodies (e.g. 204 No Content)
        if (data === undefined || data === null) {
          if (statusCode === 204) {
            return undefined;
          }
          return {
            success: true,
            statusCode,
            data: null,
            timestamp: now,
            requestId,
          };
        }

        if (this.isEnvelope(data)) {
          return {
            ...data,
            timestamp: data.timestamp ?? now,
            requestId: data.requestId ?? requestId,
          };
        }

        return {
          success: true,
          statusCode,
          data,
          timestamp: now,
          requestId,
        };
      }),
    );
  }

  private isEnvelope(value: unknown): value is ApiResponse<unknown> {
    return (
      typeof value === 'object' &&
      value !== null &&
      'success' in value &&
      'data' in value &&
      'statusCode' in value
    );
  }
}
