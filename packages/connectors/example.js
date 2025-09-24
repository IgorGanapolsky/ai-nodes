/**
 * Simple Node.js example demonstrating the connectors package
 */

const {
  ConnectorFactory,
  ConnectorType,
  MockDataGenerator
} = require('./dist/index.js');

async function demonstrateConnectors() {
  console.log('🚀 AI Nodes Connectors Demo\n');

  // 1. Show available connector types
  console.log('📋 Available Connector Types:');
  const types = ConnectorFactory.getAvailableTypes();
  types.forEach(type => {
    const info = ConnectorFactory.getTypeInfo(type);
    console.log(`  • ${info.name} (${type}): ${info.description}`);
  });
  console.log('');

  // 2. Demonstrate mock data generation
  console.log('🧪 Mock Data Generation:');

  const mockStatus = MockDataGenerator.generateNodeStatus(ConnectorType.IONET);
  console.log('  Node Status Sample:');
  console.log(`    ID: ${mockStatus.id}`);
  console.log(`    Name: ${mockStatus.name}`);
  console.log(`    Status: ${mockStatus.status}`);
  console.log(`    CPU Usage: ${mockStatus.health.cpu.toFixed(1)}%`);
  console.log(`    Location: ${mockStatus.location?.country || 'Unknown'}`);
  console.log('');

  const period = MockDataGenerator.generatePeriod('week');
  const mockEarnings = MockDataGenerator.generateEarnings(period, ConnectorType.RENDER);
  console.log('  Earnings Sample:');
  console.log(`    Total: ${mockEarnings.total.toFixed(4)} ${mockEarnings.currency}`);
  console.log(`    Transactions: ${mockEarnings.transactions.length}`);
  console.log(`    Projected Monthly: ${mockEarnings.projectedMonthly?.toFixed(4) || 'N/A'}`);
  console.log('');

  const mockMetrics = MockDataGenerator.generateNodeMetrics(ConnectorType.GRASS);
  console.log('  Metrics Sample:');
  console.log(`    Tasks Completed: ${mockMetrics.performance.tasksCompleted}`);
  console.log(`    Success Rate: ${mockMetrics.performance.successRate.toFixed(1)}%`);
  console.log(`    Uptime: ${mockMetrics.network.uptime.toFixed(1)}%`);
  console.log('');

  // 3. Demonstrate connector creation (with mock data)
  console.log('🔌 Connector Creation:');

  try {
    // This will use mock data since no real API key is provided
    const connector = ConnectorFactory.createWithAutoConfig(ConnectorType.IONET, {
      // No API key provided, will use mock data
    });

    console.log('  Created IoNet connector (using mock data)');
    console.log(`    Type: ${connector.type}`);
    console.log(`    Has API Key: ${connector.config.apiKey ? 'Yes' : 'No'}`);
    console.log(`    Base URL: ${connector.config.baseUrl || 'Not set'}`);
    console.log('');

    // Initialize and demonstrate basic functionality
    await connector.initialize(connector.config);
    console.log('  ✅ Connector initialized successfully');

    // Get mock node status
    const status = await connector.getNodeStatus();
    if (Array.isArray(status)) {
      console.log(`  📊 Retrieved ${status.length} node statuses`);
      console.log(`      First node: ${status[0]?.name || 'Unknown'} (${status[0]?.status || 'Unknown'})`);
    } else {
      console.log(`  📊 Retrieved node status: ${status.name} (${status.status})`);
    }

    // Get mock earnings
    const earnings = await connector.getEarnings(period);
    console.log(`  💰 Earnings: ${earnings.total.toFixed(4)} ${earnings.currency}`);

    // Clean up
    await connector.dispose();
    console.log('  ✅ Connector disposed properly');
    console.log('');

  } catch (error) {
    console.error('  ❌ Error creating connector:', error.message);
  }

  // 4. Show factory statistics
  console.log('📈 Factory Statistics:');
  const stats = ConnectorFactory.getStats();
  console.log(`  Total Instances: ${stats.totalInstances}`);
  console.log(`  Memory Usage: ${(stats.memoryUsage / 1024 / 1024).toFixed(2)} MB`);

  Object.entries(stats.instancesByType).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ${type}: ${count} instance(s)`);
    }
  });

  console.log('\n🎉 Demo completed successfully!');
  console.log('\n📚 For more examples, see:');
  console.log('  • src/examples/basic-usage.ts');
  console.log('  • README.md');
}

// Run the demo
demonstrateConnectors().catch(console.error);