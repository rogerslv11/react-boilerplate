import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { DatabaseConfig } from '@/config/database.config';
import { RefreshToken } from '@/modules/auth/refresh-token.entity';
import { User } from '@/modules/users/users.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const db = configService.getOrThrow<DatabaseConfig>('database');
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          entities: [User, RefreshToken],
          migrations: [__dirname + '/migrations/*.{ts,js}'],
          migrationsRun: db.migrationsRun,
          synchronize: db.synchronize,
          logging: db.logging,
          poolSize: db.poolMax,
          autoLoadEntities: false,
          retryAttempts: 5,
          retryDelay: 3000,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
