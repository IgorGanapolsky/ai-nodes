import { createConnector, ConnectorNetwork } from '../src/index';
describe('DePIN Connectors', () => {
  const deviceId = 'test-device-123';
  describe('ConnectorFactory', () => {
    test('should create IoNet connector', () => {
      const connector = createConnector(ConnectorNetwork.IONET);
      expect(connector).toBeDefined();
    });
    test('should create all network connectors', () => {
      const networks = [
        ConnectorNetwork.IONET,
        ConnectorNetwork.NOSANA,
        ConnectorNetwork.RENDER,
        ConnectorNetwork.GRASS,
        ConnectorNetwork.NATIX,
      ];
      networks.forEach((network) => {
        const connector = createConnector(network);
        expect(connector).toBeDefined();
      });
    });
  });
  describe('Device Status', () => {
    test('should return device status', async () => {
      const connector = createConnector(ConnectorNetwork.IONET);
      const status = await connector.getDeviceStatus(deviceId);
      expect(status).toBeDefined();
      expect(typeof status.online).toBe('boolean');
      expect(status.lastSeen).toBeInstanceOf(Date);
      expect(status.version === undefined || typeof status.version === 'string').toBe(true);
    });
    test('should return deterministic data for same device ID', async () => {
      const connector1 = createConnector(ConnectorNetwork.IONET);
      const connector2 = createConnector(ConnectorNetwork.IONET);
      const status1 = await connector1.getDeviceStatus(deviceId);
      const status2 = await connector2.getDeviceStatus(deviceId);
      expect(status1.online).toBe(status2.online);
      expect(status1.lastSeen.getTime()).toBe(status2.lastSeen.getTime());
    });
  });
  describe('Device Metrics', () => {
    test('should return metrics array', async () => {
      const connector = createConnector(ConnectorNetwork.IONET);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const metrics = await connector.getMetrics(deviceId, since);
      expect(Array.isArray(metrics)).toBe(true);
      expect(metrics.length).toBeGreaterThan(0);
      const firstMetric = metrics[0];
      expect(firstMetric.timestamp).toBeInstanceOf(Date);
      expect(typeof firstMetric.cpuUsage).toBe('number');
      expect(typeof firstMetric.memoryUsage).toBe('number');
      expect(typeof firstMetric.diskUsage).toBe('number');
      expect(typeof firstMetric.networkIn).toBe('number');
      expect(typeof firstMetric.networkOut).toBe('number');
    });
    test('should include custom metrics for IoNet', async () => {
      const connector = createConnector(ConnectorNetwork.IONET);
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const metrics = await connector.getMetrics(deviceId, since);
      const firstMetric = metrics[0];
      expect(firstMetric.customMetrics).toBeDefined();
      expect(typeof firstMetric.customMetrics.gpuUtilization).toBe('number');
      expect(typeof firstMetric.customMetrics.ioTokensEarned).toBe('number');
    });
  });
  describe('Occupancy Data', () => {
    test('should return occupancy information', async () => {
      const connector = createConnector(ConnectorNetwork.IONET);
      const periodStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const periodEnd = new Date();
      const occupancy = await connector.getOccupancy(deviceId, periodStart, periodEnd);
      expect(occupancy.periodStart).toEqual(periodStart);
      expect(occupancy.periodEnd).toEqual(periodEnd);
      expect(typeof occupancy.occupiedHours).toBe('number');
      expect(typeof occupancy.totalHours).toBe('number');
      expect(typeof occupancy.utilizationRate).toBe('number');
      expect(occupancy.utilizationRate).toBeGreaterThanOrEqual(0);
      expect(occupancy.utilizationRate).toBeLessThanOrEqual(100);
    });
  });
  describe('Pricing Suggestions', () => {
    test('should return pricing suggestion', async () => {
      const connector = createConnector(ConnectorNetwork.IONET);
      const targetUtilization = 0.75;
      const suggestion = await connector.suggestPricing(deviceId, targetUtilization);
      expect(typeof suggestion.currentPrice).toBe('number');
      expect(typeof suggestion.suggestedPrice).toBe('number');
      expect(typeof suggestion.reasoning).toBe('string');
      expect(suggestion.estimatedImpact).toBeDefined();
      expect(typeof suggestion.estimatedImpact.utilizationChange).toBe('number');
      expect(typeof suggestion.estimatedImpact.revenueChange).toBe('number');
    });
  });
  describe('Apply Pricing', () => {
    test('should apply pricing in dry run mode', async () => {
      const connector = createConnector(ConnectorNetwork.IONET);
      const result = await connector.applyPricing(deviceId, 1.5, true);
      expect(typeof result).toBe('boolean');
      expect(result).toBe(true); // Dry run should always succeed
    });
  });
});
