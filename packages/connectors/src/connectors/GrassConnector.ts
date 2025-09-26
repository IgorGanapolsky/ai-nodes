import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';

/**
 * Grass Connector for bandwidth sharing
 * Specializes in decentralized bandwidth monetization
 */
export class GrassConnector extends BaseConnector {
  constructor() {
    super('Grass');
  }

  async getDeviceStatus(externalId: string): Promise<DeviceStatus> {
    await this.simulateDelay();
    return this.generateMockDeviceStatus(externalId);
  }

  async getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]> {
    await this.simulateDelay();
    return this.generateMockMetrics(externalId, since);
  }

  async getOccupancy(
    externalId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<DeviceOccupancy> {
    await this.simulateDelay();
    return this.generateMockOccupancy(externalId, periodStart, periodEnd);
  }

  async suggestPricing(externalId: string, targetUtilization: number): Promise<PricingSuggestion> {
    await this.simulateDelay();
    return this.generateMockPricingSuggestion(externalId, targetUtilization);
  }

  async applyPricing(externalId: string, pricePerHour: number, dryRun: boolean): Promise<boolean> {
    return this.mockApplyPricing(externalId, pricePerHour, dryRun);
  }

  protected generateCustomMetrics(externalId: string, index: number): Record<string, any> {
    return {
      // Bandwidth sharing specific metrics
      bandwidthShared: this.seededRandomInRange(externalId, 50, 500, index + 4000), // GB
      bandwidthRequests: Math.floor(this.seededRandomInRange(externalId, 100, 2000, index + 4001)),
      uploadSpeed: this.seededRandomInRange(externalId, 10, 100, index + 4002), // Mbps
      downloadSpeed: this.seededRandomInRange(externalId, 20, 200, index + 4003), // Mbps

      // Network quality metrics
      connectionStability: this.seededRandomInRange(externalId, 0.9, 1.0, index + 4004),
      averageLatency: this.seededRandomInRange(externalId, 10, 50, index + 4005), // ms
      jitter: this.seededRandomInRange(externalId, 1, 10, index + 4006), // ms
      packetLoss: this.seededRandomInRange(externalId, 0, 2, index + 4007), // percentage

      // Grass-specific metrics
      grassPoints: Math.floor(this.seededRandomInRange(externalId, 1000, 50000, index + 4008)),
      referralEarnings: this.seededRandomInRange(externalId, 0, 100, index + 4009),
      streakDays: Math.floor(this.seededRandomInRange(externalId, 1, 365, index + 4010)),

      // Usage patterns
      peakHoursActive: Math.floor(this.seededRandomInRange(externalId, 8, 16, index + 4011)), // hours
      dataUsagePatterns: this.generateUsagePattern(externalId, index),
      geoLocationRequests: Math.floor(this.seededRandomInRange(externalId, 50, 800, index + 4012)),

      // Performance metrics
      sessionUptime: this.seededRandomInRange(externalId, 0.85, 0.99, index + 4013),
      averageSessionLength: this.seededRandomInRange(externalId, 3600, 28800, index + 4014), // seconds
      reconnectionRate: this.seededRandomInRange(externalId, 0, 5, index + 4015), // per day

      // Device health for bandwidth sharing
      thermalStatus: this.seededRandomInRange(externalId, 30, 60, index + 4016), // °C
      networkInterface: this.getNetworkInterface(externalId, index),
      vpnCompatibility: this.seededRandomBoolean(externalId, 0.8, index + 4017),
    };
  }

  private generateUsagePattern(externalId: string, baseIndex: number): Record<string, number> {
    const hours: Record<string, number> = {};
    for (let i = 0; i < 24; i++) {
      hours[`hour_${i}`] = this.seededRandomInRange(externalId, 0.1, 1.0, baseIndex + 5000 + i);
    }
    return hours;
  }

  private getNetworkInterface(externalId: string, index: number): string {
    const interfaces = ['ethernet', 'wifi', 'cellular', 'fiber'];
    const interfaceIndex = Math.floor(
      this.seededRandomInRange(externalId, 0, interfaces.length, index + 4018),
    );
    return interfaces[interfaceIndex];
  }
}
