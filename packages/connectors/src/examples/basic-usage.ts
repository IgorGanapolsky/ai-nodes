/**
 * Basic usage examples for DePIN node connectors
 */

import {
  ConnectorFactory,
  ConnectorType,
  MockDataGenerator,
  Period
} from '../index';

// Example 1: Create a single connector
async function createSingleConnector() {
  console.log('=== Creating Single Connector ===');

  const connector = await ConnectorFactory.createAndInitialize(ConnectorType.IONET, {
    apiKey: 'your-ionet-api-key',
    baseUrl: 'https://api.io.net',
    cache: {
      enabled: true,
      ttl: 300 // 5 minutes
    },
    rateLimit: {
      requests: 60,
      window: 60000 // 1 minute
    }
  });

  console.log('Connector created:', connector.type);
  console.log('Connector info:', connector.getInfo());

  // Get node status
  const nodeStatus = await connector.getNodeStatus();
  console.log('Node status:', JSON.stringify(nodeStatus, null, 2));

  // Get earnings for the last week
  const period: Period = {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
    type: 'week'
  };

  const earnings = await connector.getEarnings(period);
  console.log('Earnings:', JSON.stringify(earnings, null, 2));

  // Get metrics
  const metrics = await connector.getMetrics();
  console.log('Metrics:', JSON.stringify(metrics, null, 2));

  await connector.dispose();
}

// Example 2: Create multiple connectors
async function createMultipleConnectors() {
  console.log('\n=== Creating Multiple Connectors ===');

  const configs = [
    {
      type: ConnectorType.IONET,
      config: {
        apiKey: 'ionet-key',
        baseUrl: 'https://api.io.net'
      }
    },
    {
      type: ConnectorType.NOSANA,
      config: {
        baseUrl: 'https://explorer.nosana.io'
      }
    },
    {
      type: ConnectorType.RENDER,
      config: {
        apiKey: 'render-key',
        baseUrl: 'https://api.rendertoken.com'
      }
    }
  ];

  const connectors = await ConnectorFactory.createAndInitializeMultiple(configs);

  console.log(`Created ${connectors.length} connectors`);

  // Get status from all connectors
  const allStatuses = await Promise.all(
    connectors.map(async connector => {
      const status = await connector.getNodeStatus();
      return {
        type: connector.type,
        status
      };
    })
  );

  console.log('All connector statuses:', JSON.stringify(allStatuses, null, 2));

  // Cleanup
  await ConnectorFactory.clearAll();
}

// Example 3: Using auto-configuration
async function useAutoConfiguration() {
  console.log('\n=== Using Auto-Configuration ===');

  // Set environment variables (normally done in .env file)
  process.env.IONET_API_KEY = 'auto-detected-ionet-key';
  process.env.GRASS_API_KEY = 'auto-detected-grass-key';

  // Create connectors with auto-detected configuration
  const ionetConnector = ConnectorFactory.createWithAutoConfig(ConnectorType.IONET);
  const grassConnector = ConnectorFactory.createWithAutoConfig(ConnectorType.GRASS, {
    timeout: 60000 // Override default timeout
  });

  console.log('IoNet config:', ionetConnector.config);
  console.log('Grass config:', grassConnector.config);

  // Cleanup environment
  delete process.env.IONET_API_KEY;
  delete process.env.GRASS_API_KEY;
}

// Example 4: Configuration validation
function validateConfigurations() {
  console.log('\n=== Configuration Validation ===');

  // Valid configuration
  const validResult = ConnectorFactory.validateConfig(ConnectorType.IONET, {
    apiKey: 'test-key',
    baseUrl: 'https://api.io.net',
    timeout: 30000
  });

  console.log('Valid config result:', validResult);

  // Invalid configuration
  const invalidResult = ConnectorFactory.validateConfig(ConnectorType.IONET, {
    baseUrl: 'https://api.io.net'
    // Missing required API key
  });

  console.log('Invalid config result:', invalidResult);
}

