#!/usr/bin/env tsx

import { runDatabaseMigrations } from './client';
import path from 'path';
import { getLogger } from '@depinautopilot/utils';

const logger = getLogger('db-migration');

async function main() {
  logger.info('Running database migrations');

  try {
    const migrationsPath = path.join(__dirname, '../migrations');
    await runDatabaseMigrations(migrationsPath);

    logger.info('Migrations completed successfully');
    logger.info('Database connection verified');
  } catch (error) {
    logger.error('Migration failed', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch((error) => {
    logger.error('Main process failed', error);
    process.exit(1);
  });
}
