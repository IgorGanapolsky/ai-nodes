// Database connection and configuration
export {
  createDatabaseConnection,
  getDatabaseConnection,
  closeDatabaseConnection,
  runDatabaseMigrations,
  database,
  schema
} from './client';

// Schema definitions and types
export * from './schema';

// Utility scripts
export { seedDatabase } from './seed';

// Re-export commonly used types from Drizzle
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Database utilities
import { getDatabaseConnection, createDatabaseConnection, closeDatabaseConnection, runDatabaseMigrations } from './client';

/**
 * Initialize the database with default configuration
 */
export async function initializeDatabase(options?: {
  url?: string;
  runMigrations?: boolean;
  seedData?: boolean;
}) {
  const { url, runMigrations: shouldRunMigrations = true, seedData = false } = options || {};

  // Create connection
  const db = createDatabaseConnection({
    url,
    enableWAL: true,
    enableForeignKeys: true,
  });

  // Run migrations if requested
  if (shouldRunMigrations) {
    await runDatabaseMigrations();
  }

  // Seed data if requested
  if (seedData) {
    const { seedDatabase } = await import('./seed');
    await seedDatabase();
  }

  return { db };
}

/**
 * Get a configured database instance
 */
export function getDatabase() {
  return getDatabaseConnection();
}

/**
 * Cleanup database connections
 */
export function cleanup() {
  closeDatabaseConnection();
}