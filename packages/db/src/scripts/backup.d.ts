#!/usr/bin/env tsx
interface BackupOptions {
  outputPath?: string;
  compress?: boolean;
  includeSchema?: boolean;
  tables?: string[];
  excludeTables?: string[];
}
interface BackupMetadata {
  timestamp: string;
  version: string;
  tables: string[];
  recordCounts: Record<string, number>;
  size: number;
  compressed: boolean;
}
declare class DatabaseBackup {
  private dbPath;
  constructor(dbPath?: string);
  createBackup(options?: BackupOptions): Promise<{
    backupPath: string;
    metadata: BackupMetadata;
  }>;
  listBackups(backupDir?: string): Promise<
    Array<{
      path: string;
      metadata: BackupMetadata;
      created: Date;
    }>
  >;
  cleanupOldBackups(
    retentionDays?: number,
    keepMinimum?: number,
    backupDir?: string,
  ): Promise<number>;
  private getAllTables;
  private getSchemaSQL;
  private exportTableData;
  private compressBackup;
  private formatBytes;
}
export { DatabaseBackup };
//# sourceMappingURL=backup.d.ts.map
