import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';
/**
 * IoNet Connector for GPU compute resources
 * Specializes in distributed GPU computing workloads
 */
export declare class IoNetConnector extends BaseConnector {
  constructor();
  getDeviceStatus(externalId: string): Promise<DeviceStatus>;
  getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]>;
  getOccupancy(externalId: string, periodStart: Date, periodEnd: Date): Promise<DeviceOccupancy>;
  suggestPricing(externalId: string, targetUtilization: number): Promise<PricingSuggestion>;
  applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<boolean>;
  protected generateCustomMetrics(externalId: string, index: number): Record<string, any>;
}
//# sourceMappingURL=IoNetConnector.d.ts.map
