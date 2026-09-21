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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ZodValidationPipe } from '@/common/pipes/zod-validation.pipe';
import {
  ApiZodBody,
  ApiZodQuery,
  ApiZodResponse,
} from '@/common/decorators/zod-swagger.decorators';
import { CurrentUser, type AuthUser } from '@/common/decorators/user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { UsersService } from './services/users.service';
import {
  ChangePasswordSchema,
  CreateUserSchema,
  ListUsersQuerySchema,
  UpdateUserSchema,
  UserResponseSchema,
  type ChangePasswordInput,
  type CreateUserInput,
  type ListUsersQuery,
  type UpdateUserInput,
  type UserResponse,
} from './schemas/users.schemas';

@ApiTags('Users')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (admin only)' })
  @ApiZodBody({ schema: CreateUserSchema, description: 'Payload to create a new user' })
  @ApiZodResponse({ schema: UserResponseSchema, status: 201, description: 'User created' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async create(
    @Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserInput,
  ): Promise<UserResponse> {
    return this.usersService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'List users with pagination (admin only)' })
  @ApiZodQuery({ schema: ListUsersQuerySchema })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async list(
    @Query(new ZodValidationPipe(ListUsersQuerySchema)) query: ListUsersQuery,
  ): ReturnType<UsersService['list']> {
    return this.usersService.list(query);
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  @ApiZodResponse({ schema: UserResponseSchema, description: 'Authenticated user profile' })
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthUser): Promise<UserResponse> {
    return this.usersService.findById(user.sub);
  }

  @Get(':id')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodResponse({ schema: UserResponseSchema })
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string): Promise<UserResponse> {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodBody({ schema: UpdateUserSchema })
  @ApiZodResponse({ schema: UserResponseSchema })
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateUserSchema)) body: UpdateUserInput,
  ): Promise<UserResponse> {
    return this.usersService.update(id, body);
  }

  @Patch(':id/password')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Change a user password' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiZodBody({ schema: ChangePasswordSchema })
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ChangePasswordSchema)) body: ChangePasswordInput,
    @CurrentUser() actor: AuthUser,
  ): Promise<void> {
    await this.usersService.changePassword(id, body, {
      id: actor.sub,
      role: actor.role as UserRole,
    });
  }

  @Delete(':id')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser() actor: AuthUser): Promise<void> {
    await this.usersService.delete(id, {
      id: actor.sub,
      role: actor.role as UserRole,
    });
  }
}
