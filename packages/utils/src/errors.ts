/**
 * Base error class for all custom errors in the application
 */
export abstract class BaseError extends Error {
  public readonly name: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>,
  ) {
    super(message);

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
  }

  /**
   * Serialize error for logging or API responses
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
    };
  }

  /**
   * Get safe error details for API responses (excludes sensitive info)
   */
  toSafeJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      statusCode: this.statusCode,
      timestamp: this.timestamp,
      context: this.getSafeContext(),
    };
  }

  /**
   * Get context with sensitive data removed
   */
  private getSafeContext(): Record<string, any> | undefined {
    if (!this.context) return undefined;

    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'authorization', 'auth'];
    const safeContext = { ...this.context };

    for (const key of Object.keys(safeContext)) {
      if (sensitiveKeys.some((sensitive) => key.toLowerCase().includes(sensitive))) {
        safeContext[key] = '[REDACTED]';
      }
    }

    return safeContext;
  }
}

/**
 * HTTP 400 Bad Request error
 */
export class BadRequestError extends BaseError {
  constructor(message: string = 'Bad Request', context?: Record<string, any>) {
    super(message, 400, true, context);
  }
}

/**
 * HTTP 401 Unauthorized error
 */
export class UnauthorizedError extends BaseError {
  constructor(message: string = 'Unauthorized', context?: Record<string, any>) {
    super(message, 401, true, context);
  }
}

/**
 * HTTP 403 Forbidden error
 */
export class ForbiddenError extends BaseError {
  constructor(message: string = 'Forbidden', context?: Record<string, any>) {
    super(message, 403, true, context);
  }
}

/**
 * HTTP 404 Not Found error
 */
export class NotFoundError extends BaseError {
  constructor(message: string = 'Not Found', context?: Record<string, any>) {
    super(message, 404, true, context);
  }
}

/**
 * HTTP 409 Conflict error
 */
export class ConflictError extends BaseError {
  constructor(message: string = 'Conflict', context?: Record<string, any>) {
    super(message, 409, true, context);
  }
}

/**
 * HTTP 422 Unprocessable Entity error (validation errors)
 */
export class ValidationError extends BaseError {
  public readonly validationErrors?: Record<string, string[]>;

  constructor(
    message: string = 'Validation Error',
    validationErrors?: Record<string, string[]>,
    context?: Record<string, any>,
  ) {
    super(message, 422, true, context);
    this.validationErrors = validationErrors;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }

  toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      validationErrors: this.validationErrors,
    };
  }
}

/**
 * HTTP 429 Too Many Requests error
 */
export class RateLimitError extends BaseError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Too Many Requests',
    retryAfter?: number,
    context?: Record<string, any>,
  ) {
    super(message, 429, true, context);
    this.retryAfter = retryAfter;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }

  toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      retryAfter: this.retryAfter,
    };
  }
}

/**
 * HTTP 500 Internal Server Error
 */
export class InternalServerError extends BaseError {
  constructor(message: string = 'Internal Server Error', context?: Record<string, any>) {
    super(message, 500, true, context);
  }
}

/**
 * HTTP 502 Bad Gateway error
 */
export class BadGatewayError extends BaseError {
  constructor(message: string = 'Bad Gateway', context?: Record<string, any>) {
    super(message, 502, true, context);
  }
}

/**
 * HTTP 503 Service Unavailable error
 */
export class ServiceUnavailableError extends BaseError {
  constructor(message: string = 'Service Unavailable', context?: Record<string, any>) {
    super(message, 503, true, context);
  }
}

/**
 * HTTP 504 Gateway Timeout error
 */
export class GatewayTimeoutError extends BaseError {
  constructor(message: string = 'Gateway Timeout', context?: Record<string, any>) {
    super(message, 504, true, context);
  }
}

/**
 * Database-related errors
 */
export class DatabaseError extends BaseError {
  public readonly query?: string;
  public readonly parameters?: any[];

  constructor(message: string, query?: string, parameters?: any[], context?: Record<string, any>) {
    super(message, 500, true, context);
    this.query = query;
    this.parameters = parameters;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      query: this.query,
      parameters: this.parameters,
    };
  }

  // Don't include sensitive query info in safe JSON
  toSafeJSON(): Record<string, any> {
    return super.toSafeJSON();
  }
}

/**
 * External API errors
 */
export class ExternalAPIError extends BaseError {
  public readonly service: string;
  public readonly endpoint?: string;
  public readonly responseStatus?: number;
  public readonly responseData?: any;

  constructor(
    service: string,
    message: string,
    endpoint?: string,
    responseStatus?: number,
    responseData?: any,
    context?: Record<string, any>,
  ) {
    super(`${service} API Error: ${message}`, responseStatus || 502, true, context);
    this.service = service;
    this.endpoint = endpoint;
    this.responseStatus = responseStatus;
    this.responseData = responseData;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      service: this.service,
      endpoint: this.endpoint,
      responseStatus: this.responseStatus,
      responseData: this.responseData,
    };
  }

  toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      service: this.service,
      endpoint: this.endpoint,
      responseStatus: this.responseStatus,
    };
  }
}

/**
 * Business logic errors
 */
export class BusinessLogicError extends BaseError {
  public readonly code: string;

  constructor(code: string, message: string, context?: Record<string, any>) {
    super(message, 400, true, context);
    this.code = code;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      code: this.code,
    };
  }

  toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      code: this.code,
    };
  }
}

/**
 * Configuration errors
 */
export class ConfigurationError extends BaseError {
  constructor(message: string, context?: Record<string, any>) {
    super(`Configuration Error: ${message}`, 500, false, context);
  }
}

/**
 * Network/timeout errors
 */
export class TimeoutError extends BaseError {
  public readonly operation: string;
  public readonly timeoutMs: number;

  constructor(operation: string, timeoutMs: number, context?: Record<string, any>) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, 504, true, context);
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }

  toJSON(): Record<string, any> {
    return {
      ...super.toJSON(),
      operation: this.operation,
      timeoutMs: this.timeoutMs,
    };
  }

  toSafeJSON(): Record<string, any> {
    return {
      ...super.toSafeJSON(),
      operation: this.operation,
      timeoutMs: this.timeoutMs,
    };
  }
}

/**
 * Check if an error is an operational error (expected) vs programming error
 */
export function isOperationalError(error: Error): boolean {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}

/**
 * Create appropriate error from HTTP status code
 */
export function createHttpError(
  statusCode: number,
  message?: string,
  context?: Record<string, any>,
): BaseError {
  switch (statusCode) {
    case 400:
      return new BadRequestError(message, context);
    case 401:
      return new UnauthorizedError(message, context);
    case 403:
      return new ForbiddenError(message, context);
    case 404:
      return new NotFoundError(message, context);
    case 409:
      return new ConflictError(message, context);
    case 422:
      return new ValidationError(message, undefined, context);
    case 429:
      return new RateLimitError(message, undefined, context);
    case 502:
      return new BadGatewayError(message, context);
    case 503:
      return new ServiceUnavailableError(message, context);
    case 504:
      return new GatewayTimeoutError(message, context);
    default:
      return new InternalServerError(message, context);
  }
}

/**
 * Error handler utility for async functions
 */
export function handleAsyncError<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof BaseError) {
        throw error;
      }

      // Convert unknown errors to internal server errors
      throw new InternalServerError(
        error instanceof Error ? error.message : 'Unknown error occurred',
        { originalError: error },
      );
    }
  };
}
