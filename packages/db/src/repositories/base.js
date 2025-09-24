import { getConnection } from '../connection';
import { eq, and, or, gte, lte, desc, asc, count, sum, avg, max, min } from 'drizzle-orm';
export class BaseRepository {
    db = getConnection();
    // Basic CRUD operations
    async findById(id) {
        const result = await this.db
            .select()
            .from(this.table)
            .where(eq(this.table.id, id))
            .limit(1);
        return result[0] || null;
    }
    async findMany(options = {}) {
        const { filters = {}, pagination = {}, sort } = options;
        const { page = 1, limit = 50 } = pagination;
        const offset = pagination.offset ?? (page - 1) * limit;
        let query = this.db.select().from(this.table);
        // Apply filters
        if (Object.keys(filters).length > 0) {
            const conditions = Object.entries(filters).map(([key, value]) => {
                const column = this.table[key];
                if (Array.isArray(value)) {
                    return or(...value.map(v => eq(column, v)));
                }
                return eq(column, value);
            });
            query = query.where(and(...conditions));
        }
        // Apply sorting
        if (sort) {
            const column = this.table[sort.column];
            query = query.orderBy(sort.direction === 'desc' ? desc(column) : asc(column));
        }
        // Get total count
        let countQuery = this.db.select({ count: count() }).from(this.table);
        if (Object.keys(filters).length > 0) {
            const conditions = Object.entries(filters).map(([key, value]) => {
                const column = this.table[key];
                if (Array.isArray(value)) {
                    return or(...value.map(v => eq(column, v)));
                }
                return eq(column, value);
            });
            countQuery = countQuery.where(and(...conditions));
        }
        const [data, totalResult] = await Promise.all([
            query.limit(limit).offset(offset),
            countQuery,
        ]);
        const total = totalResult[0]?.count || 0;
        return {
            data,
            total,
            page,
            limit,
            hasMore: offset + data.length < total,
        };
    }
    async create(data) {
        const result = await this.db
            .insert(this.table)
            .values(data)
            .returning();
        return result[0];
    }
    async createMany(data) {
        const result = await this.db
            .insert(this.table)
            .values(data)
            .returning();
        return result;
    }
    async update(id, data) {
        const result = await this.db
            .update(this.table)
            .set(data)
            .where(eq(this.table.id, id))
            .returning();
        return result[0] || null;
    }
    async delete(id) {
        const result = await this.db
            .delete(this.table)
            .where(eq(this.table.id, id));
        return result.changes > 0;
    }
    async deleteMany(ids) {
        const result = await this.db
            .delete(this.table)
            .where(or(...ids.map(id => eq(this.table.id, id))));
        return result.changes;
    }
    // Utility methods for aggregations
    async count(filters = {}) {
        let query = this.db.select({ count: count() }).from(this.table);
        if (Object.keys(filters).length > 0) {
            const conditions = Object.entries(filters).map(([key, value]) => {
                const column = this.table[key];
                return eq(column, value);
            });
            query = query.where(and(...conditions));
        }
        const result = await query;
        return result[0]?.count || 0;
    }
    async aggregate(column, operation, filters = {}) {
        const aggregateFn = {
            sum,
            avg,
            max,
            min,
        }[operation];
        let query = this.db.select({ result: aggregateFn(column) }).from(this.table);
        if (Object.keys(filters).length > 0) {
            const conditions = Object.entries(filters).map(([key, value]) => {
                const tableColumn = this.table[key];
                return eq(tableColumn, value);
            });
            query = query.where(and(...conditions));
        }
        const result = await query;
        return result[0]?.result || null;
    }
    // Date range queries
    async findByDateRange(dateColumn, startDate, endDate, options = {}) {
        const startTimestamp = Math.floor(startDate.getTime() / 1000);
        const endTimestamp = Math.floor(endDate.getTime() / 1000);
        const dateFilters = {
            ...options.filters,
            _dateRange: { column: dateColumn, start: startTimestamp, end: endTimestamp },
        };
        // Custom handling for date range
        const { filters = {}, pagination = {}, sort } = options;
        const { page = 1, limit = 50 } = pagination;
        const offset = pagination.offset ?? (page - 1) * limit;
        let query = this.db.select().from(this.table);
        // Apply date range filter
        query = query.where(and(gte(dateColumn, startTimestamp), lte(dateColumn, endTimestamp)));
        // Apply other filters
        if (Object.keys(filters).length > 0) {
            const conditions = Object.entries(filters).map(([key, value]) => {
                const column = this.table[key];
                if (Array.isArray(value)) {
                    return or(...value.map(v => eq(column, v)));
                }
                return eq(column, value);
            });
            query = query.where(and(...conditions));
        }
        // Apply sorting
        if (sort) {
            const column = this.table[sort.column];
            query = query.orderBy(sort.direction === 'desc' ? desc(column) : asc(column));
        }
        else {
            // Default sort by date column descending
            query = query.orderBy(desc(dateColumn));
        }
        // Get total count
        let countQuery = this.db.select({ count: count() }).from(this.table);
        countQuery = countQuery.where(and(gte(dateColumn, startTimestamp), lte(dateColumn, endTimestamp)));
        if (Object.keys(filters).length > 0) {
            const conditions = Object.entries(filters).map(([key, value]) => {
                const column = this.table[key];
                if (Array.isArray(value)) {
                    return or(...value.map(v => eq(column, v)));
                }
                return eq(column, value);
            });
            countQuery = countQuery.where(and(...conditions));
        }
        const [data, totalResult] = await Promise.all([
            query.limit(limit).offset(offset),
            countQuery,
        ]);
        const total = totalResult[0]?.count || 0;
        return {
            data,
            total,
            page,
            limit,
            hasMore: offset + data.length < total,
        };
    }
}
