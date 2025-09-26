import { Logger as PinoLogger } from 'pino';
export interface LoggerOptions {
  level?: string;
  service?: string;
  version?: string;
  environment?: string;
  pretty?: boolean;
}
export interface LogContext {
  [key: string]: any;
  userId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  operation?: string;
  duration?: number;
  error?: Error | string;
}
/**
 * Enhanced logger wrapper around Pino
 */
export declare class Logger {
  private pino;
  constructor(options?: LoggerOptions);
  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void;
  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void;
  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void;
  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext): void;
  /**
   * Log fatal message (will exit process)
   */
  fatal(message: string, error?: Error | unknown, context?: LogContext): void;
  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger;
  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void;
  /**
   * Log database query
   */
  logQuery(query: string, duration: number, context?: LogContext): void;
  /**
   * Log external API call
   */
  logApiCall(
    service: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: LogContext,
  ): void;
  /**
   * Log performance metrics
   */
  logMetric(name: string, value: number, unit?: string, context?: LogContext): void;
  /**
   * Log business events
   */
  logEvent(event: string, context?: LogContext): void;
  /**
   * Get the underlying Pino logger
   */
  getPino(): PinoLogger;
}
/**
 * Get the default logger instance
 */
export declare function getLogger(service?: string): Logger;
/**
 * Create a new logger instance with custom options
 */
export declare function createLogger(options: LoggerOptions): Logger;
/**
 * Logger middleware for request logging
 */
export declare function createLoggerMiddleware(
  logger?: Logger,
): (req: any, res: any, next: any) => void;
export default getLogger;
//# sourceMappingURL=logger.d.ts.map
