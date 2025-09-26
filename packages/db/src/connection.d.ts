import Database from 'better-sqlite3';
export interface DatabaseConfig {
  url?: string;
  enableWAL?: boolean;
  enableForeignKeys?: boolean;
  busyTimeout?: number;
  maxConnections?: number;
  readOnly?: boolean;
  verbose?: boolean;
}
export declare function createConnection(config?: DatabaseConfig): any;
export declare function getConnection(config?: DatabaseConfig): any;
export declare function closeConnection(): void;
export declare function runMigrations(migrationsFolder?: string): Promise<any>;
declare class ConnectionPool {
  private connections;
  private config;
  private maxConnections;
  constructor(config?: DatabaseConfig);
  getConnection(): Promise<Database.Database>;
  returnConnection(connection: Database.Database): void;
  private createNewConnection;
  close(): void;
}
export { ConnectionPool };
//# sourceMappingURL=connection.d.ts.map
