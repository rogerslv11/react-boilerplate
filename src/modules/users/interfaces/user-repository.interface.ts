import { User, UserRole } from '../users.entity';

export interface UserRepositoryInterface {
  findById(id: string, includeDeleted?: boolean): Promise<User | null>;
  findByEmail(email: string, includeDeleted?: boolean): Promise<User | null>;
  findByIdActive(id: string): Promise<User | null>;
}

export type { UserRole };
