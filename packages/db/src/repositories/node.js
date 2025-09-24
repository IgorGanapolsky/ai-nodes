import { eq, and, or, desc, count, sql } from 'drizzle-orm';
import { BaseRepository } from './base';
import { nodes } from '../schema/nodes';
export class NodeRepository extends BaseRepository {
    table = nodes;
    // Find nodes by owner
    async findByOwner(ownerId, options = {}) {
        return this.findMany({
            filters: { ...options.filters, ownerId },
            pagination: options.pagination,
        });
    }
    // Find nodes by type
    async findByType(type, options = {}) {
        return this.findMany({
            filters: { ...options.filters, type },
            pagination: options.pagination,
        });
    }
    // Find online nodes
    async findOnlineNodes(options = {}) {
        return this.findMany({
            filters: { ...options.filters, isOnline: true },
            pagination: options.pagination,
            sort: { column: 'lastSeen', direction: 'desc' },
        });
    }
    // Find offline nodes
    async findOfflineNodes(options = {}) {
        return this.findMany({
            filters: { ...options.filters, isOnline: false },
            pagination: options.pagination,
            sort: { column: 'lastSeen', direction: 'desc' },
        });
    }
    // Find nodes that haven't been seen for a while
    async findStaleNodes(minutesThreshold = 60, options = {}) {
        const thresholdTimestamp = Math.floor((Date.now() - minutesThreshold * 60 * 1000) / 1000);
        const data = await this.db
            .select()
            .from(this.table)
            .where(and(or(eq(this.table.lastSeen, null), sql `${this.table.lastSeen} < ${thresholdTimestamp}`)))
            .orderBy(desc(this.table.lastSeen))
            .limit(options.pagination?.limit || 50)
            .offset(options.pagination?.offset || 0);
        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(and(or(eq(this.table.lastSeen, null), sql `${this.table.lastSeen} < ${thresholdTimestamp}`)));
        const total = totalResult[0]?.count || 0;
        const limit = options.pagination?.limit || 50;
        return {
            data,
            total,
            page: options.pagination?.page || 1,
            limit,
            hasMore: (options.pagination?.offset || 0) + data.length < total,
        };
    }
    // Update node status
    async updateStatus(nodeId, status) {
        return this.update(nodeId, {
            status,
            updatedAt: new Date(),
        });
    }
    // Update node online status
    async updateOnlineStatus(nodeId, isOnline) {
        return this.update(nodeId, {
            isOnline,
            lastSeen: isOnline ? new Date() : undefined,
            updatedAt: new Date(),
        });
    }
    // Batch update online status for multiple nodes
    async batchUpdateOnlineStatus(updates) {
        const timestamp = new Date();
        for (const { nodeId, isOnline } of updates) {
            await this.update(nodeId, {
                isOnline,
                lastSeen: isOnline ? timestamp : undefined,
                updatedAt: timestamp,
            });
        }
    }
    // Get node statistics
    async getStats(filters = {}) {
        // Base query with filters
        let whereConditions = [];
        if (filters.ownerId) {
            whereConditions.push(eq(this.table.ownerId, filters.ownerId));
        }
        if (filters.type) {
            if (Array.isArray(filters.type)) {
                whereConditions.push(or(...filters.type.map(t => eq(this.table.type, t))));
            }
            else {
                whereConditions.push(eq(this.table.type, filters.type));
            }
        }
        if (filters.location) {
            whereConditions.push(eq(this.table.location, filters.location));
        }
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        // Get total count
        const totalResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(whereClause);
        // Get online count
        const onlineResult = await this.db
            .select({ count: count() })
            .from(this.table)
            .where(whereClause ? and(whereClause, eq(this.table.isOnline, true)) : eq(this.table.isOnline, true));
        // Get status breakdown
        const statusResult = await this.db
            .select({
            status: this.table.status,
            count: count(),
        })
            .from(this.table)
            .where(whereClause)
            .groupBy(this.table.status);
        // Get type breakdown
        const typeResult = await this.db
            .select({
            type: this.table.type,
            count: count(),
        })
            .from(this.table)
            .where(whereClause)
            .groupBy(this.table.type);
        const total = totalResult[0]?.count || 0;
        const online = onlineResult[0]?.count || 0;
        return {
            total,
            online,
            offline: total - online,
            byStatus: statusResult.reduce((acc, { status, count }) => {
                acc[status] = count;
                return acc;
            }, {}),
            byType: typeResult.reduce((acc, { type, count }) => {
                acc[type] = count;
                return acc;
            }, {}),
        };
    }
    // Search nodes by name or description
    async search(query, options = {}) {
        const searchTerm = `%${query.toLowerCase()}%`;
        let whereConditions = [
            or(sql `lower(${this.table.name}) LIKE ${searchTerm}`, sql `lower(${this.table.description}) LIKE ${searchTerm}`)
        ];
        // Add additional filters
        if (options.filters?.ownerId) {
            whereConditions.push(eq(this.table.ownerId, options.filters.ownerId));
        }
        if (options.filters?.type) {
            if (Array.isArray(options.filters.type)) {
                whereConditions.push(or(...options.filters.type.map(t => eq(this.table.type, t))));
            }
            else {
                whereConditions.push(eq(this.table.type, options.filters.type));
            }
        }
        if (options.filters?.status) {
            if (Array.isArray(options.filters.status)) {
                whereConditions.push(or(...options.filters.status.map(s => eq(this.table.status, s))));
            }
            else {
                whereConditions.push(eq(this.table.status, options.filters.status));
            }
        }
        const whereClause = and(...whereConditions);
        const limit = options.pagination?.limit || 50;
        const offset = options.pagination?.offset || 0;
        const data = await this.db
            .select()
            .from(this.table)
            .where(whereClause)
            .orderBy(desc(this.table.updatedAt))
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
    // Get nodes with their last activity
    async getNodesWithActivity(options = {}) {
        const { pagination = {}, filters = {} } = options;
        const limit = pagination.limit || 50;
        const offset = pagination.offset || 0;
        let whereConditions = [];
        if (filters.ownerId) {
            whereConditions.push(eq(this.table.ownerId, filters.ownerId));
        }
        if (filters.type) {
            if (Array.isArray(filters.type)) {
                whereConditions.push(or(...filters.type.map(t => eq(this.table.type, t))));
            }
            else {
                whereConditions.push(eq(this.table.type, filters.type));
            }
        }
        const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;
        const data = await this.db
            .select({
            ...this.table,
            daysSinceLastSeen: sql `
          CASE
            WHEN ${this.table.lastSeen} IS NULL THEN NULL
            ELSE (unixepoch() - ${this.table.lastSeen}) / 86400.0
          END
        `.as('daysSinceLastSeen'),
        })
            .from(this.table)
            .where(whereClause)
            .orderBy(desc(this.table.lastSeen))
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
}
