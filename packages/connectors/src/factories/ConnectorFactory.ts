import { INodeConnector, ConnectorType, ConnectorConfig } from '../interfaces';
import { ErrorHandler } from '../utils';
import { IoNetConnector } from '../connectors/IoNetConnector';
import { NosanaConnector } from '../connectors/NosanaConnector';
import { RenderConnector } from '../connectors/RenderConnector';
import { GrassConnector } from '../connectors/GrassConnector';
import { NatixConnector } from '../connectors/NatixConnector';
import { Huddle01Connector } from '../connectors/Huddle01Connector';
import { OwnAIConnector } from '../connectors/OwnAIConnector';

/**
 * Factory for creating and managing connector instances
 */
export class ConnectorFactory {
  private static instances: Map<string, INodeConnector> = new Map();

  /**
   * Create a new connector instance
   * @param type Connector type
   * @param config Connector configuration
   * @returns Connector instance
   */
  static create(type: ConnectorType, config: ConnectorConfig): INodeConnector {
    const key = this.generateInstanceKey(type, config);

    // Return existing instance if available (singleton pattern per config)
    if (this.instances.has(key)) {
      return this.instances.get(key)!;
    }

    let connector: INodeConnector;

    switch (type) {
      case ConnectorType.IONET:
        connector = new IoNetConnector(config);
        break;
      case ConnectorType.NOSANA:
        connector = new NosanaConnector(config);
        break;
      case ConnectorType.RENDER:
        connector = new RenderConnector(config);
        break;
      case ConnectorType.GRASS:
        connector = new GrassConnector(config);
        break;
      case ConnectorType.NATIX:
        connector = new NatixConnector(config);
        break;
      case ConnectorType.HUDDLE01:
        connector = new Huddle01Connector(config);
        break;
      case ConnectorType.OWNAI:
        connector = new OwnAIConnector(config);
        break;
      default:
        throw ErrorHandler.createConfigError(
          `Unsupported connector type: ${type}`,
          { type, supportedTypes: Object.values(ConnectorType) }
        );
    }

    // Store instance for reuse
    this.instances.set(key, connector);
    return connector;
  }

  /**
   * Create and initialize a connector
   * @param type Connector type
   * @param config Connector configuration
   * @returns Initialized connector instance
   */
  static async createAndInitialize(type: ConnectorType, config: ConnectorConfig): Promise<INodeConnector> {
    const connector = this.create(type, config);
    await connector.initialize(config);
    return connector;
  }

  /**
   * Create multiple connectors at once
   * @param configs Array of connector configurations with types
   * @returns Array of connector instances
   */
  static createMultiple(configs: Array<{ type: ConnectorType; config: ConnectorConfig }>): INodeConnector[] {
    return configs.map(({ type, config }) => this.create(type, config));
  }

  /**
   * Create and initialize multiple connectors
   * @param configs Array of connector configurations with types
   * @returns Array of initialized connector instances
   */
  static async createAndInitializeMultiple(
    configs: Array<{ type: ConnectorType; config: ConnectorConfig }>
  ): Promise<INodeConnector[]> {
    const connectors = this.createMultiple(configs);
    await Promise.all(connectors.map(connector => connector.initialize(connector.config)));
    return connectors;
  }

  /**
   * Get existing connector instance
   * @param type Connector type
   * @param config Connector configuration (used to generate key)
   * @returns Connector instance or null if not found
   */
  static getInstance(type: ConnectorType, config: ConnectorConfig): INodeConnector | null {
    const key = this.generateInstanceKey(type, config);
    return this.instances.get(key) || null;
  }

  /**
   * Check if connector instance exists
   * @param type Connector type
   * @param config Connector configuration
   * @returns True if instance exists
   */
  static hasInstance(type: ConnectorType, config: ConnectorConfig): boolean {
    const key = this.generateInstanceKey(type, config);
    return this.instances.has(key);
  }

