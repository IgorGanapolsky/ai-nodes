#!/usr/bin/env tsx

import { createConnection, runMigrations, closeConnection } from '../connection';
import { seedDatabase } from './seed';
import { DatabaseBackup } from './backup';
import fs from 'fs/promises';
import path from 'path';

interface InitOptions {
  force?: boolean;
  skipMigrations?: boolean;
  skipSeeding?: boolean;
  createBackup?: boolean;
  environment?: 'development' | 'production' | 'test';
  dataPath?: string;
}

class DatabaseInitializer {
  private options: InitOptions;

  constructor(options: InitOptions = {}) {
    this.options = {
      force: false,
      skipMigrations: false,
      skipSeeding: false,
      createBackup: false,
      environment: 'development',
      ...options,
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing DePIN Autopilot Database...');
    console.log(`🌍 Environment: ${this.options.environment}`);

    try {
      // Check if database already exists
      const dbPath = this.options.dataPath || process.env.DATABASE_URL || './data/app.db';
      const dbExists = await this.databaseExists(dbPath);

      if (dbExists && !this.options.force) {
        console.log('⚠️  Database already exists!');
        console.log('   Use --force to reinitialize');
        console.log('   Use --create-backup to backup before reinitializing');
        return;
      }

      // Create backup of existing database if requested
      if (dbExists && this.options.createBackup) {
        console.log('💾 Creating backup of existing database...');
        const backup = new DatabaseBackup(dbPath);
        const { backupPath } = await backup.createBackup({
          compress: true,
          includeSchema: true,
        });
        console.log(`✅ Backup created: ${backupPath}`);
      }

      // Ensure data directory exists
      await this.ensureDataDirectory(dbPath);

      // Remove existing database if force is used
      if (dbExists && this.options.force) {
        console.log('🗑️  Removing existing database...');
        await fs.unlink(dbPath);
      }

      // Initialize connection
      console.log('🔗 Establishing database connection...');
      const db = createConnection({
        url: dbPath,
        enableWAL: true,
        enableForeignKeys: true,
        verbose: this.options.environment === 'development',
      });

      // Run migrations
      if (!this.options.skipMigrations) {
        console.log('📦 Running database migrations...');
        await runMigrations();
        console.log('✅ Migrations completed');
      }

      // Verify database structure
      console.log('🔍 Verifying database structure...');
      await this.verifyDatabaseStructure();

      // Seed database for development
      if (!this.options.skipSeeding && this.options.environment === 'development') {
        console.log('🌱 Seeding database with sample data...');
        await seedDatabase();
        console.log('✅ Database seeded');
      }

      // Run health check
      console.log('🏥 Running health check...');
      await this.runHealthCheck();

      // Create initial admin user for production
      if (this.options.environment === 'production' && !this.options.skipSeeding) {
        console.log('👤 Creating initial admin user...');
        await this.createInitialAdminUser();
      }

      console.log('🎉 Database initialization completed successfully!');
      console.log('\n📊 Summary:');
      console.log(`   📁 Database: ${dbPath}`);
      console.log(`   🌍 Environment: ${this.options.environment}`);
      console.log(`   📦 Migrations: ${this.options.skipMigrations ? 'Skipped' : 'Applied'}`);
      console.log(`   🌱 Seeding: ${this.options.skipSeeding ? 'Skipped' : 'Applied'}`);

      // Close connection
      closeConnection();
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      closeConnection();
      throw error;
    }
  }

  private async databaseExists(dbPath: string): Promise<boolean> {
    try {
      await fs.access(dbPath);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDataDirectory(dbPath: string): Promise<void> {
    const dir = path.dirname(dbPath);
    await fs.mkdir(dir, { recursive: true });
    console.log(`📁 Data directory ensured: ${dir}`);
  }

  private async verifyDatabaseStructure(): Promise<void> {
    const db = createConnection();

    // Check if all required tables exist
    const requiredTables = ['users', 'nodes', 'earnings', 'metrics', 'alerts', 'revenue_shares'];
    const existingTables = await db.all(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    const tableNames = existingTables.map((row: any) => row.name);

    for (const tableName of requiredTables) {
      if (tableNames.includes(tableName)) {
        console.log(`  ✅ Table '${tableName}' exists`);
      } else {
        throw new Error(`Required table '${tableName}' is missing`);
      }
    }

    // Check indexes
    const indexes = await db.all(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);

    console.log(`  📊 Found ${indexes.length} indexes`);
    console.log(`  🗃️  Found ${tableNames.length} tables`);
  }

  private async runHealthCheck(): Promise<void> {
    const db = createConnection();

    // Test basic operations
    const testResults = [];

    // Test users table
    try {
      await db.all('SELECT COUNT(*) as count FROM users LIMIT 1');
      testResults.push({ table: 'users', status: 'OK' });
    } catch (error) {
      testResults.push({ table: 'users', status: 'FAILED', error });
    }

    // Test nodes table
    try {
      await db.all('SELECT COUNT(*) as count FROM nodes LIMIT 1');
      testResults.push({ table: 'nodes', status: 'OK' });
    } catch (error) {
      testResults.push({ table: 'nodes', status: 'FAILED', error });
    }

    // Test foreign key constraints
    try {
      await db.all('PRAGMA foreign_key_check');
      testResults.push({ table: 'foreign_keys', status: 'OK' });
    } catch (error) {
      testResults.push({ table: 'foreign_keys', status: 'FAILED', error });
    }

    // Test WAL mode
    try {
      const result = await db.all('PRAGMA journal_mode');
      const mode = result[0]?.journal_mode;
      testResults.push({
        table: 'journal_mode',
        status: mode === 'wal' ? 'OK' : 'WARNING',
        value: mode,
      });
    } catch (error) {
      testResults.push({ table: 'journal_mode', status: 'FAILED', error });
    }

    // Display results
    testResults.forEach((result) => {
      if (result.status === 'OK') {
        console.log(
          `  ✅ ${result.table}: ${result.status}${result.value ? ` (${result.value})` : ''}`,
        );
      } else if (result.status === 'WARNING') {
        console.log(
          `  ⚠️  ${result.table}: ${result.status}${result.value ? ` (${result.value})` : ''}`,
        );
      } else {
        console.log(`  ❌ ${result.table}: ${result.status}`);
        if (result.error) {
          console.log(`     Error: ${result.error}`);
        }
      }
    });

    const failedTests = testResults.filter((r) => r.status === 'FAILED');
    if (failedTests.length > 0) {
      throw new Error(`Health check failed: ${failedTests.length} tests failed`);
    }
  }

  private async createInitialAdminUser(): Promise<void> {
    const { getUserRepository } = await import('../repositories');
    const userRepo = getUserRepository();

    // Check if admin user already exists
    const existingAdmin = await userRepo.findByEmail('admin@localhost');
    if (existingAdmin) {
      console.log('  ⚠️  Admin user already exists');
      return;
    }

    // Create admin user with temporary password
    const tempPassword = this.generateTempPassword();
    const crypto = await import('crypto');
    const passwordHash = crypto.createHash('sha256').update(tempPassword).digest('hex');

    await userRepo.createUser({
      email: 'admin@localhost',
      passwordHash,
      role: 'admin',
    });

    console.log('  ✅ Initial admin user created');
    console.log(`  📧 Email: admin@localhost`);
    console.log(`  🔑 Temporary password: ${tempPassword}`);
    console.log('  ⚠️  Please change this password immediately!');
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

async function main() {
  const args = process.argv.slice(2);

  const options: InitOptions = {
    force: args.includes('--force'),
    skipMigrations: args.includes('--skip-migrations'),
    skipSeeding: args.includes('--skip-seeding'),
    createBackup: args.includes('--create-backup'),
    environment: (args.includes('--env') ? args[args.indexOf('--env') + 1] : 'development') as any,
  };

  if (args.includes('--data-path')) {
    options.dataPath = args[args.indexOf('--data-path') + 1];
  }

  if (args.includes('--help')) {
    console.log('DePIN Autopilot Database Initializer');
    console.log('\nUsage: tsx init.ts [options]');
    console.log('\nOptions:');
    console.log('  --force              Force reinitialize (remove existing database)');
    console.log('  --skip-migrations    Skip running migrations');
    console.log('  --skip-seeding       Skip seeding with sample data');
    console.log('  --create-backup      Create backup before reinitializing');
    console.log(
      '  --env <env>          Environment: development, production, test (default: development)',
    );
    console.log('  --data-path <path>   Custom database file path');
    console.log('  --help               Show this help message');
    console.log('\nExamples:');
    console.log('  tsx init.ts                                    # Initialize with defaults');
    console.log('  tsx init.ts --env production --skip-seeding    # Initialize for production');
    console.log('  tsx init.ts --force --create-backup           # Reinitialize with backup');
    return;
  }

  const initializer = new DatabaseInitializer(options);
  await initializer.initialize();
}

if (require.main === module) {
  main().catch(console.error);
}

export { DatabaseInitializer };
