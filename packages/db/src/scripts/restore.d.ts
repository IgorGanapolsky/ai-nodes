#!/usr/bin/env tsx
interface RestoreOptions {
    backupPath: string;
    force?: boolean;
    skipData?: boolean;
    skipSchema?: boolean;
    tables?: string[];
    dryRun?: boolean;
}
declare class DatabaseRestore {
    private dbPath;
    constructor(dbPath?: string);
    restoreFromBackup(options: RestoreOptions): Promise<void>;
    listAvailableBackups(backupDir?: string): Promise<void>;
    private decompressBackup;
    private parseSQLStatements;
    private isSchemaStatement;
    private isDataStatement;
    private executeStatements;
    private verifyRestore;
    private formatBytes;
}
export { DatabaseRestore };
//# sourceMappingURL=restore.d.ts.map