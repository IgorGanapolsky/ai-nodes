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
  lastSeen: number;
  location?: {
    country: string;
    city: string;
    coordinates?: [number, number];
  };
  hardware: {
    cpu: string;
    memory: string;
    storage: string;
    gpu?: string;
  };
  network: {
    bandwidth: number;
    latency: number;
    uptime: number;
  };
  currentPrice: number;
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
    average: number;
    peak: number;
    samples: Array<{
      timestamp: number;
      value: number;
    }>;
  };
  performance: {
    completedJobs: number;
    failedJobs: number;
    averageJobDuration: number;
    uptime: number;
  };
  earnings: {
    total: number;
    perHour: number;
    currency: string;
  };
  resources: {
    cpu: {
      average: number;
      peak: number;
    };
    memory: {
      average: number;
      peak: number;
    };
    network: {
      bandwidth: number;
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
    average: number;
    peak: number;
    hourly: Array<{
      hour: number;
      occupancy: number;
      earnings: number;
    }>;
  };
  demandPattern: {
    peakHours: number[];
    lowHours: number[];
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
  confidence: number;
  reasoning: string;
  impact: {
    utilizationChange: number;
    revenueChange: number;
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
  appliedAt?: number;
  error?: string;
  warnings?: string[];
  dryRun: boolean;
}
/**
 * Time period specification
 */
export interface Period {
  start: number;
  end: number;
  type: 'hour' | 'day' | 'week' | 'month' | 'custom';
}
//# sourceMappingURL=IConnector.d.ts.map
