/**
 * @depinautopilot/utils
 * Shared utilities and helper functions for DePIN Autopilot
 */
// Configuration utilities
export * from './config.js';
export { loadConfig, getConfigValue, isDevelopment, isProduction, isTest, getDatabaseUrl, getRedisConfig, getCorsOrigins, configSchema, } from './config.js';
// Logging utilities
export * from './logger.js';
export { Logger, getLogger, createLogger, createLoggerMiddleware, } from './logger.js';
// Error classes and utilities
export * from './errors.js';
export { BaseError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError, RateLimitError, InternalServerError, BadGatewayError, ServiceUnavailableError, GatewayTimeoutError, DatabaseError, ExternalAPIError, BusinessLogicError, ConfigurationError, TimeoutError, isOperationalError, createHttpError, handleAsyncError, } from './errors.js';
// Validation utilities
export * from './validators.js';
export { 
// Schemas
emailSchema, urlSchema, uuidSchema, phoneSchema, positiveNumberSchema, nonNegativeNumberSchema, percentageSchema, priceSchema, nonEmptyStringSchema, alphanumericSchema, slugSchema, dateStringSchema, futureDateSchema, pastDateSchema, revSharePercentageSchema, walletAddressSchema, tokenSymbolSchema, paginationSchema, dateRangeSchema, 
// Validation functions
isValidEmail, isValidUrl, isValidUuid, isValidPhoneNumber, isValidWalletAddress, isValidTokenSymbol, isValidPercentage, isValidPrice, isValidRevSharePercentage, sanitizeString, validateAndSanitizeEmail, validateAndNormalizePhone, createValidationMiddleware, createQueryValidationMiddleware, validateArray, validatePartial, transformAndValidate, safeValidate, } from './validators.js';
// Formatting utilities
export * from './formatters.js';
export { formatCurrency, formatCrypto, formatPercentage, formatPercentageChange, formatLargeNumber, formatNumberWithSuffix, formatDate, formatDuration, formatDurationFromSeconds, formatFileSize, formatPhoneNumber, truncateString, truncateMiddle, formatWalletAddress, formatHash, formatMarketCap, formatVolume, formatApiResponse, formatErrorResponse, formatPaginationMeta, formatListResponse, } from './formatters.js';
// Cryptographic utilities
export * from './crypto.js';
export { 
// ID generation
generateUuid, generateId, generateToken, generateUrlSafeToken, generateOtp, generateSecureRandomNumber, generateShortId, generateTimeBasedId, generateDatabaseId, createIdGenerator, 
// Specific ID generators
generateApiKey, generateSessionId, generateRequestId, generateTransactionId, generateUserId, generateOrgId, generateProjectId, generateNodeId, generateDeviceId, generateNetworkId, generateContractAddress, generateWalletAddress, generateSecureFilename, 
// Hashing and cryptography
generateHash, generateMd5, generateSha1, generateSha256, generateSha512, hashPassword, verifyPassword, generateJwtSecret, generateNonce, generateEntropy, generateHmacSignature, verifyHmacSignature, generateChecksum, validateChecksum, } from './crypto.js';
// Common constants
export const COMMON_CONSTANTS = {
    // HTTP status codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504,
    },
    // Common time constants (in milliseconds)
    TIME: {
        SECOND: 1000,
        MINUTE: 60 * 1000,
        HOUR: 60 * 60 * 1000,
        DAY: 24 * 60 * 60 * 1000,
        WEEK: 7 * 24 * 60 * 60 * 1000,
        MONTH: 30 * 24 * 60 * 60 * 1000,
        YEAR: 365 * 24 * 60 * 60 * 1000,
    },
    // Default pagination
    PAGINATION: {
        DEFAULT_PAGE: 1,
        DEFAULT_LIMIT: 20,
        MAX_LIMIT: 100,
    },
    // Validation limits
    VALIDATION: {
        MIN_PASSWORD_LENGTH: 8,
        MAX_PASSWORD_LENGTH: 128,
        MIN_USERNAME_LENGTH: 3,
        MAX_USERNAME_LENGTH: 30,
        MAX_EMAIL_LENGTH: 254,
        MAX_NAME_LENGTH: 100,
        MAX_DESCRIPTION_LENGTH: 1000,
        MAX_URL_LENGTH: 2048,
    },
    // File size limits
    FILE_SIZE: {
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
    },
    // Rate limiting
    RATE_LIMIT: {
        DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        DEFAULT_MAX_REQUESTS: 100,
        STRICT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
        STRICT_MAX_REQUESTS: 50,
    },
    // Crypto/DePIN specific
    CRYPTO: {
        DEFAULT_DECIMALS: 18,
        BTC_DECIMALS: 8,
        ETH_DECIMALS: 18,
        USDC_DECIMALS: 6,
        USDT_DECIMALS: 6,
    },
};
// Utility functions that don't fit into other categories
/**
 * Sleep for specified milliseconds
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Create a debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
/**
 * Create a throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
/**
 * Deep clone an object
 */
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (obj instanceof Array)
        return obj.map(item => deepClone(item));
    if (typeof obj === 'object') {
        const copy = {};
        Object.keys(obj).forEach(key => {
            copy[key] = deepClone(obj[key]);
        });
        return copy;
    }
    return obj;
}
/**
 * Check if object is empty
 */
export function isEmpty(obj) {
    if (obj == null)
        return true;
    if (Array.isArray(obj) || typeof obj === 'string')
        return obj.length === 0;
    if (obj instanceof Map || obj instanceof Set)
        return obj.size === 0;
    if (typeof obj === 'object')
        return Object.keys(obj).length === 0;
    return false;
}
/**
 * Retry an async operation with exponential backoff
 */
export async function retry(operation, maxRetries = 3, baseDelay = 1000, maxDelay = 30000) {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        }
        catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (attempt === maxRetries) {
                throw lastError;
            }
            const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
            await sleep(delay);
        }
    }
    throw lastError;
}
/**
 * Create a promise that times out
 */
export function withTimeout(promise, timeoutMs) {
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new TimeoutError('Promise timeout', timeoutMs)), timeoutMs);
    });
    return Promise.race([promise, timeoutPromise]);
}
// Re-export everything as default export for convenience
export default {
    // Config
    loadConfig,
    getConfigValue,
    isDevelopment,
    isProduction,
    isTest,
    // Logger
    getLogger,
    createLogger,
    Logger,
    // Errors
    BaseError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
    createHttpError,
    // Validation
    isValidEmail,
    isValidUrl,
    isValidUuid,
    validateAndSanitizeEmail,
    // Formatting
    formatCurrency,
    formatPercentage,
    formatDate,
    formatDuration,
    truncateString,
    formatApiResponse,
    // Crypto
    generateUuid,
    generateId,
    generateToken,
    generateUserId,
    generateHash,
    hashPassword,
    verifyPassword,
    // Utilities
    sleep,
    debounce,
    throttle,
    deepClone,
    isEmpty,
    retry,
    withTimeout,
    // Constants
    COMMON_CONSTANTS,
};
