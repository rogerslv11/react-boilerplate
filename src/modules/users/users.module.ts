import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersRepository } from './repositories';
import { UsersService } from './services';

@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
