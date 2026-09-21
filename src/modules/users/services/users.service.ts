import * as argon2 from 'argon2';
import { Injectable } from '@nestjs/common';
import { UserRole, type User } from '@prisma/client';
import { ConflictException, NotFoundException } from '@/common/exceptions';
import { APP_CONSTANTS } from '@/shared/constants';
import { UsersRepository, type PaginatedUsers } from '../repositories/users.repository';
import type {
  ChangePasswordInput,
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserResponse,
} from '../schemas/users.schemas';
import type { AuthenticatedUser } from '../types/user.types';

/**
 * Domain service for user management. Encapsulates business rules
 * (password hashing, uniqueness checks, deletion semantics) and returns
 * public response shapes ready for HTTP transport.
 */
@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async create(input: CreateUserInput): Promise<UserResponse> {
    const existing = await this.repo.existsByEmail(input.email);
    if (existing) {
      throw new ConflictException('Email already registered', APP_CONSTANTS.ERROR_CODES.CONFLICT, {
        field: 'email',
      });
    }

    const hashed = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });

    const created = await this.repo.create({ ...input, password: hashed });
    return this.toResponse(created);
  }

  async list(query: ListUsersQuery): Promise<{
    items: UserResponse[];
    meta: {
      page: number;
      pageSize: number;
      totalItems: number;
      totalPages: number;
      hasNext: boolean;
      hasPrevious: boolean;
    };
  }> {
    const { items, total }: PaginatedUsers = await this.repo.list(query);
    const totalPages = Math.max(1, Math.ceil(total / query.pageSize));

    return {
      items,
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        totalItems: total,
        totalPages,
        hasNext: query.page < totalPages,
        hasPrevious: query.page > 1,
      },
    };
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found', APP_CONSTANTS.ERROR_CODES.NOT_FOUND);
    }
    return this.toResponse(user);
  }

  async update(id: string, input: UpdateUserInput): Promise<UserResponse> {
    await this.ensureExists(id);

    if (input.email) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const conflict = await this.repo.existsByEmail(input.email, id);
      if (conflict) {
        throw new ConflictException('Email already in use', APP_CONSTANTS.ERROR_CODES.CONFLICT, {
          field: 'email',
        });
      }
    }

    const updated = await this.repo.update(id, input);
    return this.toResponse(updated);
  }

  async changePassword(
    id: string,
    input: ChangePasswordInput,
    actor: { id: string; role: UserRole },
  ): Promise<void> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new NotFoundException('User not found', APP_CONSTANTS.ERROR_CODES.NOT_FOUND);
    }

    // A non-admin can only change their own password
    if (actor.id !== id && actor.role !== UserRole.ADMIN) {
      throw new NotFoundException('User not found', APP_CONSTANTS.ERROR_CODES.NOT_FOUND);
    }

    const valid = await argon2.verify(user.password, input.currentPassword);
    if (!valid) {
      throw new ConflictException('Current password is invalid', APP_CONSTANTS.ERROR_CODES.CONFLICT, {
        field: 'currentPassword',
      });
    }

    const hashed = await argon2.hash(input.newPassword, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16,
      timeCost: 3,
      parallelism: 1,
    });
    await this.repo.updatePassword(id, hashed);
  }

  async delete(id: string, actor: { id: string; role: UserRole }): Promise<void> {
    await this.ensureExists(id);
    if (actor.id === id) {
      throw new ConflictException(
        'You cannot delete your own account',
        APP_CONSTANTS.ERROR_CODES.CONFLICT,
      );
    }
    await this.repo.delete(id);
  }

  async findOneForAuth(email: string): Promise<AuthenticatedUser> {
    const user = await this.repo.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Credentials invalid', APP_CONSTANTS.ERROR_CODES.UNAUTHORIZED);
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
    };
  }

  async findRawByEmail(email: string) {
    return this.repo.findByEmail(email);
  }

  private async ensureExists(id: string): Promise<void> {
    const exists = await this.repo.findById(id);
    if (!exists) {
      throw new NotFoundException('User not found', APP_CONSTANTS.ERROR_CODES.NOT_FOUND);
    }
  }

  private toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
