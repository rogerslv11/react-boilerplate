import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { map, Observable } from 'rxjs';

import type { PaginatedResponse, SuccessResponse } from '../contracts/response.contract';

@Injectable()
export class ResponseTransformInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (data === null || data === undefined) {
          return { data: null };
        }
        if (typeof data === 'object' && 'meta' in (data as object)) {
          const paginated = data as { items?: unknown[]; data?: unknown[]; meta: unknown };
          return {
            data: paginated.data ?? paginated.items ?? [],
            meta: paginated.meta as PaginatedResponse<unknown>['meta'],
          } satisfies PaginatedResponse<unknown>;
        }
        return { data } as SuccessResponse<unknown>;
      }),
    );
  }
}
