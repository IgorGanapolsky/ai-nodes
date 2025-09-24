#!/usr/bin/env tsx
import { getConnection } from '../connection';
import { sql } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { DatabaseBackup } from './backup';
class DatabaseRestore {
    dbPath;
    constructor(dbPath) {
        this.dbPath = dbPath || process.env.DATABASE_URL || './data/app.db';
    }
    async restoreFromBackup(options) {
        const { backupPath, force = false, skipData = false, skipSchema = false, tables, dryRun = false } = options;
        console.log(`🔄 Starting database restore from: ${backupPath}`);
        if (dryRun) {
            console.log('🧪 DRY RUN MODE - No changes will be made');
        }
        try {
            // Check if backup file exists
            await fs.access(backupPath);
            // Load backup metadata if available
            const metadataPath = backupPath.replace(/\.(sql|gz)$/, '.meta.json');
            let metadata = null;
            try {
                const metadataContent = await fs.readFile(metadataPath, 'utf8');
                metadata = JSON.parse(metadataContent);
                console.log(`📊 Backup metadata loaded:`);
                console.log(`   Created: ${metadata.timestamp}`);
                console.log(`   Tables: ${metadata.tables?.join(', ') || 'unknown'}`);
                console.log(`   Records: ${Object.values(metadata.recordCounts || {}).reduce((sum, count) => sum + count, 0)}`);
            }
            catch (error) {
                console.warn('⚠️  Could not load backup metadata');
            }
            // Check if database exists and warn user
            if (!force && !dryRun) {
                try {
                    await fs.access(this.dbPath);
                    console.log('⚠️  Database file already exists!');
                    console.log('   Use --force to overwrite existing database');
                    console.log('   Or use --dry-run to see what would be restored');
                    return;
                }
                catch {
                    // Database doesn't exist, which is fine
                }
            }
            // Decompress backup if needed
            let sqlFilePath = backupPath;
            if (backupPath.endsWith('.gz')) {
                console.log('📦 Decompressing backup...');
                sqlFilePath = await this.decompressBackup(backupPath);
            }
            // Read SQL content
            console.log('📖 Reading backup content...');
            const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
            // Parse SQL statements
            const statements = this.parseSQLStatements(sqlContent);
            console.log(`📝 Found ${statements.length} SQL statements`);
            // Filter statements based on options
            let filteredStatements = statements;
            if (skipSchema) {
                filteredStatements = filteredStatements.filter(stmt => !this.isSchemaStatement(stmt));
                console.log(`🚫 Skipping schema statements`);
            }
            if (skipData) {
                filteredStatements = filteredStatements.filter(stmt => !this.isDataStatement(stmt));
                console.log(`🚫 Skipping data statements`);
            }
            if (tables && tables.length > 0) {
                filteredStatements = filteredStatements.filter(stmt => tables.some(table => stmt.toLowerCase().includes(table.toLowerCase())));
                console.log(`🎯 Filtering for tables: ${tables.join(', ')}`);
            }
            console.log(`✅ Will execute ${filteredStatements.length} statements`);
            if (dryRun) {
                console.log('\n📋 Statements to be executed:');
                filteredStatements.forEach((stmt, index) => {
                    console.log(`  ${index + 1}. ${stmt.substring(0, 100)}${stmt.length > 100 ? '...' : ''}`);
                });
                console.log('\n🧪 Dry run completed - no changes made');
                return;
            }
            // Backup existing database if it exists and force is used
            if (force) {
                try {
                    await fs.access(this.dbPath);
                    const backupTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
                    const backupName = `pre-restore-backup-${backupTimestamp}.db`;
                    const preRestoreBackup = path.join(path.dirname(this.dbPath), backupName);
                    console.log(`💾 Creating pre-restore backup: ${backupName}`);
                    await fs.copyFile(this.dbPath, preRestoreBackup);
                }
                catch {
                    // No existing database to backup
                }
            }
            // Execute restore
            console.log('🔄 Executing restore...');
            await this.executeStatements(filteredStatements);
            // Clean up temporary decompressed file
            if (sqlFilePath !== backupPath) {
                await fs.unlink(sqlFilePath);
            }
            console.log('✅ Database restore completed successfully!');
            // Verify restore
            if (metadata) {
                console.log('🔍 Verifying restore...');
                await this.verifyRestore(metadata);
            }
        }
        catch (error) {
            console.error('❌ Restore failed:', error);
            throw error;
        }
    }
    async listAvailableBackups(backupDir) {
        const backup = new DatabaseBackup();
        const backups = await backup.listBackups(backupDir);
        if (backups.length === 0) {
            console.log('📭 No backups found');
            return;
        }
        console.log(`📋 Available backups (${backups.length}):`);
        backups.forEach((backup, index) => {
            console.log(`\n  ${index + 1}. ${path.basename(backup.path)}`);
            console.log(`     📅 Created: ${backup.created.toLocaleString()}`);
            console.log(`     📊 Size: ${this.formatBytes(backup.metadata.size)}`);
            console.log(`     🗃️  Tables: ${backup.metadata.tables?.length || 0}`);
            console.log(`     📈 Records: ${Object.values(backup.metadata.recordCounts || {}).reduce((sum, count) => sum + count, 0)}`);
            console.log(`     🗜️  Compressed: ${backup.metadata.compressed ? 'Yes' : 'No'}`);
        });
    }
    async decompressBackup(filePath) {
        const outputPath = filePath.replace('.gz', '');
        return new Promise((resolve, reject) => {
            const gunzip = spawn('gunzip', ['-c', filePath]);
            const output = fs.open(outputPath, 'w');
            gunzip.stdout.pipe(require('fs').createWriteStream(outputPath));
            gunzip.on('close', (code) => {
                if (code === 0) {
                    resolve(outputPath);
                }
                else {
                    reject(new Error(`gunzip process exited with code ${code}`));
                }
            });
            gunzip.on('error', reject);
        });
    }
    parseSQLStatements(sqlContent) {
        // Split by semicolons, but be careful with string literals
        const statements = [];
        let current = '';
        let inString = false;
        let stringChar = '';
        for (let i = 0; i < sqlContent.length; i++) {
            const char = sqlContent[i];
            const prevChar = i > 0 ? sqlContent[i - 1] : '';
            if (!inString && (char === '"' || char === "'")) {
                inString = true;
                stringChar = char;
            }
            else if (inString && char === stringChar && prevChar !== '\\') {
                inString = false;
                stringChar = '';
            }
            else if (!inString && char === ';') {
                const statement = current.trim();
                if (statement && !statement.startsWith('--')) {
                    statements.push(statement);
                }
                current = '';
                continue;
            }
            current += char;
        }
        // Add final statement if exists
        const finalStatement = current.trim();
        if (finalStatement && !finalStatement.startsWith('--')) {
            statements.push(finalStatement);
        }
        return statements.filter(stmt => stmt.length > 0);
    }
    isSchemaStatement(statement) {
        const normalized = statement.toLowerCase().trim();
        return normalized.startsWith('create table') ||
            normalized.startsWith('create index') ||
            normalized.startsWith('create unique index');
    }
    isDataStatement(statement) {
        const normalized = statement.toLowerCase().trim();
        return normalized.startsWith('insert into') ||
            normalized.startsWith('delete from') ||
            normalized.startsWith('update ');
    }
    async executeStatements(statements) {
        const db = getConnection();
        let executed = 0;
        for (const statement of statements) {
            try {
                await db.run(statement);
                executed++;
                if (executed % 100 === 0) {
                    console.log(`  📈 Executed ${executed}/${statements.length} statements`);
                }
            }
            catch (error) {
                console.error(`❌ Failed to execute statement: ${statement.substring(0, 100)}...`);
                console.error(`   Error: ${error}`);
                throw error;
            }
        }
        console.log(`✅ Successfully executed ${executed} statements`);
    }
    async verifyRestore(metadata) {
        if (!metadata.recordCounts) {
            console.log('⚠️  No record counts in metadata, skipping verification');
            return;
        }
        const db = getConnection();
        let verificationPassed = true;
        for (const [tableName, expectedCount] of Object.entries(metadata.recordCounts)) {
            try {
                const result = await db.select({ count: sql `count(*)` }).from(sql.identifier(tableName));
                const actualCount = result[0]?.count || 0;
                if (actualCount === expectedCount) {
                    console.log(`  ✅ ${tableName}: ${actualCount} records (expected ${expectedCount})`);
                }
                else {
                    console.log(`  ❌ ${tableName}: ${actualCount} records (expected ${expectedCount})`);
                    verificationPassed = false;
                }
            }
            catch (error) {
                console.log(`  ⚠️  Could not verify table ${tableName}: ${error}`);
                verificationPassed = false;
            }
        }
        if (verificationPassed) {
            console.log('✅ Verification passed - all table counts match');
        }
        else {
            console.log('⚠️  Verification failed - some table counts do not match');
        }
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}
async function main() {
    const args = process.argv.slice(2);
    const restore = new DatabaseRestore();
    if (args.includes('--list')) {
        const backupDir = args.includes('--backup-dir') ? args[args.indexOf('--backup-dir') + 1] : undefined;
        await restore.listAvailableBackups(backupDir);
        return;
    }
    const backupPathIndex = args.findIndex(arg => !arg.startsWith('--'));
    if (backupPathIndex === -1) {
        console.error('❌ Please provide a backup file path');
        console.log('Usage: tsx restore.ts [options] <backup-file>');
        console.log('Options:');
        console.log('  --force         Overwrite existing database');
        console.log('  --skip-schema   Skip schema creation');
        console.log('  --skip-data     Skip data insertion');
        console.log('  --tables        Comma-separated list of tables to restore');
        console.log('  --dry-run       Show what would be done without making changes');
        console.log('  --list          List available backups');
        process.exit(1);
    }
    const backupPath = args[backupPathIndex];
    const options = {
        backupPath,
        force: args.includes('--force'),
        skipData: args.includes('--skip-data'),
        skipSchema: args.includes('--skip-schema'),
        dryRun: args.includes('--dry-run'),
    };
    if (args.includes('--tables')) {
        const tablesArg = args[args.indexOf('--tables') + 1];
        options.tables = tablesArg.split(',').map(t => t.trim());
    }
    await restore.restoreFromBackup(options);
}
if (require.main === module) {
    main().catch(console.error);
}
export { DatabaseRestore };