// Example 5: Error handling
async function demonstrateErrorHandling() {
  console.log('\n=== Error Handling ===');

  try {
    const connector = await ConnectorFactory.createAndInitialize(ConnectorType.IONET, {
      apiKey: 'invalid-key',
      baseUrl: 'https://invalid-url.com'
    });

    // This will likely fail and fall back to mock data
    const status = await connector.getNodeStatus();
    console.log('Status (possibly mock):', status);

  } catch (error) {
    console.error('Error caught:', error);
  }
}

// Example 6: Mock data generation
function demonstrateMockData() {
  console.log('\n=== Mock Data Generation ===');

  // Generate mock node status
  const mockStatus = MockDataGenerator.generateNodeStatus(ConnectorType.IONET);
  console.log('Mock node status:', JSON.stringify(mockStatus, null, 2));

  // Generate mock earnings
  const period = MockDataGenerator.generatePeriod('week');
  const mockEarnings = MockDataGenerator.generateEarnings(period, ConnectorType.RENDER);
  console.log('Mock earnings:', JSON.stringify(mockEarnings, null, 2));

  // Generate mock metrics
  const mockMetrics = MockDataGenerator.generateNodeMetrics(ConnectorType.GRASS);
  console.log('Mock metrics:', JSON.stringify(mockMetrics, null, 2));
}

// Example 7: Factory statistics
function showFactoryStatistics() {
  console.log('\n=== Factory Statistics ===');

  // Create some connectors
  ConnectorFactory.create(ConnectorType.IONET, { apiKey: 'key1' });
  ConnectorFactory.create(ConnectorType.NOSANA, { apiKey: 'key2' });
  ConnectorFactory.create(ConnectorType.RENDER, { apiKey: 'key3' });

  const stats = ConnectorFactory.getStats();
  console.log('Factory statistics:', JSON.stringify(stats, null, 2));

  // Get available types and their info
  const availableTypes = ConnectorFactory.getAvailableTypes();
  console.log('\nAvailable connector types:');

  availableTypes.forEach(type => {
    const info = ConnectorFactory.getTypeInfo(type);
    console.log(`- ${info.name}: ${info.description} (Category: ${info.category})`);
  });
}

// Example 8: Pricing optimization
async function demonstratePricingOptimization() {
  console.log('\n=== Pricing Optimization ===');

  const connector = await ConnectorFactory.createAndInitialize(ConnectorType.RENDER, {
    apiKey: 'test-key'
  });

  const pricingStrategy = await connector.optimizePricing({
    targetUtilization: 80,
    priceStrategy: 'competitive',
    marketConditions: 'normal',
    nodeSpecs: {
      cpu: { cores: 16, model: 'Intel i9-13900K', frequency: 3.0 },
      memory: { total: 64, available: 48 },
      storage: { total: 2000, available: 1500, type: 'NVMe' },
      gpu: { model: 'NVIDIA RTX 4090', memory: 24, compute: 165 }
    }
  });

  console.log('Pricing strategy:', JSON.stringify(pricingStrategy, null, 2));

  await connector.dispose();
}

// Run all examples
async function runAllExamples() {
  try {
    await createSingleConnector();
    await createMultipleConnectors();
    await useAutoConfiguration();
    validateConfigurations();
    await demonstrateErrorHandling();
    demonstrateMockData();
    showFactoryStatistics();
    await demonstratePricingOptimization();

    console.log('\n=== All examples completed successfully! ===');
  } catch (error) {
    console.error('Example failed:', error);
  } finally {
    // Clean up all instances
    await ConnectorFactory.clearAll();
  }
}

// Export for use in other modules
export {
  createSingleConnector,
  createMultipleConnectors,
  useAutoConfiguration,
  validateConfigurations,
  demonstrateErrorHandling,
  demonstrateMockData,
  showFactoryStatistics,
  demonstratePricingOptimization,
  runAllExamples
};

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples().catch(console.error);
}