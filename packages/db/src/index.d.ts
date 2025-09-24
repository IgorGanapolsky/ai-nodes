export { createDatabaseConnection, getDatabaseConnection, closeDatabaseConnection, runDatabaseMigrations, database, schema } from './client';
export * from './schema';
export { seedDatabase } from './seed';
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
/**
 * Initialize the database with default configuration
 */
export declare function initializeDatabase(options?: {
    url?: string;
    runMigrations?: boolean;
    seedData?: boolean;
}): Promise<{
    db: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<Record<string, unknown>> & {
        $client: Database;
    };
}>;
/**
 * Get a configured database instance
 */
export declare function getDatabase(): import("drizzle-orm/better-sqlite3").BetterSQLite3Database<Record<string, unknown>> & {
    $client: Database;
};
/**
 * Cleanup database connections
 */
export declare function cleanup(): void;
//# sourceMappingURL=index.d.ts.map