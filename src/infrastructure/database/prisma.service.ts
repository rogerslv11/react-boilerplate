import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/**
 * Centralized Prisma service. Owns the PrismaClient lifecycle:
 *  - Connects on module init (warms the pool)
 *  - Disconnects cleanly on application shutdown
 *  - Exposes the `Prisma` namespace for typed error handling
 *
 * Modules should consume the generated client through this service
 * (or a dedicated repository) rather than instantiating their own.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({ log: PrismaService.buildLogLevels() });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Prisma connected to the database');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error as Error);
      throw error;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma disconnected from the database');
  }

  private static buildLogLevels(): Prisma.LogLevel[] {
    const level = (process.env.DATABASE_LOG_LEVEL ?? 'warn').toLowerCase();
    const allowed: Prisma.LogLevel[] = ['info', 'query', 'warn', 'error'];
    return allowed.includes(level as Prisma.LogLevel) ? [level as Prisma.LogLevel] : ['warn'];
  }
}
