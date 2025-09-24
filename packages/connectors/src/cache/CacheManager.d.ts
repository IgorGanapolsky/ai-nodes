/**
 * Multi-level cache manager for connector data
 */
export declare class CacheManager {
    private memoryCache;
    private defaultTtl;
    constructor(defaultTtl?: number);
    /**
     * Generate a cache key from connector type, method, and parameters
     */
    private generateKey;
    /**
     * Simple hash function for cache keys
     */
    private simpleHash;
    /**
     * Set a value in cache
     */
    set<T>(connectorType: string, method: string, data: T, ttl?: number, params?: any): Promise<void>;
    /**
     * Get a value from cache
     */
    get<T>(connectorType: string, method: string, params?: any): Promise<T | null>;
    /**
     * Delete a specific cache entry
     */
    delete(connectorType: string, method: string, params?: any): Promise<boolean>;
    /**
     * Clear all cache entries for a specific connector
     */
    clearConnector(connectorType: string): Promise<number>;
    /**
     * Clear all cache entries
     */
    clearAll(): Promise<void>;
    /**
     * Get cache statistics
     */
    getStats(): {
        keys: number;
        hits: number;
        misses: number;
        ksize: number;
        vsize: number;
    };
    /**
     * Get or set pattern - if cache miss, execute function and cache result
     */
    getOrSet<T>(connectorType: string, method: string, fetchFunction: () => Promise<T>, ttl?: number, params?: any): Promise<T>;
    /**
     * Check if a cache entry exists
     */
    has(connectorType: string, method: string, params?: any): Promise<boolean>;
    /**
     * Get the remaining TTL for a cache entry
     */
    getTtl(connectorType: string, method: string, params?: any): Promise<number>;
    /**
     * Extend the TTL of a cache entry
     */
    extendTtl(connectorType: string, method: string, additionalTtl: number, params?: any): Promise<boolean>;
    /**
     * Create a cached version of a function
     */
    cached<T extends (...args: any[]) => Promise<any>>(connectorType: string, method: string, fn: T, ttl?: number): T;
    /**
     * Dispose of resources
     */
    dispose(): void;
}
//# sourceMappingURL=CacheManager.d.ts.map