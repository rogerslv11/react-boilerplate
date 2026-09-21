import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { z } from 'zod';

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptime: z.number(),
  timestamp: z.string(),
  database: z.object({
    status: z.enum(['up', 'down']),
    latencyMs: z.number().optional(),
    error: z.string().optional(),
  }),
  environment: z.string(),
  version: z.string(),
});

export class HealthResponseDto {
  public status!: 'ok' | 'degraded';
  public uptime!: number;
  public timestamp!: string;
  public database!: { status: 'up' | 'down'; latencyMs?: number; error?: string };
  public environment!: string;
  public version!: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  @ApiOperation({ summary: 'Liveness + readiness probe (DB check)' })
  async check(): Promise<HealthResponseDto> {
    const dbCheck = await this.checkDatabase();
    const status: 'ok' | 'degraded' = dbCheck.status === 'up' ? 'ok' : 'degraded';
    return {
      status,
      uptime: Math.round((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      database: dbCheck,
      environment: process.env.NODE_ENV ?? 'development',
      version: process.env.npm_package_version ?? '1.0.0',
    };
  }

  private async checkDatabase(): Promise<{
    status: 'up' | 'down';
    latencyMs?: number;
    error?: string;
  }> {
    const started = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up', latencyMs: Date.now() - started };
    } catch (error) {
      return {
        status: 'down',
        error: error instanceof Error ? error.message : 'unknown',
      };
    }
  }
}
