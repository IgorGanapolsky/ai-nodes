/**
 * Base error class for all custom errors in the application
 */
export class BaseError extends Error {
  name;
  statusCode;
  isOperational;
  context;
  timestamp;
  constructor(message, statusCode = 500, isOperational = true, context) {
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
  toJSON() {
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
  toSafeJSON() {
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
  getSafeContext() {
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
  constructor(message = 'Bad Request', context) {
    super(message, 400, true, context);
  }
}
/**
 * HTTP 401 Unauthorized error
 */
export class UnauthorizedError extends BaseError {
  constructor(message = 'Unauthorized', context) {
    super(message, 401, true, context);
  }
}
/**
 * HTTP 403 Forbidden error
 */
export class ForbiddenError extends BaseError {
  constructor(message = 'Forbidden', context) {
    super(message, 403, true, context);
  }
}
/**
 * HTTP 404 Not Found error
 */
export class NotFoundError extends BaseError {
  constructor(message = 'Not Found', context) {
    super(message, 404, true, context);
  }
}
/**
 * HTTP 409 Conflict error
 */
export class ConflictError extends BaseError {
  constructor(message = 'Conflict', context) {
    super(message, 409, true, context);
  }
}
/**
 * HTTP 422 Unprocessable Entity error (validation errors)
 */
export class ValidationError extends BaseError {
  validationErrors;
  constructor(message = 'Validation Error', validationErrors, context) {
    super(message, 422, true, context);
    this.validationErrors = validationErrors;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      validationErrors: this.validationErrors,
    };
  }
  toSafeJSON() {
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
  retryAfter;
  constructor(message = 'Too Many Requests', retryAfter, context) {
    super(message, 429, true, context);
    this.retryAfter = retryAfter;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      retryAfter: this.retryAfter,
    };
  }
  toSafeJSON() {
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
  constructor(message = 'Internal Server Error', context) {
    super(message, 500, true, context);
  }
}
/**
 * HTTP 502 Bad Gateway error
 */
export class BadGatewayError extends BaseError {
  constructor(message = 'Bad Gateway', context) {
    super(message, 502, true, context);
  }
}
/**
 * HTTP 503 Service Unavailable error
 */
export class ServiceUnavailableError extends BaseError {
  constructor(message = 'Service Unavailable', context) {
    super(message, 503, true, context);
  }
}
/**
 * HTTP 504 Gateway Timeout error
 */
export class GatewayTimeoutError extends BaseError {
  constructor(message = 'Gateway Timeout', context) {
    super(message, 504, true, context);
  }
}
/**
 * Database-related errors
 */
export class DatabaseError extends BaseError {
  query;
  parameters;
  constructor(message, query, parameters, context) {
    super(message, 500, true, context);
    this.query = query;
    this.parameters = parameters;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      query: this.query,
      parameters: this.parameters,
    };
  }
  // Don't include sensitive query info in safe JSON
  toSafeJSON() {
    return super.toSafeJSON();
  }
}
/**
 * External API errors
 */
export class ExternalAPIError extends BaseError {
  service;
  endpoint;
  responseStatus;
  responseData;
  constructor(service, message, endpoint, responseStatus, responseData, context) {
    super(`${service} API Error: ${message}`, responseStatus || 502, true, context);
    this.service = service;
    this.endpoint = endpoint;
    this.responseStatus = responseStatus;
    this.responseData = responseData;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      service: this.service,
      endpoint: this.endpoint,
      responseStatus: this.responseStatus,
      responseData: this.responseData,
    };
  }
  toSafeJSON() {
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
  code;
  constructor(code, message, context) {
    super(message, 400, true, context);
    this.code = code;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      code: this.code,
    };
  }
  toSafeJSON() {
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
  constructor(message, context) {
    super(`Configuration Error: ${message}`, 500, false, context);
  }
}
/**
 * Network/timeout errors
 */
export class TimeoutError extends BaseError {
  operation;
  timeoutMs;
  constructor(operation, timeoutMs, context) {
    super(`Operation '${operation}' timed out after ${timeoutMs}ms`, 504, true, context);
    this.operation = operation;
    this.timeoutMs = timeoutMs;
  }
  toJSON() {
    return {
      ...super.toJSON(),
      operation: this.operation,
      timeoutMs: this.timeoutMs,
    };
  }
  toSafeJSON() {
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
export function isOperationalError(error) {
  if (error instanceof BaseError) {
    return error.isOperational;
  }
  return false;
}
/**
 * Create appropriate error from HTTP status code
 */
export function createHttpError(statusCode, message, context) {
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
export function handleAsyncError(fn) {
  return async (...args) => {
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
