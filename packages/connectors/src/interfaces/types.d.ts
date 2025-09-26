/**
 * Core types for DePIN node connectors
 */
export interface NodeStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  uptime: number;
  lastSeen: Date;
  health: {
    cpu: number;
    memory: number;
    storage: number;
    network: number;
  };
  location?: {
    country: string;
    region: string;
    latitude?: number;
    longitude?: number;
  };
  version?: string;
  specs?: NodeSpecs;
}
export interface NodeSpecs {
  cpu: {
    cores: number;
    model: string;
    frequency: number;
  };
  memory: {
    total: number;
    available: number;
  };
  storage: {
    total: number;
    available: number;
    type: 'SSD' | 'HDD' | 'NVMe';
  };
  gpu?: {
    model: string;
    memory: number;
    compute: number;
  };
}
export interface Earnings {
  period: Period;
  total: number;
  currency: string;
  breakdown: {
    compute?: number;
    storage?: number;
    bandwidth?: number;
    staking?: number;
    rewards?: number;
  };
  transactions: Transaction[];
  projectedMonthly?: number;
  projectedYearly?: number;
}
export interface Transaction {
  id: string;
  timestamp: Date;
  amount: number;
  type: 'earnings' | 'penalty' | 'bonus' | 'staking_reward';
  description: string;
  txHash?: string;
}
export interface Period {
  start: Date;
  end: Date;
  type: 'hour' | 'day' | 'week' | 'month' | 'year' | 'custom';
}
export interface NodeMetrics {
  performance: {
    tasksCompleted: number;
    tasksActive: number;
    tasksFailed: number;
    averageTaskDuration: number;
    successRate: number;
  };
  resource_utilization: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
    gpu?: number;
  };
  earnings: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  network: {
    latency: number;
    throughput: number;
    uptime: number;
  };
  reputation?: {
    score: number;
    rank: number;
    totalNodes: number;
  };
}
export interface PricingStrategy {
  recommended: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
    gpu?: number;
  };
  market: {
    average: number;
    minimum: number;
    maximum: number;
  };
  optimization: {
    suggestion: string;
    expectedIncrease: number;
    confidenceScore: number;
  };
}
export interface OptimizationParams {
  targetUtilization?: number;
  priceStrategy?: 'competitive' | 'premium' | 'budget';
  marketConditions?: 'high_demand' | 'normal' | 'low_demand';
  nodeSpecs?: NodeSpecs;
  historicalData?: boolean;
}
export interface ConnectorConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  rateLimit?: {
    requests: number;
    window: number;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
  };
  scraper?: {
    enabled: boolean;
    headless?: boolean;
    timeout?: number;
  };
}
export declare class ConnectorError extends Error {
  code: string;
  details?: any;
  retryable: boolean;
  constructor(code: string, message: string, details?: any, retryable?: boolean);
}
export declare enum ConnectorType {
  IONET = 'ionet',
  NOSANA = 'nosana',
  RENDER = 'render',
  GRASS = 'grass',
  NATIX = 'natix',
  HUDDLE01 = 'huddle01',
  OWNAI = 'ownai',
}
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
export interface RateLimitInfo {
  remaining: number;
  reset: number;
  limit: number;
}
//# sourceMappingURL=types.d.ts.map