  /**
   * Remove and dispose of a connector instance
   * @param type Connector type
   * @param config Connector configuration
   */
  static async removeInstance(type: ConnectorType, config: ConnectorConfig): Promise<void> {
    const key = this.generateInstanceKey(type, config);
    const instance = this.instances.get(key);

    if (instance) {
      await instance.dispose();
      this.instances.delete(key);
    }
  }

  /**
   * Get all active connector instances
   * @returns Array of all active connectors
   */
  static getAllInstances(): INodeConnector[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get all instances of a specific type
   * @param type Connector type
   * @returns Array of connectors of the specified type
   */
  static getInstancesByType(type: ConnectorType): INodeConnector[] {
    return Array.from(this.instances.values()).filter(connector => connector.type === type);
  }

  /**
   * Clear all instances and dispose of them
   */
  static async clearAll(): Promise<void> {
    const disposePromises = Array.from(this.instances.values()).map(instance => instance.dispose());
    await Promise.all(disposePromises);
    this.instances.clear();
  }

  /**
   * Get factory statistics
   */
  static getStats(): {
    totalInstances: number;
    instancesByType: Record<ConnectorType, number>;
    memoryUsage: number;
  } {
    const instancesByType = {} as Record<ConnectorType, number>;

    // Initialize all types with 0
    Object.values(ConnectorType).forEach(type => {
      instancesByType[type] = 0;
    });

    // Count instances by type
    Array.from(this.instances.values()).forEach(connector => {
      instancesByType[connector.type]++;
    });

    return {
      totalInstances: this.instances.size,
      instancesByType,
      memoryUsage: process.memoryUsage().heapUsed
    };
  }

  /**
   * Validate connector configuration
   * @param type Connector type
   * @param config Connector configuration
   * @returns Validation result
   */
  static validateConfig(type: ConnectorType, config: ConnectorConfig): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!type || !Object.values(ConnectorType).includes(type)) {
      errors.push(`Invalid connector type: ${type}`);
    }

    if (!config || typeof config !== 'object') {
      errors.push('Configuration object is required');
      return { valid: false, errors, warnings };
    }

    // Type-specific validation
    switch (type) {
      case ConnectorType.IONET:
      case ConnectorType.RENDER:
      case ConnectorType.OWNAI:
        if (!config.apiKey) {
          errors.push(`${type} requires an API key`);
        }
        if (!config.baseUrl) {
          warnings.push(`${type} should specify a base URL`);
        }
        break;

      case ConnectorType.GRASS:
      case ConnectorType.NATIX:
      case ConnectorType.HUDDLE01:
        if (!config.apiKey) {
          errors.push(`${type} requires authentication`);
        }
        break;

      case ConnectorType.NOSANA:
        // Nosana has mostly public APIs, API key is optional
        if (!config.baseUrl) {
          warnings.push('Nosana should specify a base URL for better performance');
        }
        break;
    }

    // Common validation
    if (config.timeout && (config.timeout < 1000 || config.timeout > 300000)) {
      warnings.push('Timeout should be between 1000ms and 300000ms');
    }

    if (config.retryAttempts && (config.retryAttempts < 0 || config.retryAttempts > 10)) {
      warnings.push('Retry attempts should be between 0 and 10');
    }

