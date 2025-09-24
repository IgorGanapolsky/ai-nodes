import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';
/**
 * Nosana Connector for CPU compute resources
 * Specializes in decentralized CPU computing and AI inference
 */
export declare class NosanaConnector extends BaseConnector {
    constructor();
    getDeviceStatus(externalId: string): Promise<DeviceStatus>;
    getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]>;
    getOccupancy(externalId: string, periodStart: Date, periodEnd: Date): Promise<DeviceOccupancy>;
    suggestPricing(externalId: string, targetUtilization: number): Promise<PricingSuggestion>;
    applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<boolean>;
    protected generateCustomMetrics(externalId: string, index: number): Record<string, any>;
}
//# sourceMappingURL=NosanaConnector.d.ts.map