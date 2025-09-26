#!/usr/bin/env tsx
interface InitOptions {
  force?: boolean;
  skipMigrations?: boolean;
  skipSeeding?: boolean;
  createBackup?: boolean;
  environment?: 'development' | 'production' | 'test';
  dataPath?: string;
}
declare class DatabaseInitializer {
  private options;
  constructor(options?: InitOptions);
  initialize(): Promise<void>;
  private databaseExists;
  private ensureDataDirectory;
  private verifyDatabaseStructure;
  private runHealthCheck;
  private createInitialAdminUser;
  private generateTempPassword;
}
export { DatabaseInitializer };
//# sourceMappingURL=init.d.ts.map
