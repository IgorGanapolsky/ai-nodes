import { IConnector } from './types';
/**
 * Supported DePIN networks
 */
export declare enum ConnectorNetwork {
    IONET = "ionet",
    NOSANA = "nosana",
    RENDER = "render",
    GRASS = "grass",
    NATIX = "natix"
}
/**
 * Configuration options for connectors
 */
export interface ConnectorConfig {
    network: ConnectorNetwork;
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
    retryAttempts?: number;
}
/**
 * Factory class for creating DePIN connector instances
 */
export declare class ConnectorFactory {
    /**
     * Create a connector instance for the specified network
     * @param config Connector configuration
     * @returns Connector instance
     */
    static createConnector(config: ConnectorConfig): IConnector;
    /**
     * Get list of all supported networks
     * @returns Array of supported network names
     */
    static getSupportedNetworks(): ConnectorNetwork[];
    /**
     * Check if a network is supported
     * @param network Network name to check
     * @returns True if network is supported
     */
    static isNetworkSupported(network: string): network is ConnectorNetwork;
    /**
     * Create multiple connectors for different networks
     * @param configs Array of connector configurations
     * @returns Map of network name to connector instance
     */
    static createMultipleConnectors(configs: ConnectorConfig[]): Map<ConnectorNetwork, IConnector>;
    /**
     * Create connectors for all supported networks with default configurations
     * @returns Map of network name to connector instance
     */
    static createAllConnectors(): Map<ConnectorNetwork, IConnector>;
}
/**
 * Convenience function to create a single connector
 * @param network Network name
 * @param options Optional configuration
 * @returns Connector instance
 */
export declare function createConnector(network: ConnectorNetwork, options?: Omit<ConnectorConfig, 'network'>): IConnector;
/**
 * Convenience function to create all connectors
 * @returns Map of network name to connector instance
 */
export declare function createAllConnectors(): Map<ConnectorNetwork, IConnector>;
//# sourceMappingURL=factory.d.ts.map