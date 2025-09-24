// Database connection and configuration
export * from './connection';

// Schema definitions and types
export * from './schema';

// Repository pattern implementation
export * from './repositories';

// Utility scripts
export { seedDatabase } from './scripts/seed';
export { DatabaseBackup } from './scripts/backup';
export { DatabaseRestore } from './scripts/restore';
export { DatabaseInitializer } from './scripts/init';

// Re-export commonly used types from Drizzle
export type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Database utilities
import { getConnection, createConnection, closeConnection, runMigrations } from './connection';
import { getRepositories } from './repositories';

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
  const db = createConnection({
    url,
    enableWAL: true,
    enableForeignKeys: true,
  });

  // Run migrations if requested
  if (shouldRunMigrations) {
    await runMigrations();
  }

  // Seed data if requested
  if (seedData) {
    const { seedDatabase } = await import('./scripts/seed');
    await seedDatabase();
  }

  return {
    db,
    repositories: getRepositories(),
  };
}

/**
 * Get a configured database instance with repositories
 */
export function getDatabase() {
  return {
    connection: getConnection(),
    repositories: getRepositories(),
  };
}

/**
 * Cleanup database connections
 */
export function cleanup() {
  closeConnection();
}