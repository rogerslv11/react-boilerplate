import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '@/common/decorators/request.decorators';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import type { RequestUser } from '@/shared/contracts/auth.contract';

import { CreateUserDto } from './schemas/create-user.schema';
import { IdParamDto } from './schemas/id-param.schema';
import { QueryUsersDto } from './schemas/query-user.schema';
import { UpdateUserDto } from './schemas/update-user.schema';
import { UsersService, type PaginatedUsers } from './users.service';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users.dto';
import type { UserView } from './interfaces/user-view';

@ApiTags('users')
@ApiBearerAuth('bearer')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  create(@Body() body: CreateUserDto): Promise<UserView> {
    return this.usersService.create(body);
  }

  @Get()
  @Roles('admin')
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  @ApiOperation({ summary: 'List users (admin only)' })
  findAll(@Query() query: QueryUsersDto): Promise<PaginatedUsers> {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiOperation({ summary: 'Get user by id (admin only)' })
  findOne(@Param() params: IdParamDto): Promise<UserView> {
    return this.usersService.findOne(params.id);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiOperation({ summary: 'Update user (admin only)' })
  update(
    @Param() params: IdParamDto,
    @Body() body: UpdateUserDto,
    @CurrentUser() actor: RequestUser,
  ): Promise<UserView> {
    return this.usersService.update(params.id, body, actor.id);
  }

  @Delete(':id')
  @Roles('admin')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'User deleted (soft delete)' })
  @ApiOperation({ summary: 'Soft delete user (admin only)' })
  async remove(@Param() params: IdParamDto): Promise<void> {
    await this.usersService.remove(params.id);
  }
}
