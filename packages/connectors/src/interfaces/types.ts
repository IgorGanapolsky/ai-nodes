/**
 * Core types for DePIN node connectors
 */

export interface NodeStatus {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  uptime: number; // in seconds
  lastSeen: Date;
  health: {
    cpu: number; // percentage
    memory: number; // percentage
    storage: number; // percentage
    network: number; // Mbps
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
    frequency: number; // GHz
  };
  memory: {
    total: number; // GB
    available: number; // GB
  };
  storage: {
    total: number; // GB
    available: number; // GB
    type: 'SSD' | 'HDD' | 'NVMe';
  };
  gpu?: {
    model: string;
    memory: number; // GB
    compute: number; // TFLOPS
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
    averageTaskDuration: number; // seconds
    successRate: number; // percentage
  };
  resource_utilization: {
    cpu: number; // percentage
    memory: number; // percentage
    storage: number; // percentage
    bandwidth: number; // Mbps
    gpu?: number; // percentage
  };
  earnings: {
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  network: {
    latency: number; // ms
    throughput: number; // Mbps
    uptime: number; // percentage
  };
  reputation?: {
    score: number;
    rank: number;
    totalNodes: number;
  };
}

export interface PricingStrategy {
  recommended: {
    cpu: number; // price per core hour
    memory: number; // price per GB hour
    storage: number; // price per GB hour
    bandwidth: number; // price per GB
    gpu?: number; // price per GPU hour
  };
  market: {
    average: number;
    minimum: number;
    maximum: number;
  };
  optimization: {
    suggestion: string;
    expectedIncrease: number; // percentage
    confidenceScore: number; // 0-1
  };
}

export interface OptimizationParams {
  targetUtilization?: number; // percentage
  priceStrategy?: 'competitive' | 'premium' | 'budget';
  marketConditions?: 'high_demand' | 'normal' | 'low_demand';
  nodeSpecs?: NodeSpecs;
  historicalData?: boolean;
}

export interface ConnectorConfig {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number; // milliseconds
  retryAttempts?: number;
  retryDelay?: number; // milliseconds
  rateLimit?: {
    requests: number;
    window: number; // milliseconds
  };
  cache?: {
    enabled: boolean;
    ttl: number; // seconds
  };
  scraper?: {
    enabled: boolean;
    headless?: boolean;
    timeout?: number;
  };
}

export class ConnectorError extends Error {
  public code: string;
  public details?: any;
  public retryable: boolean;

  constructor(code: string, message: string, details?: any, retryable: boolean = false) {
    super(message);
    this.name = 'ConnectorError';
    this.code = code;
    this.details = details;
    this.retryable = retryable;
  }
}

export enum ConnectorType {
  IONET = 'ionet',
  NOSANA = 'nosana',
  RENDER = 'render',
  GRASS = 'grass',
  NATIX = 'natix',
  HUDDLE01 = 'huddle01',
  OWNAI = 'ownai'
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RateLimitInfo {
  remaining: number;
  reset: number; // timestamp
  limit: number;
}