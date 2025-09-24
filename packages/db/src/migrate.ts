#!/usr/bin/env tsx

import { runDatabaseMigrations, getDatabaseConnection } from './client';
import path from 'path';

async function main() {
  console.log('🔄 Running database migrations...');

  try {
    const migrationsPath = path.join(__dirname, '../migrations');
    const db = await runDatabaseMigrations(migrationsPath);

    console.log('✅ Migrations completed successfully');

    // Test connection
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Database connection verified');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}