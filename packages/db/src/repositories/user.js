import { eq, and, or, desc, count, sql } from 'drizzle-orm';
import { BaseRepository } from './base';
import { users } from '../schema/users';
export class UserRepository extends BaseRepository {
    table = users;
    // Find user by email
    async findByEmail(email) {
        const result = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.email, email.toLowerCase()))
            .limit(1);
        return result[0] || null;
    }
    // Find users by role
    async findByRole(role, options = {}) {
        return this.findMany({
            filters: { ...options.filters, role },
            pagination: options.pagination,
            sort: { column: 'createdAt', direction: 'desc' },
        });
    }
    // Create user with email normalization
    async createUser(userData) {
        const newUser = {
            ...userData,
            email: userData.email.toLowerCase(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        return this.create(newUser);
    }
    // Update user
    async updateUser(userId, userData) {
        const updateData = {
            ...userData,
            updatedAt: new Date(),
        };
        if (userData.email) {
            updateData.email = userData.email.toLowerCase();
        }
        return this.update(userId, updateData);
    }
    // Update user password
    async updatePassword(userId, passwordHash) {
        return this.update(userId, {
            passwordHash,
            updatedAt: new Date(),
        });
    }
    // Check if email exists
    async emailExists(email, excludeUserId) {
        let query = this.db
            .select({ id: this.table.id })
            .from(this.table)
            .where(eq(this.table.email, email.toLowerCase()));
        if (excludeUserId) {
            query = query.where(and(eq(this.table.email, email.toLowerCase()), sql `${this.table.id} != ${excludeUserId}`));
        }
        const result = await query.limit(1);
        return result.length > 0;
    }
    // Get user statistics
    async getUserStats() {
        // Get total count
        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table);
        // Get role breakdown
        const roleResult = await this.db
            .select({
            role: this.table.role,
            count: count(),
        })
            .from(this.table)
            .groupBy(this.table.role);
        // Get recent signups (last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const thirtyDaysTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
        const recentResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(sql `${this.table.createdAt} >= ${thirtyDaysTimestamp}`);
        return {
            total: totalResult[0]?.count || 0,
            byRole: roleResult.reduce((acc, { role, count }) => {
                acc[role] = count;
                return acc;
            }, {}),
            recentSignups: recentResult[0]?.count || 0,
        };
    }
    // Search users
    async searchUsers(query, options = {}) {
        const searchTerm = `%${query.toLowerCase()}%`;
        let whereConditions = [
            sql `lower(${this.table.email}) LIKE ${searchTerm}`
        ];
        // Add additional filters
        if (options.filters?.role) {
            if (Array.isArray(options.filters.role)) {
                whereConditions.push(or(...options.filters.role.map(r => eq(this.table.role, r))));
            }
            else {
                whereConditions.push(eq(this.table.role, options.filters.role));
            }
        }
        const whereClause = and(...whereConditions);
        const limit = options.pagination?.limit || 50;
        const offset = options.pagination?.offset || 0;
        const data = await this.db
            .select()
            .from(this.table)
            .where(whereClause)
            .orderBy(desc(this.table.createdAt))
            .limit(limit)
            .offset(offset);
        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(whereClause);
        const total = totalResult[0]?.count || 0;
        return {
            data,
            total,
            page: options.pagination?.page || 1,
            limit,
            hasMore: offset + data.length < total,
        };
    }
    // Get users with their node count
    async getUsersWithNodeCounts(options = {}) {
        const { pagination = {}, filters = {} } = options;
        const limit = pagination.limit || 50;
        const offset = pagination.offset || 0;
        let whereConditions = [];
        if (filters.role) {
            if (Array.isArray(filters.role)) {
                whereConditions.push(or(...filters.role.map(r => eq(this.table.role, r))));
            }
            else {
                whereConditions.push(eq(this.table.role, filters.role));
            }
        }
        if (filters.email) {
            whereConditions.push(eq(this.table.email, filters.email.toLowerCase()));
        }
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        // This would require a join with the nodes table - for now, we'll use a subquery approach
        const data = await this.db
            .select({
            ...this.table,
            nodeCount: sql `(
          SELECT COUNT(*)
          FROM nodes
          WHERE nodes.owner_id = ${this.table.id}
        )`.as('nodeCount'),
        })
            .from(this.table)
            .where(whereClause)
            .orderBy(desc(this.table.createdAt))
            .limit(limit)
            .offset(offset);
        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(whereClause);
        const total = totalResult[0]?.count || 0;
        return {
            data,
            total,
            page: pagination.page || 1,
            limit,
            hasMore: offset + data.length < total,
        };
    }
    // Soft delete user (if you want to implement soft deletes)
    async softDeleteUser(userId) {
        // For now, we'll just update a field - you could add a deletedAt field to the schema
        // This is a placeholder implementation
        const result = await this.update(userId, {
            updatedAt: new Date(),
            // deletedAt: new Date(), // You'd need to add this field to the schema
        });
        return result !== null;
    }
    // Get user activity summary
    async getUserActivity(userId) {
        // Get node count
        const nodeCountResult = await this.db
            .select({ count: count() })
            .from(sql `nodes`)
            .where(sql `owner_id = ${userId}`);
        // Get total earnings (would need to join with earnings through nodes)
        const earningsResult = await this.db
            .select({ total: sql `COALESCE(SUM(amount), 0)` })
            .from(sql `earnings`)
            .where(sql `node_id IN (SELECT id FROM nodes WHERE owner_id = ${userId})`);
        // Get active alerts count
        const alertsResult = await this.db
            .select({ count: count() })
            .from(sql `alerts`)
            .where(sql `node_id IN (SELECT id FROM nodes WHERE owner_id = ${userId}) AND resolved = 0`);
        // Get last activity (last node update)
        const lastActivityResult = await this.db
            .select({ lastSeen: sql `MAX(last_seen)` })
            .from(sql `nodes`)
            .where(sql `owner_id = ${userId}`);
        return {
            nodeCount: nodeCountResult[0]?.count || 0,
            totalEarnings: earningsResult[0]?.total || 0,
            activeAlerts: alertsResult[0]?.count || 0,
            lastActivity: lastActivityResult[0]?.lastSeen || null,
        };
    }
}
