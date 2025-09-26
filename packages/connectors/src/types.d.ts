export interface DeviceStatus {
  online: boolean;
  lastSeen: Date;
  version?: string;
}
export interface DeviceMetrics {
  timestamp: Date;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  customMetrics?: Record<string, any>;
}
export interface DeviceOccupancy {
  periodStart: Date;
  periodEnd: Date;
  occupiedHours: number;
  totalHours: number;
  utilizationRate: number;
}
export interface PricingSuggestion {
  currentPrice: number;
  suggestedPrice: number;
  reasoning: string;
  estimatedImpact: {
    utilizationChange: number;
    revenueChange: number;
  };
}
export interface IConnector {
  getDeviceStatus(externalId: string): Promise<DeviceStatus>;
  getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]>;
  getOccupancy(externalId: string, periodStart: Date, periodEnd: Date): Promise<DeviceOccupancy>;
  suggestPricing(externalId: string, targetUtilization: number): Promise<PricingSuggestion>;
  applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<boolean>;
}
//# sourceMappingURL=types.d.ts.map
