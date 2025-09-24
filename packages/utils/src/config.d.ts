import { z } from 'zod';
declare const configSchema: any;
export type Config = z.infer<typeof configSchema>;
/**
 * Load and validate configuration from environment variables
 * @returns Validated configuration object
 * @throws Error if required environment variables are missing or invalid
 */
export declare function loadConfig(): Config;
/**
 * Get configuration value with type safety
 * @param key Configuration key
 * @returns Configuration value
 */
export declare function getConfigValue<K extends keyof Config>(key: K): Config[K];
/**
 * Check if running in development mode
 */
export declare function isDevelopment(): boolean;
/**
 * Check if running in production mode
 */
export declare function isProduction(): boolean;
/**
 * Check if running in test mode
 */
export declare function isTest(): boolean;
/**
 * Get database connection URL
 */
export declare function getDatabaseUrl(): string;
/**
 * Get Redis connection configuration
 */
export declare function getRedisConfig(): {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
};
/**
 * Get CORS origins as array
 */
export declare function getCorsOrigins(): string[];
export { configSchema };
//# sourceMappingURL=config.d.ts.map