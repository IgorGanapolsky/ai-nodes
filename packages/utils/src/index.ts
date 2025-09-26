/**
 * @depinautopilot/utils
 * Shared utilities and helper functions for DePIN Autopilot
 */

// Configuration utilities
export * from './config';
export {
  loadConfig,
  getConfigValue,
  isDevelopment,
  isProduction,
  isTest,
  getDatabaseUrl,
  getRedisConfig,
  getCorsOrigins,
  configSchema,
  type Config,
} from './config';

// Logging utilities
export * from './logger';
export {
  Logger,
  getLogger,
  createLogger,
  createLoggerMiddleware,
  type LoggerOptions,
  type LogContext,
} from './logger';

// Error classes and utilities
export * from './errors';
export {
  BaseError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  InternalServerError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  DatabaseError,
  ExternalAPIError,
  BusinessLogicError,
  ConfigurationError,
  TimeoutError,
  isOperationalError,
  createHttpError,
  handleAsyncError,
} from './errors';

// Import TimeoutError separately for use in functions
import { TimeoutError } from './errors';

// Validation utilities
export * from './validators';
export {
  // Schemas
  emailSchema,
  urlSchema,
  uuidSchema,
  phoneSchema,
  positiveNumberSchema,
  nonNegativeNumberSchema,
  percentageSchema,
  priceSchema,
  nonEmptyStringSchema,
  alphanumericSchema,
  slugSchema,
  dateStringSchema,
  futureDateSchema,
  pastDateSchema,
  revSharePercentageSchema,
  walletAddressSchema,
  tokenSymbolSchema,
  paginationSchema,
  dateRangeSchema,

  // Validation functions
  isValidEmail,
  isValidUrl,
  isValidUuid,
  isValidPhoneNumber,
  isValidWalletAddress,
  isValidTokenSymbol,
  isValidPercentage,
  isValidPrice,
  isValidRevSharePercentage,
  sanitizeString,
  validateAndSanitizeEmail,
  validateAndNormalizePhone,
  createValidationMiddleware,
  createQueryValidationMiddleware,
  validateArray,
  validatePartial,
  transformAndValidate,
  safeValidate,

  // Types
  type PaginationParams,
  type DateRange,
  type ValidationResult,
} from './validators';

// Formatting utilities
export * from './formatters';
export {
  formatCurrency,
  formatCrypto,
  formatPercentage,
  formatPercentageChange,
  formatLargeNumber,
  formatNumberWithSuffix,
  formatDate,
  formatDuration,
  formatDurationFromSeconds,
  formatFileSize,
  formatPhoneNumber,
  truncateString,
  truncateMiddle,
  formatWalletAddress,
  formatHash,
  formatMarketCap,
  formatVolume,
  formatApiResponse,
  formatErrorResponse,
  formatPaginationMeta,
  formatListResponse,

  // Types
  type FormatCurrencyOptions,
  type FormatNumberOptions,
  type FormatDateOptions,
} from './formatters';

// Cryptographic utilities
export * from './crypto';
export {
  // ID generation
  generateUuid,
  generateId,
  generateToken,
  generateUrlSafeToken,
generateOtp,
  generateSecureRandomNumber,
  generateShortId,
  generateTimeBasedId,
  generateDatabaseId,
  createIdGenerator,

  // Specific ID generators
  generateApiKey,
  generateSessionId,
  generateRequestId,
  generateTransactionId,
  generateUserId,
  generateOrgId,
  generateProjectId,
  generateNodeId,
  generateDeviceId,
  generateNetworkId,
  generateContractAddress,
  generateWalletAddress,
  generateSecureFilename,

  // Hashing and cryptography
  generateHash,
  generateMd5,
  generateSha1,
  generateSha256,
  generateSha512,
  hashPassword,
  verifyPassword,
  generateJwtSecret,
  generateNonce,
  generateEntropy,
  generateHmacSignature,
  verifyHmacSignature,
  generateChecksum,
  validateChecksum,

  // Types
  type IdGenerator,
} from './crypto';

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
  } as const,

  // Common time constants (in milliseconds)
  TIME: {
    SECOND: 1000,
    MINUTE: 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000,
    WEEK: 7 * 24 * 60 * 60 * 1000,
    MONTH: 30 * 24 * 60 * 60 * 1000,
    YEAR: 365 * 24 * 60 * 60 * 1000,
  } as const,

  // Default pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  } as const,

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
  } as const,

  // File size limits
  FILE_SIZE: {
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
    MAX_AVATAR_SIZE: 5 * 1024 * 1024, // 5MB
    MAX_DOCUMENT_SIZE: 50 * 1024 * 1024, // 50MB
  } as const,

  // Rate limiting
  RATE_LIMIT: {
    DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    DEFAULT_MAX_REQUESTS: 100,
    STRICT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
    STRICT_MAX_REQUESTS: 50,
  } as const,

  // Crypto/DePIN specific
  CRYPTO: {
    DEFAULT_DECIMALS: 18,
    BTC_DECIMALS: 8,
    ETH_DECIMALS: 18,
    USDC_DECIMALS: 6,
    USDT_DECIMALS: 6,
  } as const,
} as const;

// Utility functions that don't fit into other categories
/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
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
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {return obj;}
  if (obj instanceof Date) {return new Date(obj.getTime()) as unknown as T;}
  if (obj instanceof Array) {return obj.map((item) => deepClone(item)) as unknown as T;}
  if (typeof obj === 'object') {
    const copy: any = {};
    Object.keys(obj).forEach((key) => {
      copy[key] = deepClone((obj as any)[key]);
    });
    return copy;
  }
  return obj;
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) {return true;}
  if (Array.isArray(obj) || typeof obj === 'string') {return obj.length === 0;}
  if (obj instanceof Map || obj instanceof Set) {return obj.size === 0;}
  if (typeof obj === 'object') {return Object.keys(obj).length === 0;}
  return false;
}

/**
 * Retry an async operation with exponential backoff
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 30000,
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxRetries) {
        throw lastError;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await sleep(delay);
    }
  }

  throw lastError!;
}

/**
 * Create a promise that times out
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new TimeoutError('withTimeout', timeoutMs)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}
