import pRetry, { AbortError } from 'p-retry';
import { ConnectorError } from '../interfaces/types';

export interface RetryOptions {
  retries?: number;
  factor?: number;
  minTimeout?: number;
  maxTimeout?: number;
  randomize?: boolean;
  shouldRetry?: (error: Error) => boolean;
}

/**
 * Retry logic utility with exponential backoff
 */
export class RetryLogic {
  private static readonly DEFAULT_OPTIONS: Required<RetryOptions> = {
    retries: 3,
    factor: 2,
    minTimeout: 1000,
    maxTimeout: 30000,
    randomize: true,
    shouldRetry: (error: Error) => {
      // Default retry logic
      if (error instanceof ConnectorError) {
        return error.retryable;
      }

      // Retry on network errors
      if (error.message.includes('ECONNRESET') ||
          error.message.includes('ENOTFOUND') ||
          error.message.includes('timeout')) {
        return true;
      }

      // Retry on 5xx HTTP errors
      if ('response' in error && typeof error.response === 'object' && error.response) {
        const status = (error.response as any).status;
        return status >= 500 && status < 600;
      }

      return false;
    }
  };

  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @param options Retry options
   */
  static async execute<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    return pRetry(async (attemptNumber) => {
      try {
        return await fn();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));

        if (!config.shouldRetry(err)) {
          throw new AbortError(err);
        }

        console.warn(`Attempt ${attemptNumber} failed:`, err.message);
        throw err;
      }
    }, {
      retries: config.retries,
      factor: config.factor,
      minTimeout: config.minTimeout,
      maxTimeout: config.maxTimeout,
      randomize: config.randomize,
      onFailedAttempt: (error) => {
        console.warn(`Retry attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
      }
    });
  }

  /**
   * Create a retryable wrapper for a function
   * @param fn Function to wrap
   * @param options Retry options
   */
  static wrap<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    options: RetryOptions = {}
  ): T {
    return ((...args: Parameters<T>) => {
      return this.execute(() => fn(...args), options);
    }) as T;
  }

  /**
   * Check if an error is retryable based on default logic
   */
  static isRetryableError(error: Error): boolean {
    return this.DEFAULT_OPTIONS.shouldRetry(error);
  }

  /**
   * Create a custom retry strategy
   */
  static createStrategy(options: RetryOptions): (fn: () => Promise<any>) => Promise<any> {
    return (fn) => this.execute(fn, options);
  }
}