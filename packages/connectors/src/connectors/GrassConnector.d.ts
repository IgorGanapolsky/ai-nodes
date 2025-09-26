import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';
/**
 * Grass Connector for bandwidth sharing
 * Specializes in decentralized bandwidth monetization
 */
export declare class GrassConnector extends BaseConnector {
  constructor();
  getDeviceStatus(externalId: string): Promise<DeviceStatus>;
  getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]>;
  getOccupancy(externalId: string, periodStart: Date, periodEnd: Date): Promise<DeviceOccupancy>;
  suggestPricing(externalId: string, targetUtilization: number): Promise<PricingSuggestion>;
  applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<boolean>;
  protected generateCustomMetrics(externalId: string, index: number): Record<string, any>;
  private generateUsagePattern;
  private getNetworkInterface;
}
//# sourceMappingURL=GrassConnector.d.ts.map
