/**
 * Base interface for DePIN connectors
 * Provides standardized methods for device management and pricing optimization
 */
export interface IConnector {
  /**
   * Get the current status of a device
   * @param externalId The external device identifier
   * @returns Promise resolving to device status information
   */
  getDeviceStatus(externalId: string): Promise<DeviceStatus>;

  /**
   * Get metrics for a device within a time period
   * @param externalId The external device identifier
   * @param since Timestamp to get metrics since (in milliseconds)
   * @returns Promise resolving to device metrics
   */
  getMetrics(externalId: string, since: number): Promise<DeviceMetrics>;

  /**
   * Get occupancy data for a device over a period
   * @param externalId The external device identifier
   * @param period Time period for occupancy calculation
   * @returns Promise resolving to occupancy data
   */
  getOccupancy(externalId: string, period: Period): Promise<OccupancyData>;

  /**
   * Suggest optimal pricing for a device based on target utilization
   * @param externalId The external device identifier
   * @param targetUtil Target utilization percentage (0-100)
   * @returns Promise resolving to pricing suggestion
   */
  suggestPricing(externalId: string, targetUtil: number): Promise<PricingSuggestion>;

  /**
   * Apply new pricing to a device
   * @param externalId The external device identifier
   * @param pricePerHour New price per hour
   * @param dryRun If true, only validate without applying changes
   * @returns Promise resolving to pricing application result
   */
  applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<PricingResult>;
}

/**
 * Device status information
 */
export interface DeviceStatus {
  id: string;
  externalId: string;
  name: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastSeen: number; // timestamp in milliseconds
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number]; // [lat, lng]
  };
  hardware: {
    cpu: string;
    memory: string;
    storage: string;
    gpu?: string;
  };
  network: {
    bandwidth: number; // Mbps
    latency: number; // ms
    uptime: number; // percentage
  };
  currentPrice: number; // per hour
  earnings: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

/**
 * Device metrics over time
 */
export interface DeviceMetrics {
  deviceId: string;
  period: {
    start: number;
    end: number;
  };
  utilization: {
    average: number; // percentage
    peak: number; // percentage
    samples: Array<{
      timestamp: number;
      value: number;
    }>;
  };
  performance: {
    completedJobs: number;
    failedJobs: number;
    averageJobDuration: number; // minutes
    uptime: number; // percentage
  };
  earnings: {
    total: number;
    perHour: number;
    currency: string;
  };
  resources: {
    cpu: {
      average: number; // percentage
      peak: number; // percentage
    };
    memory: {
      average: number; // percentage
      peak: number; // percentage
    };
    network: {
      bandwidth: number; // average Mbps used
      requests: number;
    };
  };
}

/**
 * Occupancy data for pricing optimization
 */
export interface OccupancyData {
  deviceId: string;
  period: Period;
  occupancy: {
    average: number; // percentage
    peak: number; // percentage
    hourly: Array<{
      hour: number; // 0-23
      occupancy: number; // percentage
      earnings: number;
    }>;
  };
  demandPattern: {
    peakHours: number[]; // hours with highest demand
    lowHours: number[]; // hours with lowest demand
    weekdayMultiplier: number;
    weekendMultiplier: number;
  };
}

/**
 * Pricing suggestion based on market analysis
 */
export interface PricingSuggestion {
  deviceId: string;
  currentPrice: number;
  suggestedPrice: number;
  confidence: number; // 0-100
  reasoning: string;
  impact: {
    utilizationChange: number; // percentage change expected
    revenueChange: number; // percentage change expected
    competitiveness: 'low' | 'medium' | 'high';
  };
  marketData: {
    averageMarketPrice: number;
    competitorCount: number;
    demandLevel: 'low' | 'medium' | 'high';
  };
}

/**
 * Result of pricing application
 */
export interface PricingResult {
  success: boolean;
  deviceId: string;
  oldPrice: number;
  newPrice: number;
  appliedAt?: number; // timestamp when applied
  error?: string;
  warnings?: string[];
  dryRun: boolean;
}

/**
 * Time period specification
 */
export interface Period {
  start: number; // timestamp in milliseconds
  end: number; // timestamp in milliseconds
  type: 'hour' | 'day' | 'week' | 'month' | 'custom';
}
