import { RateLimitInfo } from '../interfaces/types';
/**
 * Token bucket rate limiter for API requests
 */
export declare class RateLimiter {
    private tokens;
    private readonly maxTokens;
    private readonly refillRate;
    private lastRefill;
    private readonly queue;
    constructor(maxTokens: number, refillRate: number);
    private refillTokens;
    private processQueue;
    /**
     * Acquire a token for making a request
     * @param timeout Maximum time to wait for a token (ms)
     * @returns Promise that resolves when a token is available
     */
    acquire(timeout?: number): Promise<void>;
    /**
     * Get current rate limit information
     */
    getInfo(): RateLimitInfo;
    /**
     * Check if a token is available without acquiring it
     */
    canAcquire(): boolean;
}
//# sourceMappingURL=RateLimiter.d.ts.map