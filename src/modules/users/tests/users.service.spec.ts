import {
  ConflictDomainException,
  NotFoundDomainException,
} from '@/common/exceptions/domain.exceptions';
import { UsersService } from '../users.service';
import type { UsersRepository } from '../users.repository';
import type { User } from '../users.entity';
import type { CreateUserInput, UpdateUserInput } from '../schemas';

const buildUser = (
  overrides: Partial<{
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    isActive: boolean;
  }> = {},
): User => ({
  id: '0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d',
  name: 'Jane',
  email: 'jane@example.com',
  passwordHash: 'hash',
  role: 'user',
  isActive: true,
  lastLoginAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  ...overrides,
});

type RepoMock = UsersRepository & {
  findById: jest.Mock;
  findByEmail: jest.Mock;
  findByIdActive: jest.Mock;
  create: jest.Mock;
  save: jest.Mock;
  findAndCount: jest.Mock;
  softDelete: jest.Mock;
  hardDelete: jest.Mock;
  repo: {
    createQueryBuilder: jest.Mock;
    update: jest.Mock;
  };
};

const buildRepo = (): RepoMock => {
  const qb = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[buildUser()], 1]),
  };
  const repoMock = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findByIdActive: jest.fn(),
    create: jest.fn((data: Partial<User>) => ({ ...buildUser(), ...data })),
    save: jest.fn(async (u: User) => u),
    findAndCount: jest.fn(),
    softDelete: jest.fn(),
    hardDelete: jest.fn(),
    repo: {
      createQueryBuilder: jest.fn(() => qb),
      update: jest.fn(),
    },
  };
  return repoMock as unknown as RepoMock;
};

describe('UsersService', () => {
  let service: UsersService;
  let repo: RepoMock;

  beforeEach(() => {
    repo = buildRepo();
    service = new UsersService(repo);
  });

  describe('create', () => {
    it('throws on duplicate email', async () => {
      repo.findByEmail.mockResolvedValue(buildUser());
      const input: CreateUserInput = {
        name: 'Jane',
        email: 'jane@example.com',
        password: 'secret123',
      };
      await expect(service.create(input)).rejects.toBeInstanceOf(ConflictDomainException);
      expect(repo.save).not.toHaveBeenCalled();
    });

    it('creates a user with hashed password', async () => {
      repo.findByEmail.mockResolvedValue(null);
      const input: CreateUserInput = {
        name: 'Jane',
        email: 'jane@example.com',
        password: 'secret123',
      };
      const result = await service.create(input);
      expect(result.email).toBe('jane@example.com');
      expect(result.role).toBe('user');
      expect(repo.save).toHaveBeenCalled();
      const savedArg = repo.save.mock.calls[0][0];
      expect(savedArg.passwordHash).not.toBe(input.password);
    });
  });

  describe('findOne', () => {
    it('throws when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne('0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d')).rejects.toBeInstanceOf(
        NotFoundDomainException,
      );
    });

    it('returns a user view when found', async () => {
      repo.findById.mockResolvedValue(buildUser());
      const result = await service.findOne('0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d');
      expect(result.id).toBeDefined();
      expect(result.email).toBe('jane@example.com');
    });
  });

  describe('update', () => {
    it('rejects when user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(
        service.update('0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d', { name: 'X' }, 'actor-id'),
      ).rejects.toBeInstanceOf(NotFoundDomainException);
    });

    it('updates name and rehashes password when provided', async () => {
      const existing = buildUser();
      repo.findById.mockResolvedValue(existing);
      repo.findByEmail.mockResolvedValue(null);
      const payload: UpdateUserInput = { name: 'New Name', password: 'newpass123' };
      await service.update(existing.id, payload, 'actor');
      expect(existing.name).toBe('New Name');
      expect(existing.passwordHash).not.toBe('newpass123');
    });

    it('throws on duplicate email', async () => {
      const existing = buildUser();
      repo.findById.mockResolvedValue(existing);
      repo.findByEmail.mockResolvedValue(buildUser({ id: 'other-id' }));
      await expect(
        service.update(existing.id, { email: 'other@example.com' }, 'actor'),
      ).rejects.toBeInstanceOf(ConflictDomainException);
    });
  });

  describe('remove', () => {
    it('soft-deletes an existing user', async () => {
      repo.findById.mockResolvedValue(buildUser());
      await service.remove('0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d');
      expect(repo.softDelete).toHaveBeenCalledWith('0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d');
    });

    it('throws when user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('0190a0e8-7c41-7e2a-bc0d-1b2f3a4b5c6d')).rejects.toBeInstanceOf(
        NotFoundDomainException,
      );
    });
  });
});
