import { BaseRepository, QueryResult, FilterOptions, PaginationOptions } from './base';
import { users, type User, type NewUser } from '../schema/users';
export interface UserFilters extends FilterOptions {
  role?: string | string[];
  email?: string;
}
export declare class UserRepository extends BaseRepository<typeof users, User, NewUser> {
  protected table: any;
  findByEmail(email: string): Promise<User | null>;
  findByRole(
    role: string | string[],
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<UserFilters, 'role'>;
    },
  ): Promise<QueryResult<User>>;
  createUser(userData: Omit<NewUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<User>;
  updateUser(
    userId: string,
    userData: Partial<Omit<NewUser, 'id' | 'createdAt'>>,
  ): Promise<User | null>;
  updatePassword(userId: string, passwordHash: string): Promise<User | null>;
  emailExists(email: string, excludeUserId?: string): Promise<boolean>;
  getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    recentSignups: number;
  }>;
  searchUsers(
    query: string,
    options?: {
      pagination?: PaginationOptions;
      filters?: UserFilters;
    },
  ): Promise<QueryResult<User>>;
  getUsersWithNodeCounts(options?: {
    pagination?: PaginationOptions;
    filters?: UserFilters;
  }): Promise<
    QueryResult<
      User & {
        nodeCount: number;
      }
    >
  >;
  softDeleteUser(userId: string): Promise<boolean>;
  getUserActivity(userId: string): Promise<{
    nodeCount: number;
    totalEarnings: number;
    activeAlerts: number;
    lastActivity: number | null;
  }>;
}
//# sourceMappingURL=user.d.ts.map
