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
export * from './types';
export { BaseConnector } from './base';
export { IoNetConnector } from './connectors/IoNetConnector';
export { NosanaConnector } from './connectors/NosanaConnector';
export { RenderConnector } from './connectors/RenderConnector';
export { GrassConnector } from './connectors/GrassConnector';
export { NatixConnector } from './connectors/NatixConnector';
export * from './factory';
export { ConnectorFactory, ConnectorNetwork, createConnector, createAllConnectors } from './factory';
export declare const VERSION = "1.0.0";
export declare const PACKAGE_INFO: {
    name: string;
    version: string;
    description: string;
    supportedConnectors: string[];
    features: string[];
};
//# sourceMappingURL=index.d.ts.map