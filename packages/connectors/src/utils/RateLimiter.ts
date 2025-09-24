import { RateLimitInfo } from '../interfaces/types';

/**
 * Token bucket rate limiter for API requests
 */
export class RateLimiter {
  private tokens: number;
  private readonly maxTokens: number;
  private readonly refillRate: number; // tokens per second
  private lastRefill: number;
  private readonly queue: Array<{ resolve: () => void; reject: (error: Error) => void }> = [];

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate;
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timePassed * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  private processQueue(): void {
    while (this.queue.length > 0 && this.tokens > 0) {
      const request = this.queue.shift();
      if (request) {
        this.tokens--;
        request.resolve();
      }
    }
  }

  /**
   * Acquire a token for making a request
   * @param timeout Maximum time to wait for a token (ms)
   * @returns Promise that resolves when a token is available
   */
  async acquire(timeout: number = 30000): Promise<void> {
    this.refillTokens();

    if (this.tokens > 0) {
      this.tokens--;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const index = this.queue.findIndex(req => req.resolve === resolve);
        if (index !== -1) {
          this.queue.splice(index, 1);
        }
        reject(new Error('Rate limit timeout'));
      }, timeout);

      this.queue.push({
        resolve: () => {
          clearTimeout(timeoutId);
          resolve();
        },
        reject: (error: Error) => {
          clearTimeout(timeoutId);
          reject(error);
        }
      });

      // Try to process the queue immediately
      setTimeout(() => {
        this.refillTokens();
        this.processQueue();
      }, 0);
    });
  }

  /**
   * Get current rate limit information
   */
  getInfo(): RateLimitInfo {
    this.refillTokens();
    const resetTime = this.lastRefill + (this.maxTokens - this.tokens) / this.refillRate * 1000;

    return {
      remaining: this.tokens,
      reset: Math.ceil(resetTime),
      limit: this.maxTokens
    };
  }

  /**
   * Check if a token is available without acquiring it
   */
  canAcquire(): boolean {
    this.refillTokens();
    return this.tokens > 0;
  }
}