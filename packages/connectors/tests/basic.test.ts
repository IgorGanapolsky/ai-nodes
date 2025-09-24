import { ConnectorType, MockDataGenerator } from '../src/index';

describe('Basic Functionality', () => {
  describe('ConnectorType', () => {
    it('should have all required connector types', () => {
      expect(ConnectorType.IONET).toBe('ionet');
      expect(ConnectorType.NOSANA).toBe('nosana');
      expect(ConnectorType.RENDER).toBe('render');
      expect(ConnectorType.GRASS).toBe('grass');
      expect(ConnectorType.NATIX).toBe('natix');
      expect(ConnectorType.HUDDLE01).toBe('huddle01');
      expect(ConnectorType.OWNAI).toBe('ownai');
    });
  });

  describe('MockDataGenerator', () => {
    it('should generate mock node status', () => {
      const status = MockDataGenerator.generateNodeStatus(ConnectorType.IONET);

      expect(status).toBeDefined();
      expect(status.id).toBeDefined();
      expect(status.name).toBeDefined();
      expect(['online', 'offline', 'maintenance', 'error']).toContain(status.status);
      expect(typeof status.uptime).toBe('number');
      expect(status.health).toBeDefined();
      expect(status.health.cpu).toBeGreaterThanOrEqual(0);
      expect(status.health.cpu).toBeLessThanOrEqual(100);
    });

    it('should generate mock earnings', () => {
      const period = MockDataGenerator.generatePeriod('week');
      const earnings = MockDataGenerator.generateEarnings(period, ConnectorType.RENDER);

      expect(earnings).toBeDefined();
      expect(earnings.period).toEqual(period);
      expect(typeof earnings.total).toBe('number');
      expect(earnings.currency).toBe('RNDR');
      expect(earnings.breakdown).toBeDefined();
      expect(Array.isArray(earnings.transactions)).toBe(true);
    });

    it('should generate mock metrics', () => {
      const metrics = MockDataGenerator.generateNodeMetrics(ConnectorType.GRASS);

      expect(metrics).toBeDefined();
      expect(metrics.performance).toBeDefined();
      expect(metrics.resource_utilization).toBeDefined();
      expect(metrics.earnings).toBeDefined();
      expect(metrics.network).toBeDefined();
      expect(typeof metrics.performance.tasksCompleted).toBe('number');
      expect(typeof metrics.performance.successRate).toBe('number');
    });

    it('should generate multiple node statuses', () => {
      const statuses = MockDataGenerator.generateMultipleNodeStatuses(ConnectorType.IONET, 3);

      expect(Array.isArray(statuses)).toBe(true);
      expect(statuses).toHaveLength(3);
      statuses.forEach(status => {
        expect(status.id).toBeDefined();
        expect(status.name).toBeDefined();
      });
    });

    it('should generate different currencies for different connector types', () => {
      const ionetEarnings = MockDataGenerator.generateEarnings(
        MockDataGenerator.generatePeriod('day'),
        ConnectorType.IONET
      );
      const nosanaEarnings = MockDataGenerator.generateEarnings(
        MockDataGenerator.generatePeriod('day'),
        ConnectorType.NOSANA
      );

      expect(ionetEarnings.currency).toBe('IO');
      expect(nosanaEarnings.currency).toBe('NOS');
    });
  });

  describe('Period Generation', () => {
    it('should generate different period types', () => {
      const hourPeriod = MockDataGenerator.generatePeriod('hour');
      const dayPeriod = MockDataGenerator.generatePeriod('day');
      const weekPeriod = MockDataGenerator.generatePeriod('week');

      expect(hourPeriod.type).toBe('hour');
      expect(dayPeriod.type).toBe('day');
      expect(weekPeriod.type).toBe('week');

      expect(hourPeriod.end.getTime() - hourPeriod.start.getTime()).toBeCloseTo(60 * 60 * 1000, -3);
      expect(dayPeriod.end.getTime() - dayPeriod.start.getTime()).toBeCloseTo(24 * 60 * 60 * 1000, -3);
      expect(weekPeriod.end.getTime() - weekPeriod.start.getTime()).toBeCloseTo(7 * 24 * 60 * 60 * 1000, -3);
    });
  });
});