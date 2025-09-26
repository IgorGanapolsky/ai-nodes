#!/usr/bin/env tsx
import { getConnection } from '../connection';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
class DatabaseBackup {
  dbPath;
  constructor(dbPath) {
    this.dbPath = dbPath || process.env.DATABASE_URL || './data/app.db';
  }
  async createBackup(options = {}) {
    const {
      outputPath,
      compress = true,
      includeSchema = true,
      tables,
      excludeTables = [],
    } = options;
    console.log('🔄 Starting database backup...');
    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = outputPath || path.join(process.cwd(), 'backups');
    await fs.mkdir(backupDir, { recursive: true });
    const backupName = `backup-${timestamp}.sql`;
    const backupPath = path.join(backupDir, backupName);
    try {
      // Get database connection for metadata
      const db = getConnection();
      // Get all tables
      const allTables = await this.getAllTables();
      const backupTables = tables || allTables.filter((table) => !excludeTables.includes(table));
      console.log(`📊 Backing up ${backupTables.length} tables: ${backupTables.join(', ')}`);
      // Create SQL dump
      let sqlContent = '';
      if (includeSchema) {
        sqlContent += await this.getSchemaSQL();
        sqlContent += '\n\n';
      }
      // Export table data
      const recordCounts = {};
      for (const table of backupTables) {
        console.log(`  🔄 Exporting table: ${table}`);
        const tableData = await this.exportTableData(table);
        sqlContent += tableData.sql;
        recordCounts[table] = tableData.count;
        console.log(`    ✅ Exported ${tableData.count} records`);
      }
      // Write backup file
      await fs.writeFile(backupPath, sqlContent, 'utf8');
      const stats = await fs.stat(backupPath);
      // Compress if requested
      let finalBackupPath = backupPath;
      if (compress) {
        console.log('🗜️  Compressing backup...');
        finalBackupPath = await this.compressBackup(backupPath);
        // Remove uncompressed file
        await fs.unlink(backupPath);
      }
      const finalStats = await fs.stat(finalBackupPath);
      const metadata = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: backupTables,
        recordCounts,
        size: finalStats.size,
        compressed: compress,
      };
      // Save metadata
      const metadataPath = finalBackupPath.replace(/\.(sql|gz)$/, '.meta.json');
      await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
      console.log('✅ Backup completed successfully!');
      console.log(`📁 Backup saved to: ${finalBackupPath}`);
      console.log(`📊 Total size: ${this.formatBytes(finalStats.size)}`);
      console.log(
        `📈 Total records: ${Object.values(recordCounts).reduce((sum, count) => sum + count, 0)}`,
      );
      return { backupPath: finalBackupPath, metadata };
    } catch (error) {
      console.error('❌ Backup failed:', error);
      throw error;
    }
  }
  async listBackups(backupDir) {
    const dir = backupDir || path.join(process.cwd(), 'backups');
    try {
      const files = await fs.readdir(dir);
      const backups = [];
      for (const file of files) {
        if (file.endsWith('.meta.json')) {
          const metadataPath = path.join(dir, file);
          const backupPath = metadataPath.replace('.meta.json', '');
          try {
            const metadataContent = await fs.readFile(metadataPath, 'utf8');
            const metadata = JSON.parse(metadataContent);
            const stats = await fs.stat(metadataPath);
            backups.push({
              path: backupPath,
              metadata,
              created: stats.birthtime,
            });
          } catch (error) {
            console.warn(`⚠️  Could not read metadata for ${file}:`, error);
          }
        }
      }
      return backups.sort((a, b) => b.created.getTime() - a.created.getTime());
    } catch (error) {
      console.error('❌ Failed to list backups:', error);
      return [];
    }
  }
  async cleanupOldBackups(retentionDays = 30, keepMinimum = 5, backupDir) {
    const backups = await this.listBackups(backupDir);
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const oldBackups = backups.filter((backup) => backup.created < cutoffDate);
    const toDelete = oldBackups.slice(keepMinimum);
    let deletedCount = 0;
    for (const backup of toDelete) {
      try {
        await fs.unlink(backup.path);
        await fs.unlink(backup.path.replace(/\.(sql|gz)$/, '.meta.json'));
        deletedCount++;
        console.log(`🗑️  Deleted old backup: ${path.basename(backup.path)}`);
      } catch (error) {
        console.warn(`⚠️  Could not delete backup ${backup.path}:`, error);
      }
    }
    return deletedCount;
  }
  async getAllTables() {
    const db = getConnection();
    const result = await db.all(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `);
    return result.map((row) => row.name);
  }
  async getSchemaSQL() {
    const db = getConnection();
    const result = await db.all(`
      SELECT sql FROM sqlite_master
      WHERE type IN ('table', 'index') AND name NOT LIKE 'sqlite_%'
      ORDER BY type DESC, name
    `);
    const sqlStatements = result
      .map((row) => row.sql)
      .filter(Boolean)
      .map((sql) => `${sql};`);
    return '-- Schema\n' + sqlStatements.join('\n') + '\n\n-- Data\n';
  }
  async exportTableData(tableName) {
    const db = getConnection();
    // Get column info
    const columns = await db.all(`PRAGMA table_info(${tableName})`);
    const columnNames = columns.map((col) => col.name);
    // Get all data
    const rows = await db.all(`SELECT * FROM ${tableName}`);
    if (rows.length === 0) {
      return { sql: `-- No data in table ${tableName}\n\n`, count: 0 };
    }
    let sql = `-- Data for table ${tableName}\n`;
    sql += `DELETE FROM ${tableName};\n`;
    const insertStatements = rows.map((row) => {
      const values = columnNames.map((col) => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        return value;
      });
      return `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${values.join(', ')});`;
    });
    sql += insertStatements.join('\n');
    sql += '\n\n';
    return { sql, count: rows.length };
  }
  async compressBackup(filePath) {
    const compressedPath = `${filePath}.gz`;
    return new Promise((resolve, reject) => {
      const gzip = spawn('gzip', ['-9', filePath]);
      gzip.on('close', (code) => {
        if (code === 0) {
          resolve(compressedPath);
        } else {
          reject(new Error(`gzip process exited with code ${code}`));
        }
      });
      gzip.on('error', reject);
    });
  }
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
async function main() {
  const args = process.argv.slice(2);
  const backup = new DatabaseBackup();
  if (args.includes('--list')) {
    console.log('📋 Available backups:');
    const backups = await backup.listBackups();
    if (backups.length === 0) {
      console.log('  No backups found');
      return;
    }
    backups.forEach((backup, index) => {
      console.log(`  ${index + 1}. ${path.basename(backup.path)}`);
      console.log(`     Created: ${backup.created.toLocaleString()}`);
      console.log(`     Size: ${backup.metadata.size} bytes`);
      console.log(`     Tables: ${backup.metadata.tables.length}`);
      console.log(
        `     Records: ${Object.values(backup.metadata.recordCounts).reduce((sum, count) => sum + count, 0)}`,
      );
      console.log();
    });
    return;
  }
  if (args.includes('--cleanup')) {
    const retentionDays = parseInt(args[args.indexOf('--retention') + 1]) || 30;
    const keepMinimum = parseInt(args[args.indexOf('--keep') + 1]) || 5;
    console.log(
      `🧹 Cleaning up backups older than ${retentionDays} days (keeping minimum ${keepMinimum})`,
    );
    const deletedCount = await backup.cleanupOldBackups(retentionDays, keepMinimum);
    console.log(`✅ Deleted ${deletedCount} old backups`);
    return;
  }
  // Create backup
  const options = {
    compress: !args.includes('--no-compress'),
    includeSchema: !args.includes('--no-schema'),
  };
  if (args.includes('--output')) {
    options.outputPath = args[args.indexOf('--output') + 1];
  }
  await backup.createBackup(options);
}
if (require.main === module) {
  main().catch(console.error);
}
export { DatabaseBackup };
