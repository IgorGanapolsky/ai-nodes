import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';

/**
 * IoNet Connector for GPU compute resources
 * Specializes in distributed GPU computing workloads
 */
export class IoNetConnector extends BaseConnector {
  constructor() {
    super('IO.NET');
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
      // GPU-specific metrics
      gpuUtilization: this.seededRandomInRange(externalId, 40, 95, index + 1000),
      gpuMemoryUsage: this.seededRandomInRange(externalId, 30, 80, index + 1001),
      gpuTemperature: this.seededRandomInRange(externalId, 45, 85, index + 1002),

      // Compute-specific metrics
      activeJobs: Math.floor(this.seededRandomInRange(externalId, 0, 8, index + 1003)),
      queuedJobs: Math.floor(this.seededRandomInRange(externalId, 0, 15, index + 1004)),
      completedJobsHourly: Math.floor(this.seededRandomInRange(externalId, 5, 25, index + 1005)),

      // IO.NET specific
      ioTokensEarned: this.seededRandomInRange(externalId, 0.1, 5.0, index + 1006),
      computeCredits: this.seededRandomInRange(externalId, 10, 500, index + 1007),
      networkLatency: this.seededRandomInRange(externalId, 5, 50, index + 1008), // ms

      // Hardware metrics
      powerConsumption: this.seededRandomInRange(externalId, 200, 400, index + 1009), // watts
      cudaCores: Math.floor(this.seededRandomInRange(externalId, 2048, 10240, index + 1010)),
      vramAvailable: this.seededRandomInRange(externalId, 8, 48, index + 1011), // GB
    };
  }
}
