import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
const defaultConfig = {
  url: process.env.DATABASE_URL || './data/app.db',
  enableWAL: true,
  enableForeignKeys: true,
  busyTimeout: 5000,
  readOnly: false,
  verbose: process.env.NODE_ENV === 'development',
};
let db = null;
let sqlite = null;
export function createDatabaseConnection(config = {}) {
  const mergedConfig = { ...defaultConfig, ...config };
  // Ensure data directory exists
  const dbPath = mergedConfig.url;
  if (!dbPath.startsWith(':memory:') && dbPath !== '') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  // Create SQLite connection
  sqlite = new Database(dbPath, {
    verbose: mergedConfig.verbose ? console.log : undefined,
    fileMustExist: false,
    timeout: mergedConfig.busyTimeout,
    readonly: mergedConfig.readOnly,
  });
  // Configure SQLite
  if (mergedConfig.enableWAL) {
    sqlite.pragma('journal_mode = WAL');
  }
  if (mergedConfig.enableForeignKeys) {
    sqlite.pragma('foreign_keys = ON');
  }
  // Additional performance optimizations
  sqlite.pragma('synchronous = NORMAL');
  sqlite.pragma('cache_size = 1000000'); // 1GB cache
  sqlite.pragma('temp_store = memory');
  sqlite.pragma('mmap_size = 268435456'); // 256MB
  // Create Drizzle instance
  db = drizzle(sqlite, {
    schema,
    logger: mergedConfig.verbose,
  });
  return db;
}
export function getDatabaseConnection(config) {
  if (!db) {
    return createDatabaseConnection(config);
  }
  return db;
}
export function closeDatabaseConnection() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}
export async function runDatabaseMigrations(migrationsFolder = './migrations') {
  const connection = getDatabaseConnection();
  await migrate(connection, { migrationsFolder });
  return connection;
}
// Export the schema and database instance
export { schema };
export const database = getDatabaseConnection();
// Export table references for easy access
export const { owners, devices, metrics, statements, alerts } = schema;
//# sourceMappingURL=client.js.map
