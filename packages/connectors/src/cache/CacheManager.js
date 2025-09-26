import NodeCache from 'node-cache';
import { ErrorHandler } from '../utils/ErrorHandler';
/**
 * Multi-level cache manager for connector data
 */
export class CacheManager {
  memoryCache;
  defaultTtl;
  constructor(defaultTtl = 300) {
    this.defaultTtl = defaultTtl;
    this.memoryCache = new NodeCache({
      stdTTL: defaultTtl,
      checkperiod: Math.floor(defaultTtl / 10), // Check every 10% of TTL
      useClones: false, // For better performance
      deleteOnExpire: true,
      maxKeys: 1000, // Limit memory usage
    });
    // Setup cache event listeners
    this.memoryCache.on('expired', (key) => {
      console.debug(`Cache entry expired: ${key}`);
    });
    this.memoryCache.on('del', (key) => {
      console.debug(`Cache entry deleted: ${key}`);
    });
  }
  /**
   * Generate a cache key from connector type, method, and parameters
   */
  generateKey(connectorType, method, params) {
    const paramStr = params ? JSON.stringify(params) : '';
    const hash = this.simpleHash(paramStr);
    return `${connectorType}:${method}:${hash}`;
  }
  /**
   * Simple hash function for cache keys
   */
  simpleHash(str) {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
  /**
   * Set a value in cache
   */
  async set(connectorType, method, data, ttl, params) {
    try {
      const key = this.generateKey(connectorType, method, params);
      const entry = {
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTtl,
      };
      this.memoryCache.set(key, entry, ttl || this.defaultTtl);
      console.debug(`Cache set: ${key} (TTL: ${ttl || this.defaultTtl}s)`);
    } catch (error) {
      throw ErrorHandler.wrapCacheError(error, 'set');
    }
  }
  /**
   * Get a value from cache
   */
  async get(connectorType, method, params) {
    try {
      const key = this.generateKey(connectorType, method, params);
      const entry = this.memoryCache.get(key);
      if (!entry) {
        console.debug(`Cache miss: ${key}`);
        return null;
      }
      // Check if entry is still valid
      const now = Date.now();
      const age = (now - entry.timestamp) / 1000;
      if (age > entry.ttl) {
        console.debug(`Cache expired: ${key} (age: ${age}s, ttl: ${entry.ttl}s)`);
        this.memoryCache.del(key);
        return null;
      }
      console.debug(`Cache hit: ${key} (age: ${age}s)`);
      return entry.data;
    } catch (error) {
      throw ErrorHandler.wrapCacheError(error, 'get');
    }
  }
  /**
   * Delete a specific cache entry
   */
  async delete(connectorType, method, params) {
    try {
      const key = this.generateKey(connectorType, method, params);
      const deleted = this.memoryCache.del(key);
      console.debug(`Cache delete: ${key} (success: ${deleted > 0})`);
      return deleted > 0;
    } catch (error) {
      throw ErrorHandler.wrapCacheError(error, 'delete');
    }
  }
  /**
   * Clear all cache entries for a specific connector
   */
  async clearConnector(connectorType) {
    try {
      const keys = this.memoryCache.keys();
      const connectorKeys = keys.filter((key) => key.startsWith(`${connectorType}:`));
      let deletedCount = 0;
      for (const key of connectorKeys) {
        if (this.memoryCache.del(key) > 0) {
          deletedCount++;
        }
      }
      console.debug(`Cache cleared for connector: ${connectorType} (${deletedCount} entries)`);
      return deletedCount;
    } catch (error) {
      throw ErrorHandler.wrapCacheError(error, 'clearConnector');
    }
  }
  /**
   * Clear all cache entries
   */
  async clearAll() {
    try {
      this.memoryCache.flushAll();
      console.debug('All cache entries cleared');
    } catch (error) {
      throw ErrorHandler.wrapCacheError(error, 'clearAll');
    }
  }
  /**
   * Get cache statistics
   */
  getStats() {
    return this.memoryCache.getStats();
  }
  /**
   * Get or set pattern - if cache miss, execute function and cache result
   */
  async getOrSet(connectorType, method, fetchFunction, ttl, params) {
    // Try to get from cache first
    const cached = await this.get(connectorType, method, params);
    if (cached !== null) {
      return cached;
    }
    // Cache miss - fetch data and cache it
    try {
      const data = await fetchFunction();
      await this.set(connectorType, method, data, ttl, params);
      return data;
    } catch (error) {
      // Don't cache errors, but re-throw them
      throw error;
    }
  }
  /**
   * Check if a cache entry exists
   */
  async has(connectorType, method, params) {
    const key = this.generateKey(connectorType, method, params);
    return this.memoryCache.has(key);
  }
  /**
   * Get the remaining TTL for a cache entry
   */
  async getTtl(connectorType, method, params) {
    const key = this.generateKey(connectorType, method, params);
    return this.memoryCache.getTtl(key) || 0;
  }
  /**
   * Extend the TTL of a cache entry
   */
  async extendTtl(connectorType, method, additionalTtl, params) {
    const key = this.generateKey(connectorType, method, params);
    const currentTtl = this.memoryCache.getTtl(key);
    if (currentTtl && currentTtl > 0) {
      const newTtl = Math.floor((currentTtl - Date.now()) / 1000) + additionalTtl;
      return this.memoryCache.ttl(key, newTtl);
    }
    return false;
  }
  /**
   * Create a cached version of a function
   */
  cached(connectorType, method, fn, ttl) {
    return async (...args) => {
      return this.getOrSet(
        connectorType,
        method,
        () => fn(...args),
        ttl,
        args.length > 0 ? args : undefined,
      );
    };
  }
  /**
   * Dispose of resources
   */
  dispose() {
    this.memoryCache.close();
  }
}
