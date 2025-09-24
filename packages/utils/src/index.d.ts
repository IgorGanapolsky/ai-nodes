/**
 * @depinautopilot/utils
 * Shared utilities and helper functions for DePIN Autopilot
 */
export * from './config.js';
export { loadConfig, getConfigValue, isDevelopment, isProduction, isTest, getDatabaseUrl, getRedisConfig, getCorsOrigins, configSchema, type Config, } from './config.js';
export * from './logger.js';
export { Logger, getLogger, createLogger, createLoggerMiddleware, type LoggerOptions, type LogContext, } from './logger.js';
export * from './errors.js';
export { BaseError, BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError, ConflictError, ValidationError, RateLimitError, InternalServerError, BadGatewayError, ServiceUnavailableError, GatewayTimeoutError, DatabaseError, ExternalAPIError, BusinessLogicError, ConfigurationError, TimeoutError, isOperationalError, createHttpError, handleAsyncError, } from './errors.js';
export * from './validators.js';
export { emailSchema, urlSchema, uuidSchema, phoneSchema, positiveNumberSchema, nonNegativeNumberSchema, percentageSchema, priceSchema, nonEmptyStringSchema, alphanumericSchema, slugSchema, dateStringSchema, futureDateSchema, pastDateSchema, revSharePercentageSchema, walletAddressSchema, tokenSymbolSchema, paginationSchema, dateRangeSchema, isValidEmail, isValidUrl, isValidUuid, isValidPhoneNumber, isValidWalletAddress, isValidTokenSymbol, isValidPercentage, isValidPrice, isValidRevSharePercentage, sanitizeString, validateAndSanitizeEmail, validateAndNormalizePhone, createValidationMiddleware, createQueryValidationMiddleware, validateArray, validatePartial, transformAndValidate, safeValidate, type PaginationParams, type DateRange, type ValidationResult, } from './validators.js';
export * from './formatters.js';
export { formatCurrency, formatCrypto, formatPercentage, formatPercentageChange, formatLargeNumber, formatNumberWithSuffix, formatDate, formatDuration, formatDurationFromSeconds, formatFileSize, formatPhoneNumber, truncateString, truncateMiddle, formatWalletAddress, formatHash, formatMarketCap, formatVolume, formatApiResponse, formatErrorResponse, formatPaginationMeta, formatListResponse, type FormatCurrencyOptions, type FormatNumberOptions, type FormatDateOptions, } from './formatters.js';
export * from './crypto.js';
export { generateUuid, generateId, generateToken, generateUrlSafeToken, generateOtp, generateSecureRandomNumber, generateShortId, generateTimeBasedId, generateDatabaseId, createIdGenerator, generateApiKey, generateSessionId, generateRequestId, generateTransactionId, generateUserId, generateOrgId, generateProjectId, generateNodeId, generateDeviceId, generateNetworkId, generateContractAddress, generateWalletAddress, generateSecureFilename, generateHash, generateMd5, generateSha1, generateSha256, generateSha512, hashPassword, verifyPassword, generateJwtSecret, generateNonce, generateEntropy, generateHmacSignature, verifyHmacSignature, generateChecksum, validateChecksum, type IdGenerator, } from './crypto.js';
export declare const COMMON_CONSTANTS: {
    readonly HTTP_STATUS: {
        readonly OK: 200;
        readonly CREATED: 201;
        readonly NO_CONTENT: 204;
        readonly BAD_REQUEST: 400;
        readonly UNAUTHORIZED: 401;
        readonly FORBIDDEN: 403;
        readonly NOT_FOUND: 404;
        readonly CONFLICT: 409;
        readonly UNPROCESSABLE_ENTITY: 422;
        readonly TOO_MANY_REQUESTS: 429;
        readonly INTERNAL_SERVER_ERROR: 500;
        readonly BAD_GATEWAY: 502;
        readonly SERVICE_UNAVAILABLE: 503;
        readonly GATEWAY_TIMEOUT: 504;
    };
    readonly TIME: {
        readonly SECOND: 1000;
        readonly MINUTE: number;
        readonly HOUR: number;
        readonly DAY: number;
        readonly WEEK: number;
        readonly MONTH: number;
        readonly YEAR: number;
    };
    readonly PAGINATION: {
        readonly DEFAULT_PAGE: 1;
        readonly DEFAULT_LIMIT: 20;
        readonly MAX_LIMIT: 100;
    };
    readonly VALIDATION: {
        readonly MIN_PASSWORD_LENGTH: 8;
        readonly MAX_PASSWORD_LENGTH: 128;
        readonly MIN_USERNAME_LENGTH: 3;
        readonly MAX_USERNAME_LENGTH: 30;
        readonly MAX_EMAIL_LENGTH: 254;
        readonly MAX_NAME_LENGTH: 100;
        readonly MAX_DESCRIPTION_LENGTH: 1000;
        readonly MAX_URL_LENGTH: 2048;
    };
    readonly FILE_SIZE: {
        readonly KB: 1024;
        readonly MB: number;
        readonly GB: number;
        readonly MAX_AVATAR_SIZE: number;
        readonly MAX_DOCUMENT_SIZE: number;
    };
    readonly RATE_LIMIT: {
        readonly DEFAULT_WINDOW_MS: number;
        readonly DEFAULT_MAX_REQUESTS: 100;
        readonly STRICT_WINDOW_MS: number;
        readonly STRICT_MAX_REQUESTS: 50;
    };
    readonly CRYPTO: {
        readonly DEFAULT_DECIMALS: 18;
        readonly BTC_DECIMALS: 8;
        readonly ETH_DECIMALS: 18;
        readonly USDC_DECIMALS: 6;
        readonly USDT_DECIMALS: 6;
    };
};
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Create a debounced function
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Create a throttled function
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
/**
 * Deep clone an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Check if object is empty
 */
