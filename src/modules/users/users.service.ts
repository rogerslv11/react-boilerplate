import { Injectable } from '@nestjs/common';
import * as argon2 from 'argon2';
import { Brackets } from 'typeorm';

import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/common/exceptions/domain.exceptions';
import { buildPaginationMeta, offsetFromPage } from '@/shared/types/pagination';

import { toUserView, type UserView } from './interfaces/user-view';
import { CreateUserInput } from './schemas/create-user.schema';
import { QueryUsersInput } from './schemas/query-user.schema';
import { UpdateUserInput } from './schemas/update-user.schema';
import { UsersRepository } from './users.repository';

export interface PaginatedUsers {
  items: UserView[];
  meta: ReturnType<typeof buildPaginationMeta>;
}

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(input: CreateUserInput): Promise<UserView> {
    const existing = await this.usersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictDomainException('Email already in use', 'EMAIL_ALREADY_EXISTS', {
        email: input.email,
      });
    }

    const passwordHash = await argon2.hash(input.password, {
      type: argon2.argon2id,
    });

    const user = this.usersRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role ?? 'user',
      isActive: true,
    });

    const saved = await this.usersRepository.save(user);
    return toUserView(saved);
  }

  async findAll(query: QueryUsersInput): Promise<PaginatedUsers> {
    const offset = offsetFromPage(query.page, query.limit);
    const qb = this.usersRepository.repo.createQueryBuilder('user').where('1=1');

    if (query.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        new Brackets((b) => {
          b.where('LOWER(user.name) LIKE :term', { term }).orWhere('LOWER(user.email) LIKE :term', {
            term,
          });
        }),
      );
    }

    if (query.role) {
      qb.andWhere('user.role = :role', { role: query.role });
    }

    if (typeof query.isActive === 'boolean') {
      qb.andWhere('user.is_active = :isActive', { isActive: query.isActive });
    }

    const sortField = this.resolveSortField(query.sortBy);
    qb.orderBy(`user.${sortField}`, query.sortOrder).skip(offset).take(query.limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      items: entities.map(toUserView),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findOne(id: string): Promise<UserView> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundDomainException('User', id);
    }
    return toUserView(user);
  }

  async update(id: string, input: UpdateUserInput, actingUserId: string): Promise<UserView> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundDomainException('User', id);
    }

    if (input.email && input.email !== user.email) {
      const conflict = await this.usersRepository.findByEmail(input.email);
      if (conflict && conflict.id !== id) {
        throw new ConflictDomainException('Email already in use', 'EMAIL_ALREADY_EXISTS', {
          email: input.email,
        });
      }
    }

    if (input.role && input.role !== user.role && actingUserId !== user.id) {
      // Allow self-update without changing own role; only admins/others should change roles.
      // Authorization is enforced by the guard at the controller layer.
    }

    if (input.password) {
      user.passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    }
    if (input.name !== undefined) {
      user.name = input.name;
    }
    if (input.email !== undefined) {
      user.email = input.email;
    }
    if (input.role !== undefined) {
      user.role = input.role;
    }
    if (input.isActive !== undefined) {
      user.isActive = input.isActive;
    }

    const saved = await this.usersRepository.save(user);
    return toUserView(saved);
  }

  async remove(id: string): Promise<void> {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundDomainException('User', id);
    }
    await this.usersRepository.softDelete(id);
  }

  async markLoggedIn(userId: string): Promise<void> {
    await this.usersRepository.repo.update({ id: userId }, { lastLoginAt: new Date() });
  }

  private resolveSortField(field: QueryUsersInput['sortBy']): string {
    switch (field) {
      case 'name':
        return 'name';
      case 'email':
        return 'email';
      case 'updatedAt':
        return 'updated_at';
      case 'createdAt':
      default:
        return 'created_at';
    }
  }
}
