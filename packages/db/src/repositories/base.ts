import { getConnection } from '../connection';
import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
import { eq, and, or, gte, lte, desc, asc, count, sum, avg, max, min } from 'drizzle-orm';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortOptions<T> {
  column: keyof T;
  direction: 'asc' | 'desc';
}

export interface FilterOptions {
  [key: string]: any;
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export abstract class BaseRepository<TTable extends SQLiteTableWithColumns<any>, TSelect, TInsert> {
  protected db = getConnection();
  protected abstract table: TTable;

  // Basic CRUD operations
  async findById(id: string): Promise<TSelect | null> {
    const result = await this.db.select().from(this.table).where(eq(this.table.id, id)).limit(1);

    return (result[0] as TSelect) || null;
  }

  async findMany(
    options: {
      filters?: FilterOptions;
      pagination?: PaginationOptions;
      sort?: SortOptions<TSelect>;
    } = {},
  ): Promise<QueryResult<TSelect>> {
    const { filters = {}, pagination = {}, sort } = options;
    const { page = 1, limit = 50 } = pagination;
    const offset = pagination.offset ?? (page - 1) * limit;

    let query = this.db.select().from(this.table);

    // Apply filters
    if (Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters).map(([key, value]) => {
        const column = this.table[key as keyof TTable] as SQLiteColumn;
        if (Array.isArray(value)) {
          return or(...value.map((v) => eq(column, v)));
        }
        return eq(column, value);
      });
      query = query.where(and(...conditions)) as any;
    }

    // Apply sorting
    if (sort) {
      const column = this.table[sort.column as keyof TTable] as SQLiteColumn;
      query = query.orderBy(sort.direction === 'desc' ? desc(column) : asc(column)) as any;
    }

    // Get total count
    let countQuery = this.db.select({ count: count() }).from(this.table);
    if (Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters).map(([key, value]) => {
        const column = this.table[key as keyof TTable] as SQLiteColumn;
        if (Array.isArray(value)) {
          return or(...value.map((v) => eq(column, v)));
        }
        return eq(column, value);
      });
      countQuery = countQuery.where(and(...conditions)) as any;
    }

    const [data, totalResult] = await Promise.all([query.limit(limit).offset(offset), countQuery]);

    const total = totalResult[0]?.count || 0;

    return {
      data: data as TSelect[],
      total,
      page,
      limit,
      hasMore: offset + data.length < total,
    };
  }

  async create(data: TInsert): Promise<TSelect> {
    const result = await this.db.insert(this.table).values(data as any).returning();

    return result[0] as TSelect;
  }

  async createMany(data: TInsert[]): Promise<TSelect[]> {
    const result = await this.db.insert(this.table).values(data as any).returning();

    return result as unknown as TSelect[];
  }

  async update(id: string, data: Partial<TInsert>): Promise<TSelect | null> {
    const result = await this.db
      .update(this.table)
      .set(data as any)
      .where(eq(this.table.id, id))
      .returning();

    return (result[0] as TSelect) || null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(this.table).where(eq(this.table.id, id));

    return result.changes > 0;
  }

  async deleteMany(ids: string[]): Promise<number> {
    const result = await this.db
      .delete(this.table)
      .where(or(...ids.map((id) => eq(this.table.id, id))));

    return result.changes;
  }

  // Utility methods for aggregations
  async count(filters: FilterOptions = {}): Promise<number> {
    let query = this.db.select({ count: count() }).from(this.table);

    if (Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters).map(([key, value]) => {
        const column = this.table[key as keyof TTable] as SQLiteColumn;
        return eq(column, value);
      });
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return result[0]?.count || 0;
  }

  protected async aggregate<TColumn extends SQLiteColumn>(
    column: TColumn,
    operation: 'sum' | 'avg' | 'max' | 'min',
    filters: FilterOptions = {},
  ): Promise<number | null> {
    const aggregateFn = {
      sum,
      avg,
      max,
      min,
    }[operation];

    let query = this.db.select({ result: aggregateFn(column) }).from(this.table);

    if (Object.keys(filters).length > 0) {
      const conditions = Object.entries(filters).map(([key, value]) => {
        const tableColumn = this.table[key as keyof TTable] as SQLiteColumn;
        return eq(tableColumn, value);
      });
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return Number(result[0]?.result) || null;
  }

  // Date range queries
  protected async findByDateRange(
    dateColumn: SQLiteColumn,
    startDate: Date,
    endDate: Date,
    options: {
      filters?: FilterOptions;
      pagination?: PaginationOptions;
      sort?: SortOptions<TSelect>;
    } = {},
  ): Promise<QueryResult<TSelect>> {
    // Custom handling for date range
    const { filters = {}, pagination = {}, sort } = options;
    const { page = 1, limit = 50 } = pagination;
    const offset = pagination.offset ?? (page - 1) * limit;

    let query = this.db.select().from(this.table);

    // Apply date range filter
    let conditions: any[] = [gte(dateColumn, startDate), lte(dateColumn, endDate)];

    // Apply other filters
    if (Object.keys(filters).length > 0) {
      const filterConditions = Object.entries(filters).map(([key, value]) => {
        const column = this.table[key as keyof TTable] as SQLiteColumn;
        if (Array.isArray(value)) {
          return or(...value.map((v) => eq(column, v)));
        }
        return eq(column, value);
      });
      conditions.push(...filterConditions);
    }

    query = query.where(and(...conditions)) as any;

    // Apply sorting
    if (sort) {
      const column = this.table[sort.column as keyof TTable] as SQLiteColumn;
      query = query.orderBy(sort.direction === 'desc' ? desc(column) : asc(column)) as any;
    } else {
      // Default sort by date column descending
      query = query.orderBy(desc(dateColumn)) as any;
    }

    // Get total count
    let countQuery = this.db.select({ count: count() }).from(this.table);
    countQuery = countQuery.where(and(...conditions)) as any;

    const [data, totalResult] = await Promise.all([query.limit(limit).offset(offset), countQuery]);

    const total = totalResult[0]?.count || 0;

    return {
      data: data as TSelect[],
      total,
      page,
      limit,
      hasMore: offset + data.length < total,
    };
  }
}
