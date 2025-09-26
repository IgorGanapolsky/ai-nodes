import { ConnectorType } from '../interfaces/types';
/**
 * Mock data generator for testing and development
 */
export class MockDataGenerator {
  static SAMPLE_COUNTRIES = [
    'United States',
    'Germany',
    'Singapore',
    'Canada',
    'Japan',
    'United Kingdom',
    'Netherlands',
    'France',
    'Australia',
    'South Korea',
  ];
  static SAMPLE_REGIONS = [
    'us-east-1',
    'eu-west-1',
    'ap-southeast-1',
    'us-west-2',
    'eu-central-1',
    'ap-northeast-1',
    'ca-central-1',
  ];
  static GPU_MODELS = [
    'NVIDIA RTX 4090',
    'NVIDIA RTX 4080',
    'NVIDIA RTX 3090',
    'NVIDIA A100',
    'NVIDIA H100',
    'AMD RX 7900 XTX',
  ];
  static CPU_MODELS = [
    'Intel i9-13900K',
    'AMD Ryzen 9 7950X',
    'Intel Xeon Gold 6248R',
    'AMD EPYC 7742',
    'Apple M2 Ultra',
    'Intel i7-13700K',
  ];
  /**
   * Generate random number within range
   */
  static random(min, max) {
    return Math.random() * (max - min) + min;
  }
  /**
   * Generate random integer within range
   */
  static randomInt(min, max) {
    return Math.floor(this.random(min, max));
  }
  /**
   * Pick random element from array
   */
  static randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
  }
  /**
   * Generate realistic node ID
   */
  static generateNodeId(connectorType) {
    const prefix = connectorType.toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 10);
    return `${prefix}-${randomSuffix}`;
  }
  /**
   * Generate mock node specifications
   */
  static generateNodeSpecs(connectorType) {
    const hasGpu = [ConnectorType.IONET, ConnectorType.RENDER, ConnectorType.OWNAI].includes(
      connectorType,
    );
    return {
      cpu: {
        cores: this.randomChoice([8, 16, 24, 32, 64]),
        model: this.randomChoice(this.CPU_MODELS),
        frequency: this.random(2.5, 5.0),
      },
      memory: {
        total: this.randomChoice([16, 32, 64, 128, 256]),
        available: this.random(12, 24),
      },
      storage: {
        total: this.randomChoice([512, 1000, 2000, 4000]),
        available: this.random(100, 500),
        type: this.randomChoice(['SSD', 'NVMe']),
      },
      ...(hasGpu && {
        gpu: {
          model: this.randomChoice(this.GPU_MODELS),
          memory: this.randomChoice([8, 12, 16, 24, 48, 80]),
          compute: this.random(20, 165), // TFLOPS
        },
      }),
    };
  }
  /**
   * Generate mock node status
   */
  static generateNodeStatus(connectorType) {
    const specs = this.generateNodeSpecs(connectorType);
    const isOnline = Math.random() > 0.1; // 90% uptime
    return {
      id: this.generateNodeId(connectorType),
      name: `Node-${this.randomInt(1000, 9999)}`,
      status: isOnline
        ? this.randomChoice(['online', 'online', 'online', 'maintenance'])
        : 'offline',
      uptime: this.randomInt(3600, 2592000), // 1 hour to 30 days
      lastSeen: new Date(Date.now() - this.randomInt(0, 300000)), // Within last 5 minutes
      health: {
        cpu: this.random(20, 85),
        memory: this.random(30, 75),
        storage: this.random(15, 60),
        network: this.random(100, 1000),
      },
      location: {
        country: this.randomChoice(this.SAMPLE_COUNTRIES),
        region: this.randomChoice(this.SAMPLE_REGIONS),
        latitude: this.random(-90, 90),
        longitude: this.random(-180, 180),
      },
      version: `v${this.randomInt(1, 3)}.${this.randomInt(0, 9)}.${this.randomInt(0, 9)}`,
      specs,
    };
  }
  /**
   * Generate mock transactions
   */
  static generateTransactions(count) {
    const transactions = [];
    for (let i = 0; i < count; i++) {
      const type = this.randomChoice([
        'earnings',
        'earnings',
        'earnings',
        'bonus',
        'staking_reward',
      ]);
      const amount = type === 'earnings' ? this.random(0.1, 5.0) : this.random(5.0, 50.0);
      transactions.push({
        id: `tx_${Math.random().toString(36).substring(2, 12)}`,
        timestamp: new Date(Date.now() - this.randomInt(0, 86400000 * 30)), // Last 30 days
        amount,
        type,
        description: this.generateTransactionDescription(type, amount),
        txHash: `0x${Math.random().toString(16).substring(2, 66)}`,
      });
    }
    return transactions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
  /**
   * Generate transaction description
   */
  static generateTransactionDescription(type, amount) {
    switch (type) {
      case 'earnings':
        return `Task completion reward: ${amount.toFixed(4)} tokens`;
      case 'bonus':
        return `Performance bonus: ${amount.toFixed(4)} tokens`;
      case 'staking_reward':
        return `Staking reward: ${amount.toFixed(4)} tokens`;
      case 'penalty':
        return `SLA penalty: -${amount.toFixed(4)} tokens`;
      default:
        return `Transaction: ${amount.toFixed(4)} tokens`;
    }
  }
  /**
   * Generate mock earnings
   */
  static generateEarnings(period, connectorType) {
    const daysInPeriod = Math.ceil(
      (period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24),
    );
    const dailyEarnings = this.random(1, 20);
    const total = dailyEarnings * daysInPeriod;
    const transactions = this.generateTransactions(this.randomInt(5, 50));
    // Different revenue models per connector type
    let breakdown = {};
    switch (connectorType) {
      case ConnectorType.IONET:
      case ConnectorType.RENDER:
      case ConnectorType.OWNAI:
        breakdown = {
          compute: total * 0.8,
          rewards: total * 0.2,
        };
        break;
      case ConnectorType.GRASS:
        breakdown = {
          bandwidth: total * 0.9,
          rewards: total * 0.1,
        };
        break;
      case ConnectorType.NOSANA:
        breakdown = {
          compute: total * 0.7,
          staking: total * 0.3,
        };
        break;
      default:
        breakdown = {
          compute: total * 0.6,
          storage: total * 0.2,
          rewards: total * 0.2,
        };
    }
    return {
      period,
      total,
      currency: this.getCurrency(connectorType),
      breakdown,
      transactions,
      projectedMonthly: dailyEarnings * 30,
      projectedYearly: dailyEarnings * 365,
    };
  }
  /**
   * Get currency for connector type
   */
  static getCurrency(connectorType) {
    switch (connectorType) {
      case ConnectorType.IONET:
        return 'IO';
      case ConnectorType.NOSANA:
        return 'NOS';
      case ConnectorType.RENDER:
        return 'RNDR';
      case ConnectorType.GRASS:
        return 'GRASS';
      case ConnectorType.NATIX:
        return 'NATIX';
      case ConnectorType.HUDDLE01:
        return 'HUD01';
      case ConnectorType.OWNAI:
        return 'OWN';
      default:
        return 'TOKEN';
    }
  }
  /**
   * Generate mock node metrics
   */
  static generateNodeMetrics(connectorType) {
    const tasksCompleted = this.randomInt(100, 10000);
    const tasksFailed = this.randomInt(0, Math.floor(tasksCompleted * 0.1));
    const tasksActive = this.randomInt(0, 50);
    return {
      performance: {
        tasksCompleted,
        tasksActive,
        tasksFailed,
        averageTaskDuration: this.random(60, 3600),
        successRate: (tasksCompleted / (tasksCompleted + tasksFailed)) * 100,
      },
      resource_utilization: {
        cpu: this.random(20, 85),
        memory: this.random(30, 75),
        storage: this.random(15, 60),
        bandwidth: this.random(50, 500),
        ...(this.hasGpu(connectorType) && { gpu: this.random(40, 95) }),
      },
      earnings: {
        hourly: this.random(0.5, 5.0),
        daily: this.random(10, 100),
        weekly: this.random(70, 700),
        monthly: this.random(300, 3000),
      },
      network: {
        latency: this.random(10, 100),
        throughput: this.random(100, 1000),
        uptime: this.random(95, 99.9),
      },
      reputation: {
        score: this.random(7.5, 9.8),
        rank: this.randomInt(1, 10000),
        totalNodes: this.randomInt(50000, 200000),
      },
    };
  }
  /**
   * Check if connector type typically has GPU
   */
  static hasGpu(connectorType) {
    return [ConnectorType.IONET, ConnectorType.RENDER, ConnectorType.OWNAI].includes(connectorType);
  }
  /**
   * Generate mock pricing strategy
   */
  static generatePricingStrategy(connectorType) {
    const basePrice = this.random(0.1, 2.0);
    return {
      recommended: {
        cpu: basePrice,
        memory: basePrice * 0.1,
        storage: basePrice * 0.05,
        bandwidth: basePrice * 0.01,
        ...(this.hasGpu(connectorType) && { gpu: basePrice * 10 }),
      },
      market: {
        average: basePrice * this.random(0.9, 1.1),
        minimum: basePrice * this.random(0.5, 0.8),
        maximum: basePrice * this.random(1.2, 2.0),
      },
      optimization: {
        suggestion: this.randomChoice([
          'Increase pricing by 15% to match market average',
          'Lower pricing by 10% to increase demand',
          'Current pricing is optimal',
          'Consider premium pricing for high-spec nodes',
        ]),
        expectedIncrease: this.random(-10, 25),
        confidenceScore: this.random(0.6, 0.95),
      },
    };
  }
  /**
   * Generate multiple node statuses
   */
  static generateMultipleNodeStatuses(connectorType, count) {
    const statuses = [];
    for (let i = 0; i < count; i++) {
      statuses.push(this.generateNodeStatus(connectorType));
    }
    return statuses;
  }
  /**
   * Generate multiple node metrics
   */
  static generateMultipleNodeMetrics(connectorType, count) {
    const metrics = [];
    for (let i = 0; i < count; i++) {
      metrics.push(this.generateNodeMetrics(connectorType));
    }
    return metrics;
  }
  /**
   * Generate period for testing
   */
  static generatePeriod(type = 'day') {
    const end = new Date();
    let start;
    switch (type) {
      case 'hour':
        start = new Date(end.getTime() - 60 * 60 * 1000);
        break;
      case 'day':
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    }
    return { start, end, type };
  }
}
