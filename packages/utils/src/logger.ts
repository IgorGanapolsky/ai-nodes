import pino, { Logger as PinoLogger } from 'pino';
import { loadConfig, isDevelopment } from './config.js';

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
export class Logger {
  private pino: PinoLogger;

  constructor(options: LoggerOptions = {}) {
    const config = loadConfig();
    const isDev = isDevelopment();

    const pinoOptions: pino.LoggerOptions = {
      level: options.level || config.LOG_LEVEL || 'info',
      base: {
        service: options.service || 'depinautopilot',
        version: options.version || '1.0.0',
        environment: options.environment || config.NODE_ENV,
        pid: process.pid,
      },
    };

    // Pretty printing for development
    if (options.pretty || isDev) {
      pinoOptions.transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '{service}[{version}]: {msg}',
        },
      };
    }

    // Add serializers for common objects
    pinoOptions.serializers = {
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    };

    this.pino = pino(pinoOptions);
  }

  /**
   * Log debug message
   */
  debug(message: string, context: LogContext = {}): void {
    this.pino.debug(context, message);
  }

  /**
   * Log info message
   */
  info(message: string, context: LogContext = {}): void {
    this.pino.info(context, message);
  }

  /**
   * Log warning message
   */
  warn(message: string, context: LogContext = {}): void {
    this.pino.warn(context, message);
  }

  /**
   * Log error message
   */
  error(message: string, error?: Error | unknown, context: LogContext = {}): void {
    const errorContext = { ...context };

    if (error instanceof Error) {
      errorContext.error = error;
      errorContext.stack = error.stack;
    } else if (error) {
      errorContext.error = String(error);
    }

    this.pino.error(errorContext, message);
  }

  /**
   * Log fatal message (will exit process)
   */
  fatal(message: string, error?: Error | unknown, context: LogContext = {}): void {
    const errorContext = { ...context };

    if (error instanceof Error) {
      errorContext.error = error;
      errorContext.stack = error.stack;
    } else if (error) {
      errorContext.error = String(error);
    }

    this.pino.fatal(errorContext, message);
  }

  /**
   * Create child logger with additional context
   */
  child(context: LogContext): Logger {
    const childPino = this.pino.child(context);
    const childLogger = Object.create(Logger.prototype);
    childLogger.pino = childPino;
    return childLogger;
  }

  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {},
  ): void {
    this.info(`${method} ${url} ${statusCode}`, {
      ...context,
      method,
      url,
      statusCode,
      duration,
      type: 'http_request',
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, context: LogContext = {}): void {
    this.debug('Database query executed', {
      ...context,
      query,
      duration,
      type: 'database_query',
    });
  }

  /**
   * Log external API call
   */
  logApiCall(
    service: string,
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context: LogContext = {},
  ): void {
    this.info(`API call to ${service}`, {
      ...context,
      service,
      method,
      url,
      statusCode,
      duration,
      type: 'api_call',
    });
  }

  /**
   * Log performance metrics
   */
  logMetric(name: string, value: number, unit: string = 'ms', context: LogContext = {}): void {
    this.info(`Metric: ${name}`, {
      ...context,
      metric: name,
      value,
      unit,
      type: 'metric',
    });
  }

  /**
   * Log business events
   */
  logEvent(event: string, context: LogContext = {}): void {
    this.info(`Event: ${event}`, {
      ...context,
      event,
      type: 'business_event',
    });
  }

  /**
   * Get the underlying Pino logger
   */
  getPino(): PinoLogger {
    return this.pino;
  }
}

// Create default logger instance
let defaultLogger: Logger;

/**
 * Get the default logger instance
 */
export function getLogger(service?: string): Logger {
  if (!defaultLogger) {
    defaultLogger = new Logger({ service });
  }
  return defaultLogger;
}

/**
 * Create a new logger instance with custom options
 */
export function createLogger(options: LoggerOptions): Logger {
  return new Logger(options);
}

/**
 * Logger middleware for request logging
 */
export function createLoggerMiddleware(logger: Logger = getLogger()) {
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || `req_${Date.now()}_${Math.random()}`;

    // Add request context to logger
    req.logger = logger.child({ requestId });

    // Log request start
    req.logger.info('Request started', {
      method: req.method,
      url: req.url,
      userAgent: req.headers['user-agent'],
    });

    // Log response when finished
    res.on('finish', () => {
      const duration = Date.now() - start;
      req.logger.logRequest(req.method, req.url, res.statusCode, duration, {
        contentLength: res.get('Content-Length'),
      });
    });

    next();
  };
}

export default getLogger;
