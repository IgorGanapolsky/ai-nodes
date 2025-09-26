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
export declare class RetryLogic {
  private static readonly DEFAULT_OPTIONS;
  /**
   * Execute a function with retry logic
   * @param fn Function to execute
   * @param options Retry options
   */
  static execute<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
  /**
   * Create a retryable wrapper for a function
   * @param fn Function to wrap
   * @param options Retry options
   */
  static wrap<T extends (...args: any[]) => Promise<any>>(fn: T, options?: RetryOptions): T;
  /**
   * Check if an error is retryable based on default logic
   */
  static isRetryableError(error: Error): boolean;
  /**
   * Create a custom retry strategy
   */
  static createStrategy(options: RetryOptions): (fn: () => Promise<any>) => Promise<any>;
}
//# sourceMappingURL=RetryLogic.d.ts.map
