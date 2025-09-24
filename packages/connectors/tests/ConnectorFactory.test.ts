import { ConnectorFactory } from '../src/factories/ConnectorFactory';
import { ConnectorType } from '../src/interfaces/types';

describe('ConnectorFactory', () => {
  afterEach(async () => {
    // Clean up all instances after each test
    await ConnectorFactory.clearAll();
  });

  describe('create', () => {
    it('should create IoNet connector', () => {
      const connector = ConnectorFactory.create(ConnectorType.IONET, {
        apiKey: 'test-key',
        baseUrl: 'https://api.io.net'
      });

      expect(connector).toBeDefined();
      expect(connector.type).toBe(ConnectorType.IONET);
    });

    it('should create all supported connector types', () => {
      const connectorTypes = [
        ConnectorType.IONET,
        ConnectorType.NOSANA,
        ConnectorType.RENDER,
        ConnectorType.GRASS,
        ConnectorType.NATIX,
        ConnectorType.HUDDLE01,
        ConnectorType.OWNAI
      ];

      connectorTypes.forEach(type => {
        const connector = ConnectorFactory.create(type, {
          apiKey: 'test-key',
          baseUrl: 'https://example.com'
        });

        expect(connector).toBeDefined();
        expect(connector.type).toBe(type);
      });
    });

    it('should reuse existing instances with same config', () => {
      const config = {
        apiKey: 'test-key',
        baseUrl: 'https://api.io.net'
      };

      const connector1 = ConnectorFactory.create(ConnectorType.IONET, config);
      const connector2 = ConnectorFactory.create(ConnectorType.IONET, config);

      expect(connector1).toBe(connector2);
    });

    it('should throw error for unsupported connector type', () => {
      expect(() => {
        ConnectorFactory.create('invalid-type' as ConnectorType, {});
      }).toThrow('Unsupported connector type');
    });
  });

  describe('createAndInitialize', () => {
    it('should create and initialize connector', async () => {
      const connector = await ConnectorFactory.createAndInitialize(ConnectorType.IONET, {
        apiKey: 'test-key',
        baseUrl: 'https://api.io.net'
      });

      expect(connector).toBeDefined();
      expect(connector.type).toBe(ConnectorType.IONET);
    });
  });

  describe('createMultiple', () => {
    it('should create multiple connectors', () => {
      const configs = [
        { type: ConnectorType.IONET, config: { apiKey: 'key1' } },
        { type: ConnectorType.NOSANA, config: { apiKey: 'key2' } },
        { type: ConnectorType.RENDER, config: { apiKey: 'key3' } }
      ];

      const connectors = ConnectorFactory.createMultiple(configs);

      expect(connectors).toHaveLength(3);
      expect(connectors[0].type).toBe(ConnectorType.IONET);
      expect(connectors[1].type).toBe(ConnectorType.NOSANA);
      expect(connectors[2].type).toBe(ConnectorType.RENDER);
    });
  });

  describe('validateConfig', () => {
    it('should validate valid configuration', () => {
      const result = ConnectorFactory.validateConfig(ConnectorType.IONET, {
        apiKey: 'test-key',
        baseUrl: 'https://api.io.net',
        timeout: 30000
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing API key for connectors that require it', () => {
      const result = ConnectorFactory.validateConfig(ConnectorType.IONET, {
        baseUrl: 'https://api.io.net'
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ionet requires an API key');
    });

    it('should allow missing API key for Nosana', () => {
      const result = ConnectorFactory.validateConfig(ConnectorType.NOSANA, {
        baseUrl: 'https://explorer.nosana.io'
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('getStats', () => {
    it('should return factory statistics', async () => {
      // Create some connectors
      ConnectorFactory.create(ConnectorType.IONET, { apiKey: 'key1' });
      ConnectorFactory.create(ConnectorType.NOSANA, { apiKey: 'key2' });
      ConnectorFactory.create(ConnectorType.RENDER, { apiKey: 'key3' });

      const stats = ConnectorFactory.getStats();

      expect(stats.totalInstances).toBe(3);
      expect(stats.instancesByType[ConnectorType.IONET]).toBe(1);
      expect(stats.instancesByType[ConnectorType.NOSANA]).toBe(1);
      expect(stats.instancesByType[ConnectorType.RENDER]).toBe(1);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });
  });

  describe('getTypeInfo', () => {
    it('should return connector type information', () => {
      const info = ConnectorFactory.getTypeInfo(ConnectorType.IONET);

      expect(info.name).toBe('IO.NET');
      expect(info.description).toContain('GPU compute');
      expect(info.requiresApiKey).toBe(true);
      expect(info.category).toBe('compute');
    });

    it('should return info for all connector types', () => {
      const types = ConnectorFactory.getAvailableTypes();

      types.forEach(type => {
        const info = ConnectorFactory.getTypeInfo(type);

        expect(info.name).toBeDefined();
        expect(info.description).toBeDefined();
        expect(typeof info.requiresApiKey).toBe('boolean');
        expect(info.category).toBeDefined();
      });
    });
  });

  describe('createWithAutoConfig', () => {
    it('should create connector with auto-detected configuration', () => {
      // Set environment variable for testing
      process.env.IONET_API_KEY = 'auto-detected-key';

      const connector = ConnectorFactory.createWithAutoConfig(ConnectorType.IONET);

      expect(connector).toBeDefined();
      expect(connector.type).toBe(ConnectorType.IONET);
      expect(connector.config.apiKey).toBe('auto-detected-key');
      expect(connector.config.baseUrl).toBe('https://api.io.net');

      // Clean up
      delete process.env.IONET_API_KEY;
    });

    it('should override auto-config with provided values', () => {
      const connector = ConnectorFactory.createWithAutoConfig(ConnectorType.IONET, {
        apiKey: 'override-key',
        timeout: 60000
      });

      expect(connector.config.apiKey).toBe('override-key');
      expect(connector.config.timeout).toBe(60000);
      expect(connector.config.baseUrl).toBe('https://api.io.net'); // Auto-detected
    });
  });
});