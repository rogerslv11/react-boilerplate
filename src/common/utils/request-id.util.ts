import { randomUUID } from 'node:crypto';
import type { Request } from 'express';

/** Conventional header used to propagate the request id. */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Retrieve (or generate) the correlation/request id for the current request.
 * Surfaces already populated by upstream proxies are honored.
 */
export function getRequestId(req: Request): string {
  const fromHeader = req.headers[REQUEST_ID_HEADER];
  if (typeof fromHeader === 'string' && fromHeader.length > 0) {
    return fromHeader;
  }
  if (Array.isArray(fromHeader) && fromHeader.length > 0 && fromHeader[0]) {
    return fromHeader[0];
  }
  return randomUUID();
}
