import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from './users.entity';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findById(id: string, includeDeleted = false): Promise<User | null> {
    const options: { where: { id: string }; withDeleted?: boolean } = { where: { id } };
    if (includeDeleted) {
      options.withDeleted = true;
    }
    return this.repository.findOne(options);
  }

  findByEmail(email: string, includeDeleted = false): Promise<User | null> {
    const options: { where: { email: string }; withDeleted?: boolean } = {
      where: { email: email.toLowerCase() },
    };
    if (includeDeleted) {
      options.withDeleted = true;
    }
    return this.repository.findOne(options);
  }

  findByIdActive(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id, isActive: true } });
  }

  create(data: Partial<User>): User {
    return this.repository.create(data);
  }

  save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  findAndCount(
    options: Parameters<Repository<User>['findAndCount']>[0],
  ): Promise<[User[], number]> {
    return this.repository.findAndCount(options);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete({ id });
  }

  async hardDelete(id: string): Promise<void> {
    await this.repository.delete({ id });
  }

  get repo(): Repository<User> {
    return this.repository;
  }
}