    if (config.rateLimit) {
      if (config.rateLimit.requests < 1 || config.rateLimit.requests > 10000) {
        warnings.push('Rate limit requests should be between 1 and 10000');
      }
      if (config.rateLimit.window < 1000 || config.rateLimit.window > 3600000) {
        warnings.push('Rate limit window should be between 1000ms and 3600000ms');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Create a connector with automatic configuration detection
   * @param type Connector type
   * @param overrides Configuration overrides
   * @returns Connector instance with auto-detected configuration
   */
  static createWithAutoConfig(type: ConnectorType, overrides: Partial<ConnectorConfig> = {}): INodeConnector {
    const autoConfig = this.generateAutoConfig(type);
    const finalConfig = { ...autoConfig, ...overrides };
    return this.create(type, finalConfig);
  }

  /**
   * Generate automatic configuration for a connector type
   */
  private static generateAutoConfig(type: ConnectorType): ConnectorConfig {
    const baseConfig: ConnectorConfig = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      rateLimit: {
        requests: 60,
        window: 60000
      },
      cache: {
        enabled: true,
        ttl: 300
      },
      scraper: {
        enabled: false,
        headless: true,
        timeout: 30000
      }
    };

    // Type-specific auto configuration
    switch (type) {
      case ConnectorType.IONET:
        return {
          ...baseConfig,
          baseUrl: 'https://api.io.net',
          apiKey: process.env.IONET_API_KEY
        };

      case ConnectorType.NOSANA:
        return {
          ...baseConfig,
          baseUrl: 'https://explorer.nosana.io',
          apiKey: process.env.NOSANA_API_KEY
        };

      case ConnectorType.RENDER:
        return {
          ...baseConfig,
          baseUrl: 'https://api.rendertoken.com',
          apiKey: process.env.RENDER_API_KEY
        };

      case ConnectorType.GRASS:
        return {
          ...baseConfig,
          baseUrl: 'https://api.grass.io',
          apiKey: process.env.GRASS_API_KEY
        };

      case ConnectorType.NATIX:
        return {
          ...baseConfig,
          baseUrl: 'https://api.natix.network',
          apiKey: process.env.NATIX_API_KEY
        };

      case ConnectorType.HUDDLE01:
        return {
          ...baseConfig,
          baseUrl: 'https://api.huddle01.com',
          apiKey: process.env.HUDDLE01_API_KEY
        };

      case ConnectorType.OWNAI:
        return {
          ...baseConfig,
          baseUrl: 'https://api.ownai.network',
          apiKey: process.env.OWNAI_API_KEY
        };

      default:
        return baseConfig;
    }
  }

  /**
   * Generate a unique key for connector instances
   */
  private static generateInstanceKey(type: ConnectorType, config: ConnectorConfig): string {
    // Create a hash-like key based on type and key config properties
    const keyParts = [
      type,
      config.apiKey || 'no-key',
      config.baseUrl || 'no-url'
    ];
    return keyParts.join(':');
  }

  /**
   * Get available connector types
   */
  static getAvailableTypes(): ConnectorType[] {
    return Object.values(ConnectorType);
  }

  /**
   * Get connector type information
   */
  static getTypeInfo(type: ConnectorType): {
    name: string;
    description: string;
    requiresApiKey: boolean;
    supportsScaping: boolean;
    category: string;
  } {
    switch (type) {
      case ConnectorType.IONET:
        return {
          name: 'IO.NET',
          description: 'Decentralized GPU compute network',
          requiresApiKey: true,
          supportsScaping: true,
          category: 'compute'
        };

      case ConnectorType.NOSANA:
        return {
          name: 'Nosana',
          description: 'AI inference and compute network',
          requiresApiKey: false,
          supportsScaping: true,
          category: 'compute'
        };

      case ConnectorType.RENDER:
        return {
          name: 'Render Network',
          description: 'Distributed GPU rendering network',
          requiresApiKey: true,
          supportsScaping: true,
          category: 'rendering'
        };

      case ConnectorType.GRASS:
        return {
          name: 'Grass',
          description: 'Bandwidth sharing network',
          requiresApiKey: true,
          supportsScaping: true,
          category: 'bandwidth'
        };

      case ConnectorType.NATIX:
        return {
          name: 'Natix',
          description: 'Decentralized mapping and location data',
          requiresApiKey: true,
          supportsScaping: true,
          category: 'mapping'
        };

      case ConnectorType.HUDDLE01:
        return {
          name: 'Huddle01',
          description: 'Decentralized video infrastructure',
          requiresApiKey: true,
          supportsScaping: true,
          category: 'video'
        };

      case ConnectorType.OWNAI:
        return {
          name: 'OwnAI',
          description: 'Decentralized AI compute network',
          requiresApiKey: true,
          supportsScaping: true,
          category: 'ai'
        };

      default:
        return {
          name: 'Unknown',
          description: 'Unknown connector type',
          requiresApiKey: false,
          supportsScaping: false,
          category: 'unknown'
        };
    }
  }
}