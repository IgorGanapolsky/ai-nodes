/**
 * Base error class for all custom errors in the application
 */
export declare abstract class BaseError extends Error {
    readonly name: string;
    readonly statusCode: number;
    readonly isOperational: boolean;
    readonly context?: Record<string, any>;
    readonly timestamp: Date;
    constructor(message: string, statusCode?: number, isOperational?: boolean, context?: Record<string, any>);
    /**
     * Serialize error for logging or API responses
     */
    toJSON(): Record<string, any>;
    /**
     * Get safe error details for API responses (excludes sensitive info)
     */
    toSafeJSON(): Record<string, any>;
    /**
     * Get context with sensitive data removed
     */
    private getSafeContext;
}
/**
 * HTTP 400 Bad Request error
 */
export declare class BadRequestError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 401 Unauthorized error
 */
export declare class UnauthorizedError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 403 Forbidden error
 */
export declare class ForbiddenError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 404 Not Found error
 */
export declare class NotFoundError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 409 Conflict error
 */
export declare class ConflictError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 422 Unprocessable Entity error (validation errors)
 */
export declare class ValidationError extends BaseError {
    readonly validationErrors?: Record<string, string[]>;
    constructor(message?: string, validationErrors?: Record<string, string[]>, context?: Record<string, any>);
    toJSON(): Record<string, any>;
    toSafeJSON(): Record<string, any>;
}
/**
 * HTTP 429 Too Many Requests error
 */
export declare class RateLimitError extends BaseError {
    readonly retryAfter?: number;
    constructor(message?: string, retryAfter?: number, context?: Record<string, any>);
    toJSON(): Record<string, any>;
    toSafeJSON(): Record<string, any>;
}
/**
 * HTTP 500 Internal Server Error
 */
export declare class InternalServerError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 502 Bad Gateway error
 */
export declare class BadGatewayError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 503 Service Unavailable error
 */
export declare class ServiceUnavailableError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * HTTP 504 Gateway Timeout error
 */
export declare class GatewayTimeoutError extends BaseError {
    constructor(message?: string, context?: Record<string, any>);
}
/**
 * Database-related errors
 */
export declare class DatabaseError extends BaseError {
    readonly query?: string;
    readonly parameters?: any[];
    constructor(message: string, query?: string, parameters?: any[], context?: Record<string, any>);
    toJSON(): Record<string, any>;
    toSafeJSON(): Record<string, any>;
}
/**
 * External API errors
 */
export declare class ExternalAPIError extends BaseError {
    readonly service: string;
    readonly endpoint?: string;
    readonly responseStatus?: number;
    readonly responseData?: any;
    constructor(service: string, message: string, endpoint?: string, responseStatus?: number, responseData?: any, context?: Record<string, any>);
    toJSON(): Record<string, any>;
    toSafeJSON(): Record<string, any>;
}
/**
 * Business logic errors
 */
export declare class BusinessLogicError extends BaseError {
    readonly code: string;
    constructor(code: string, message: string, context?: Record<string, any>);
    toJSON(): Record<string, any>;
    toSafeJSON(): Record<string, any>;
}
/**
 * Configuration errors
 */
export declare class ConfigurationError extends BaseError {
    constructor(message: string, context?: Record<string, any>);
}
/**
 * Network/timeout errors
 */
export declare class TimeoutError extends BaseError {
    readonly operation: string;
    readonly timeoutMs: number;
    constructor(operation: string, timeoutMs: number, context?: Record<string, any>);
    toJSON(): Record<string, any>;
    toSafeJSON(): Record<string, any>;
}
/**
 * Check if an error is an operational error (expected) vs programming error
 */
export declare function isOperationalError(error: Error): boolean;
/**
 * Create appropriate error from HTTP status code
 */
export declare function createHttpError(statusCode: number, message?: string, context?: Record<string, any>): BaseError;
/**
 * Error handler utility for async functions
 */
export declare function handleAsyncError<T extends any[], R>(fn: (...args: T) => Promise<R>): (...args: T) => Promise<R>;
//# sourceMappingURL=errors.d.ts.map