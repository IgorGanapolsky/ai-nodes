import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';
/**
 * Natix Connector for mapping and camera data
 * Specializes in decentralized mapping data collection via mobile devices
 */
export declare class NatixConnector extends BaseConnector {
  constructor();
  getDeviceStatus(externalId: string): Promise<DeviceStatus>;
  getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]>;
  getOccupancy(externalId: string, periodStart: Date, periodEnd: Date): Promise<DeviceOccupancy>;
  suggestPricing(externalId: string, targetUtilization: number): Promise<PricingSuggestion>;
  applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<boolean>;
  protected generateCustomMetrics(externalId: string, index: number): Record<string, any>;
  private getRoadTypes;
  private getWeatherCondition;
  private getTimePattern;
  private getSpeedProfile;
}
//# sourceMappingURL=NatixConnector.d.ts.map
