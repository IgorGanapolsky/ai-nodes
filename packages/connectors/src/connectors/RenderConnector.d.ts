import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';
/**
 * Render Connector for 3D rendering workloads
 * Specializes in distributed GPU-based rendering services
 */
export declare class RenderConnector extends BaseConnector {
  constructor();
  getDeviceStatus(externalId: string): Promise<DeviceStatus>;
  getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]>;
  getOccupancy(externalId: string, periodStart: Date, periodEnd: Date): Promise<DeviceOccupancy>;
  suggestPricing(externalId: string, targetUtilization: number): Promise<PricingSuggestion>;
  applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<boolean>;
  protected generateCustomMetrics(externalId: string, index: number): Record<string, any>;
}
//# sourceMappingURL=RenderConnector.d.ts.map
