/**
 * @depinautopilot/connectors
 *
 * Complete mock DePIN connectors for device monitoring and pricing optimization
 *
 * Features:
 * - Deterministic mock data generation
 * - Five specialized connector types (IoNet, Nosana, Render, Grass, Natix)
 * - TypeScript interfaces for type safety
 * - Factory pattern for easy instantiation
 * - Realistic device metrics and pricing suggestions
 */

// Core types and interfaces
export * from './types';

// Base connector class
export { BaseConnector } from './base';

// All connector implementations
export { IoNetConnector } from './connectors/IoNetConnector';
export { NosanaConnector } from './connectors/NosanaConnector';
export { RenderConnector } from './connectors/RenderConnector';
export { GrassConnector } from './connectors/GrassConnector';
export { NatixConnector } from './connectors/NatixConnector';

// Factory for creating connectors
export * from './factory';

// Convenience exports for commonly used items
export {
  ConnectorFactory,
  ConnectorNetwork,
  createConnector,
  createAllConnectors,
} from './factory';

// Version info
export const VERSION = '1.0.0';

// Package metadata
export const PACKAGE_INFO = {
  name: '@depinautopilot/connectors',
  version: VERSION,
  description: 'Complete mock DePIN connectors with deterministic data generation',
  supportedConnectors: ['ionet', 'nosana', 'render', 'grass', 'natix'],
  features: [
    'deterministic mock data generation',
    'realistic device metrics',
    'pricing optimization suggestions',
    'occupancy tracking',
    'typescript support',
    'factory pattern',
    'network-specific custom metrics',
  ],
};
export * from './prospecting';
