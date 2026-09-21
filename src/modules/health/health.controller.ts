import { Controller, Get } from '@nestjs/common';
import {
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@/infrastructure/database/prisma.service';

@ApiTags('Health')
@Controller({ path: 'health', version: '1' })
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Application liveness + database connectivity' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaService),
    ]);
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Process liveness probe' })
  liveness(): { status: string; uptime: number; timestamp: string } {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe (database reachable)' })
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.pingCheck('database', this.prismaService),
    ]);
  }
}
