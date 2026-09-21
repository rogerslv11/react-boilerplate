import { randomUUID } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { Params } from 'nestjs-pino';

export interface LoggerOptions {
  level: string;
  isProduction: boolean;
}

@Injectable()
export class AppLogger {
  static forRoot(options: LoggerOptions): Params {
    return {
      pinoHttp: {
        level: options.level,
        genReqId: (req, res) => {
          const headerId =
            (req.headers['x-request-id'] as string | undefined) ??
            (req.headers['x-correlation-id'] as string | undefined);
          const id = headerId ?? randomUUID();
          if (res && typeof (res as { setHeader?: unknown }).setHeader === 'function') {
            (res as { setHeader: (k: string, v: string) => void }).setHeader('x-request-id', id);
          }
          return id;
        },
        transport: options.isProduction
          ? undefined
          : {
              target: 'pino-pretty',
              options: {
                singleLine: false,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname,req.headers,res.headers',
                errorLikeObjectKey: 'err',
                messageFormat: '{reqId} {context} {msg}',
              },
            },
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.currentPassword',
            'req.body.newPassword',
            'res.headers["set-cookie"]',
            '*.password',
            '*.token',
            '*.refreshToken',
          ],
          censor: '[REDACTED]',
        },
        customLogLevel: (req, res, err) => {
          if (err || res.statusCode >= 500) return 'error';
          if (res.statusCode >= 400) return 'warn';
          return 'info';
        },
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            remoteAddress: req.remoteAddress,
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    };
  }
}
