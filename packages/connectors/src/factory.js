import { IoNetConnector } from './connectors/IoNetConnector';
import { NosanaConnector } from './connectors/NosanaConnector';
import { RenderConnector } from './connectors/RenderConnector';
import { GrassConnector } from './connectors/GrassConnector';
import { NatixConnector } from './connectors/NatixConnector';
/**
 * Supported DePIN networks
 */
export var ConnectorNetwork;
(function (ConnectorNetwork) {
  ConnectorNetwork['IONET'] = 'ionet';
  ConnectorNetwork['NOSANA'] = 'nosana';
  ConnectorNetwork['RENDER'] = 'render';
  ConnectorNetwork['GRASS'] = 'grass';
  ConnectorNetwork['NATIX'] = 'natix';
})(ConnectorNetwork || (ConnectorNetwork = {}));
/**
 * Factory class for creating DePIN connector instances
 */
export class ConnectorFactory {
  /**
   * Create a connector instance for the specified network
   * @param config Connector configuration
   * @returns Connector instance
   */
  static createConnector(config) {
    switch (config.network) {
      case ConnectorNetwork.IONET:
        return new IoNetConnector();
      case ConnectorNetwork.NOSANA:
        return new NosanaConnector();
      case ConnectorNetwork.RENDER:
        return new RenderConnector();
      case ConnectorNetwork.GRASS:
        return new GrassConnector();
      case ConnectorNetwork.NATIX:
        return new NatixConnector();
      default:
        throw new Error(`Unsupported network: ${config.network}`);
    }
  }
  /**
   * Get list of all supported networks
   * @returns Array of supported network names
   */
  static getSupportedNetworks() {
    return Object.values(ConnectorNetwork);
  }
  /**
   * Check if a network is supported
   * @param network Network name to check
   * @returns True if network is supported
   */
  static isNetworkSupported(network) {
    return Object.values(ConnectorNetwork).includes(network);
  }
  /**
   * Create multiple connectors for different networks
   * @param configs Array of connector configurations
   * @returns Map of network name to connector instance
   */
  static createMultipleConnectors(configs) {
    const connectors = new Map();
    for (const config of configs) {
      try {
        const connector = ConnectorFactory.createConnector(config);
        connectors.set(config.network, connector);
      } catch (error) {
        console.warn(`Failed to create connector for ${config.network}:`, error);
      }
    }
    return connectors;
  }
  /**
   * Create connectors for all supported networks with default configurations
   * @returns Map of network name to connector instance
   */
  static createAllConnectors() {
    const configs = ConnectorFactory.getSupportedNetworks().map((network) => ({
      network,
    }));
    return ConnectorFactory.createMultipleConnectors(configs);
  }
}
/**
 * Convenience function to create a single connector
 * @param network Network name
 * @param options Optional configuration
 * @returns Connector instance
 */
export function createConnector(network, options = {}) {
  return ConnectorFactory.createConnector({ network, ...options });
}
/**
 * Convenience function to create all connectors
 * @returns Map of network name to connector instance
 */
export function createAllConnectors() {
  return ConnectorFactory.createAllConnectors();
}
