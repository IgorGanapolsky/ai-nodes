/**
 * @ai-nodes/connectors
 *
 * Comprehensive DePIN node connectors for monitoring and optimization
 *
 * Features:
 * - Read-only custody-safe access
 * - Multiple connector types (IoNet, Nosana, Render, Grass, Natix, Huddle01, OwnAI)
 * - Playwright-based scraper fallback
 * - Rate limiting and retry logic
 * - Comprehensive caching
 * - Mock data generation for testing
 * - Factory pattern for easy instantiation
 * - Comprehensive error handling
 */

// Main interfaces and types
export * from './interfaces';

// Core utilities
export * from './utils';

// Caching system
export * from './cache';

// Web scraping capabilities
export * from './scrapers';

// All connector implementations
export * from './connectors';

// Factory for creating connectors
export * from './factories';

// Convenience exports for commonly used items
export { ConnectorFactory } from './factories/ConnectorFactory';

// Version info
export const VERSION = '1.0.0';

// Package metadata
export const PACKAGE_INFO = {
  name: '@ai-nodes/connectors',
  version: VERSION,
  description: 'DePIN node connectors for comprehensive monitoring and optimization',
  supportedConnectors: [
    'ionet',
    'nosana',
    'render',
    'grass',
    'natix',
    'huddle01',
    'ownai'
  ],
  features: [
    'custody-safe read-only access',
    'rate limiting and retry logic',
    'comprehensive caching',
    'playwright scraper fallback',
    'mock data generation',
    'factory pattern',
    'comprehensive error handling'
  ]
};