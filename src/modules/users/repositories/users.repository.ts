import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import type {
  CreateUserInput,
  ListUsersQuery,
  UpdateUserInput,
  UserResponse,
} from '../schemas/users.schemas';
import type { UserWithPassword } from '../types/user.types';

export interface PaginatedUsers {
  items: UserResponse[];
  total: number;
}

/**
 * Persistence layer for the User aggregate.
 *
 * The repository owns the SQL/Prisma queries and keeps services free
 * of persistence details. Methods are intentionally narrow — adding
 * shapes not actually used by the domain is avoided.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateUserInput & { password: string }): Promise<UserWithPassword> {
    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: data.password,
        role: data.role,
        status: data.status,
      },
    });
  }

  async findById(id: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserWithPassword | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async update(id: string, data: UpdateUserInput): Promise<UserWithPassword> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { password: hashedPassword } });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const found = await this.prisma.user.findFirst({
      where: { email, NOT: excludeId ? { id: excludeId } : undefined },
      select: { id: true },
    });
    return Boolean(found);
  }

  async list(query: ListUsersQuery): Promise<PaginatedUsers> {
    const { page, pageSize, sortBy, sortOrder, search, role, status } = query;

    const where: Prisma.UserWhereInput = {
      deletedAt: null,
      ...(role ? { role } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const orderBy: Prisma.UserOrderByWithRelationInput = sortBy
      ? { [sortBy]: sortOrder }
      : { createdAt: 'desc' };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      items: items.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt.toISOString(),
        updatedAt: u.updatedAt.toISOString(),
      })),
      total,
    };
  }
}
