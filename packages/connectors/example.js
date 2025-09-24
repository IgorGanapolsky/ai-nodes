const { createConnector, ConnectorNetwork } = require('./dist/index.js');

async function demonstrateConnectors() {
  console.log('=== DePIN Connectors Demo ===\n');

  // Create a single connector
  console.log('1. Creating IoNet connector...');
  const ionetConnector = createConnector(ConnectorNetwork.IONET);

  // Test device status
  const deviceId = 'test-device-12345';
  console.log(`\n2. Getting device status for ${deviceId}...`);
  const status = await ionetConnector.getDeviceStatus(deviceId);
  console.log('Device Status:', JSON.stringify(status, null, 2));

  // Test metrics
  console.log(`\n3. Getting metrics for ${deviceId} (last 24 hours)...`);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const metrics = await ionetConnector.getMetrics(deviceId, since);
  console.log(`Retrieved ${metrics.length} metric points`);
  console.log('Sample metric:', JSON.stringify(metrics[0], null, 2));

  // Test occupancy
  console.log(`\n4. Getting occupancy data for ${deviceId}...`);
  const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const periodEnd = new Date();
  const occupancy = await ionetConnector.getOccupancy(deviceId, periodStart, periodEnd);
  console.log('Occupancy:', JSON.stringify(occupancy, null, 2));

  // Test pricing suggestion
  console.log(`\n5. Getting pricing suggestion for ${deviceId}...`);
  const pricingSuggestion = await ionetConnector.suggestPricing(deviceId, 0.75);
  console.log('Pricing Suggestion:', JSON.stringify(pricingSuggestion, null, 2));

  // Test different networks
  console.log('\n6. Testing different networks...');
  const networks = [ConnectorNetwork.NOSANA, ConnectorNetwork.RENDER, ConnectorNetwork.GRASS, ConnectorNetwork.NATIX];

  for (const network of networks) {
    const connector = createConnector(network);
    const networkStatus = await connector.getDeviceStatus(deviceId);
    console.log(`${network.toUpperCase()} device online:`, networkStatus.online);
  }

  console.log('\n=== Demo completed successfully! ===');
}

// Run the demo
demonstrateConnectors().catch(console.error);