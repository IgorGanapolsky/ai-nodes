import { z } from 'zod';
import * as dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();
const configSchema = z.object({
    DATABASE_URL: z.string(),
    PORT: z.number().default(4000),
    HOST: z.string().default('0.0.0.0'),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    JWT_SECRET: z.string(),
    DEFAULT_REV_SHARE_PCT: z.number().default(0.15),
    RESEND_API_KEY: z.string().optional(),
    DISCORD_WEBHOOK_DEFAULT: z.string().optional(),
    FEATURE_SCRAPE: z.boolean().default(false),
    FEATURE_AUTO_REPRICE: z.boolean().default(false),
    // Database configuration
    DB_HOST: z.string().optional(),
    DB_PORT: z.number().optional(),
    DB_USERNAME: z.string().optional(),
    DB_PASSWORD: z.string().optional(),
    DB_DATABASE: z.string().optional(),
    // Redis configuration
    REDIS_URL: z.string().optional(),
    REDIS_HOST: z.string().optional(),
    REDIS_PORT: z.number().optional(),
    REDIS_PASSWORD: z.string().optional(),
    // External API configuration
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    COINGECKO_API_KEY: z.string().optional(),
    // Security
    CORS_ORIGINS: z.string().optional(),
    RATE_LIMIT_WINDOW_MS: z.number().default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.number().default(100),
    // Node environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // Monitoring and observability
    SENTRY_DSN: z.string().optional(),
    METRICS_ENABLED: z.boolean().default(false),
    HEALTH_CHECK_TIMEOUT: z.number().default(30000),
});
/**
 * Load and validate configuration from environment variables
 * @returns Validated configuration object
 * @throws Error if required environment variables are missing or invalid
 */
export function loadConfig() {
    try {
        // Parse numeric environment variables
        const envVars = {
            ...process.env,
            PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : undefined,
            DEFAULT_REV_SHARE_PCT: process.env.DEFAULT_REV_SHARE_PCT
                ? parseFloat(process.env.DEFAULT_REV_SHARE_PCT)
                : undefined,
            DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : undefined,
            REDIS_PORT: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : undefined,
            RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS
                ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10)
                : undefined,
            RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS
                ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10)
                : undefined,
            HEALTH_CHECK_TIMEOUT: process.env.HEALTH_CHECK_TIMEOUT
                ? parseInt(process.env.HEALTH_CHECK_TIMEOUT, 10)
                : undefined,
            // Parse boolean environment variables
            FEATURE_SCRAPE: process.env.FEATURE_SCRAPE === 'true',
            FEATURE_AUTO_REPRICE: process.env.FEATURE_AUTO_REPRICE === 'true',
            METRICS_ENABLED: process.env.METRICS_ENABLED === 'true',
        };
        return configSchema.parse(envVars);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const missingFields = error.errors
                .filter(err => err.code === 'invalid_type')
                .map(err => err.path.join('.'));
            throw new Error(`Configuration validation failed. Missing or invalid fields: ${missingFields.join(', ')}\n` +
                `Full validation errors: ${JSON.stringify(error.errors, null, 2)}`);
        }
        throw error;
    }
}
/**
 * Get configuration value with type safety
 * @param key Configuration key
 * @returns Configuration value
 */
export function getConfigValue(key) {
    const config = loadConfig();
    return config[key];
}
/**
 * Check if running in development mode
 */
export function isDevelopment() {
    return getConfigValue('NODE_ENV') === 'development';
}
/**
 * Check if running in production mode
 */
export function isProduction() {
    return getConfigValue('NODE_ENV') === 'production';
}
/**
 * Check if running in test mode
 */
export function isTest() {
    return getConfigValue('NODE_ENV') === 'test';
}
/**
 * Get database connection URL
 */
export function getDatabaseUrl() {
    return getConfigValue('DATABASE_URL');
}
/**
 * Get Redis connection configuration
 */
export function getRedisConfig() {
    const config = loadConfig();
    return {
        url: config.REDIS_URL,
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
    };
}
/**
 * Get CORS origins as array
 */
export function getCorsOrigins() {
    const origins = getConfigValue('CORS_ORIGINS');
    if (!origins)
        return ['*'];
    return origins.split(',').map(origin => origin.trim());
}
// Export the config schema for external validation
export { configSchema };
