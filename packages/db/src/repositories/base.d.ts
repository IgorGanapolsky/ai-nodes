import type { SQLiteColumn, SQLiteTableWithColumns } from 'drizzle-orm/sqlite-core';
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
export declare abstract class BaseRepository<TTable extends SQLiteTableWithColumns<any>, TSelect, TInsert> {
    protected db: any;
    protected abstract table: TTable;
    findById(id: string): Promise<TSelect | null>;
    findMany(options?: {
        filters?: FilterOptions;
        pagination?: PaginationOptions;
        sort?: SortOptions<TSelect>;
    }): Promise<QueryResult<TSelect>>;
    create(data: TInsert): Promise<TSelect>;
    createMany(data: TInsert[]): Promise<TSelect[]>;
    update(id: string, data: Partial<TInsert>): Promise<TSelect | null>;
    delete(id: string): Promise<boolean>;
    deleteMany(ids: string[]): Promise<number>;
    count(filters?: FilterOptions): Promise<number>;
    protected aggregate<TColumn extends SQLiteColumn>(column: TColumn, operation: 'sum' | 'avg' | 'max' | 'min', filters?: FilterOptions): Promise<number | null>;
    protected findByDateRange(dateColumn: SQLiteColumn, startDate: Date, endDate: Date, options?: {
        filters?: FilterOptions;
        pagination?: PaginationOptions;
        sort?: SortOptions<TSelect>;
    }): Promise<QueryResult<TSelect>>;
}
//# sourceMappingURL=base.d.ts.map