export declare function isEmpty(obj: any): boolean;
/**
 * Retry an async operation with exponential backoff
 */
export declare function retry<T>(operation: () => Promise<T>, maxRetries?: number, baseDelay?: number, maxDelay?: number): Promise<T>;
/**
 * Create a promise that times out
 */
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>;
declare const _default: {
    loadConfig: any;
    getConfigValue: any;
    isDevelopment: any;
    isProduction: any;
    isTest: any;
    getLogger: any;
    createLogger: any;
    Logger: any;
    BaseError: any;
    BadRequestError: any;
    UnauthorizedError: any;
    ForbiddenError: any;
    NotFoundError: any;
    ConflictError: any;
    ValidationError: any;
    createHttpError: any;
    isValidEmail: any;
    isValidUrl: any;
    isValidUuid: any;
    validateAndSanitizeEmail: any;
    formatCurrency: any;
    formatPercentage: any;
    formatDate: any;
    formatDuration: any;
    truncateString: any;
    formatApiResponse: any;
    generateUuid: any;
    generateId: any;
    generateToken: any;
    generateUserId: any;
    generateHash: any;
    hashPassword: any;
    verifyPassword: any;
    sleep: typeof sleep;
    debounce: typeof debounce;
    throttle: typeof throttle;
    deepClone: typeof deepClone;
    isEmpty: typeof isEmpty;
    retry: typeof retry;
    withTimeout: typeof withTimeout;
    COMMON_CONSTANTS: {
        readonly HTTP_STATUS: {
            readonly OK: 200;
            readonly CREATED: 201;
            readonly NO_CONTENT: 204;
            readonly BAD_REQUEST: 400;
            readonly UNAUTHORIZED: 401;
            readonly FORBIDDEN: 403;
            readonly NOT_FOUND: 404;
            readonly CONFLICT: 409;
            readonly UNPROCESSABLE_ENTITY: 422;
            readonly TOO_MANY_REQUESTS: 429;
            readonly INTERNAL_SERVER_ERROR: 500;
            readonly BAD_GATEWAY: 502;
            readonly SERVICE_UNAVAILABLE: 503;
            readonly GATEWAY_TIMEOUT: 504;
        };
        readonly TIME: {
            readonly SECOND: 1000;
            readonly MINUTE: number;
            readonly HOUR: number;
            readonly DAY: number;
            readonly WEEK: number;
            readonly MONTH: number;
            readonly YEAR: number;
        };
        readonly PAGINATION: {
            readonly DEFAULT_PAGE: 1;
            readonly DEFAULT_LIMIT: 20;
            readonly MAX_LIMIT: 100;
        };
        readonly VALIDATION: {
            readonly MIN_PASSWORD_LENGTH: 8;
            readonly MAX_PASSWORD_LENGTH: 128;
            readonly MIN_USERNAME_LENGTH: 3;
            readonly MAX_USERNAME_LENGTH: 30;
            readonly MAX_EMAIL_LENGTH: 254;
            readonly MAX_NAME_LENGTH: 100;
            readonly MAX_DESCRIPTION_LENGTH: 1000;
            readonly MAX_URL_LENGTH: 2048;
        };
        readonly FILE_SIZE: {
            readonly KB: 1024;
            readonly MB: number;
            readonly GB: number;
            readonly MAX_AVATAR_SIZE: number;
            readonly MAX_DOCUMENT_SIZE: number;
        };
        readonly RATE_LIMIT: {
            readonly DEFAULT_WINDOW_MS: number;
            readonly DEFAULT_MAX_REQUESTS: 100;
            readonly STRICT_WINDOW_MS: number;
            readonly STRICT_MAX_REQUESTS: 50;
        };
        readonly CRYPTO: {
            readonly DEFAULT_DECIMALS: 18;
            readonly BTC_DECIMALS: 8;
            readonly ETH_DECIMALS: 18;
            readonly USDC_DECIMALS: 6;
            readonly USDT_DECIMALS: 6;
        };
    };
};
export default _default;
//# sourceMappingURL=index.d.ts.map