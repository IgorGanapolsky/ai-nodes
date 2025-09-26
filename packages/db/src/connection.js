import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { schema } from './schema';
import path from 'path';
import fs from 'fs';
const defaultConfig = {
  url: process.env.DATABASE_URL || './data/app.db',
  enableWAL: true,
  enableForeignKeys: true,
  busyTimeout: 5000,
  maxConnections: 10,
  readOnly: false,
  verbose: process.env.NODE_ENV === 'development',
};
let db = null;
let sqlite = null;
export function createConnection(config = {}) {
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
export function getConnection(config) {
  if (!db) {
    return createConnection(config);
  }
  return db;
}
export function closeConnection() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}
export async function runMigrations(migrationsFolder = './migrations') {
  const connection = getConnection();
  await migrate(connection, { migrationsFolder });
  return connection;
}
// Connection pool management
class ConnectionPool {
  connections = [];
  config;
  maxConnections;
  constructor(config = {}) {
    this.config = { ...defaultConfig, ...config };
    this.maxConnections = this.config.maxConnections || 10;
  }
  async getConnection() {
    if (this.connections.length > 0) {
      return this.connections.pop();
    }
    if (this.connections.length < this.maxConnections) {
      return this.createNewConnection();
    }
    // Wait for a connection to be available
    return new Promise((resolve) => {
      const checkForConnection = () => {
        if (this.connections.length > 0) {
          resolve(this.connections.pop());
        } else {
          setTimeout(checkForConnection, 10);
        }
      };
      checkForConnection();
    });
  }
  returnConnection(connection) {
    if (this.connections.length < this.maxConnections) {
      this.connections.push(connection);
    } else {
      connection.close();
    }
  }
  createNewConnection() {
    const connection = new Database(this.config.url, {
      verbose: this.config.verbose ? console.log : undefined,
      fileMustExist: false,
      timeout: this.config.busyTimeout,
      readonly: this.config.readOnly,
    });
    // Apply same configuration as main connection
    if (this.config.enableWAL) {
      connection.pragma('journal_mode = WAL');
    }
    if (this.config.enableForeignKeys) {
      connection.pragma('foreign_keys = ON');
    }
    connection.pragma('synchronous = NORMAL');
    connection.pragma('cache_size = 1000000');
    connection.pragma('temp_store = memory');
    connection.pragma('mmap_size = 268435456');
    return connection;
  }
  close() {
    this.connections.forEach((conn) => conn.close());
    this.connections = [];
  }
}
export { ConnectionPool };
