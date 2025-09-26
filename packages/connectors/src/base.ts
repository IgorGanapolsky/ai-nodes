import {
  IConnector,
  DeviceStatus,
  DeviceMetrics,
  DeviceOccupancy,
  PricingSuggestion,
} from './types';

/**
 * Base abstract class for DePIN connectors
 * Provides common functionality and mock data generation utilities
 */
export abstract class BaseConnector implements IConnector {
  protected networkName: string;

  constructor(networkName: string) {
    this.networkName = networkName;
  }

  abstract getDeviceStatus(externalId: string): Promise<DeviceStatus>;
  abstract getMetrics(externalId: string, since: Date): Promise<DeviceMetrics[]>;
  abstract getOccupancy(
    externalId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<DeviceOccupancy>;
  abstract suggestPricing(
    externalId: string,
    targetUtilization: number,
  ): Promise<PricingSuggestion>;
  abstract applyPricing(
    externalId: string,
    pricePerHour: number,
    dryRun: boolean,
  ): Promise<boolean>;

  /**
   * Generate a deterministic random number based on a seed string
   * This ensures consistent mock data for the same device ID
   */
  protected seededRandom(seed: string, index: number = 0): number {
    const hash = this.hashCode(seed + index);
    return Math.abs(Math.sin(hash)) % 1;
  }

  /**
   * Generate a hash code from a string
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Generate a deterministic random number within a range
   */
  protected seededRandomInRange(seed: string, min: number, max: number, index: number = 0): number {
    const random = this.seededRandom(seed, index);
    return min + random * (max - min);
  }

  /**
   * Generate deterministic boolean based on probability
   */
  protected seededRandomBoolean(
    seed: string,
    probability: number = 0.5,
    index: number = 0,
  ): boolean {
    return this.seededRandom(seed, index) < probability;
  }

  /**
   * Simulate network delay
   */
  protected async simulateDelay(minMs: number = 100, maxMs: number = 500): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Generate mock device status
   */
  protected generateMockDeviceStatus(externalId: string): DeviceStatus {
    const isOnline = this.seededRandomBoolean(externalId, 0.85);
    const versionSeed = this.seededRandom(externalId, 100);

    // Use a fixed base time to ensure deterministic results
    const baseTime = new Date('2025-09-24T14:00:00.000Z').getTime();
    const timeOffset = this.seededRandomInRange(externalId, 0, 3600000, 1); // Within last hour

    return {
      online: isOnline,
      lastSeen: new Date(baseTime - timeOffset),
      version:
        versionSeed > 0.7
          ? `v${Math.floor(this.seededRandomInRange(externalId, 1, 5, 2))}.${Math.floor(this.seededRandomInRange(externalId, 0, 10, 3))}`
          : undefined,
    };
  }

  /**
   * Generate mock device metrics for a time period
   */
  protected generateMockMetrics(externalId: string, since: Date): DeviceMetrics[] {
    const metrics: DeviceMetrics[] = [];
    const now = new Date();
    const timeDiff = now.getTime() - since.getTime();
    const intervalMs = Math.min(300000, timeDiff / 20); // 5-minute intervals or divide period into 20 points

    for (let i = 0; i < 20 && since.getTime() + i * intervalMs <= now.getTime(); i++) {
      const timestamp = new Date(since.getTime() + i * intervalMs);

      // Generate realistic metrics with some correlation
      const baseCpu = this.seededRandomInRange(externalId, 10, 80, i);
      const baseMemory = this.seededRandomInRange(externalId, 20, 70, i + 100);

      metrics.push({
        timestamp,
        cpuUsage: Math.min(100, baseCpu + this.seededRandomInRange(externalId, -10, 10, i + 200)),
        memoryUsage: Math.min(
          100,
          baseMemory + this.seededRandomInRange(externalId, -5, 15, i + 300),
        ),
        diskUsage: this.seededRandomInRange(externalId, 40, 95, i + 400),
        networkIn: this.seededRandomInRange(externalId, 0, 1000, i + 500), // MB/s
        networkOut: this.seededRandomInRange(externalId, 0, 500, i + 600), // MB/s
        customMetrics: this.generateCustomMetrics(externalId, i),
      });
    }

    return metrics;
  }

  /**
   * Generate network-specific custom metrics
   */
  protected abstract generateCustomMetrics(externalId: string, index: number): Record<string, any>;

  /**
   * Generate mock occupancy data
   */
  protected generateMockOccupancy(
    externalId: string,
    periodStart: Date,
    periodEnd: Date,
  ): DeviceOccupancy {
    const totalHours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
    const baseUtilization = this.seededRandomInRange(externalId, 0.3, 0.9, 1000);
    const occupiedHours = totalHours * baseUtilization;

    return {
      periodStart,
      periodEnd,
      occupiedHours: Math.round(occupiedHours * 100) / 100,
      totalHours: Math.round(totalHours * 100) / 100,
      utilizationRate: Math.round(baseUtilization * 10000) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Generate mock pricing suggestion
   */
  protected generateMockPricingSuggestion(
    externalId: string,
    targetUtilization: number,
  ): PricingSuggestion {
    const currentPrice = this.seededRandomInRange(externalId, 0.1, 2.0, 2000);
    const currentUtilization = this.seededRandomInRange(externalId, 0.2, 0.8, 2001);

    // Simple pricing logic: if target > current, increase price; otherwise decrease
    const pricingFactor = targetUtilization > currentUtilization ? 1.1 : 0.9;
    const suggestedPrice = Math.round(currentPrice * pricingFactor * 100) / 100;

    const utilizationChange = (targetUtilization - currentUtilization) * 100;
    const revenueChange = (suggestedPrice / currentPrice - 1) * 100;

    return {
      currentPrice,
      suggestedPrice,
      reasoning: `Based on ${this.networkName} market analysis, ${utilizationChange > 0 ? 'increasing' : 'decreasing'} price to achieve target utilization of ${Math.round(targetUtilization * 100)}%`,
      estimatedImpact: {
        utilizationChange: Math.round(utilizationChange * 100) / 100,
        revenueChange: Math.round(revenueChange * 100) / 100,
      },
    };
  }

  /**
   * Mock implementation of pricing application
   */
  protected async mockApplyPricing(
    externalId: string,
    pricePerHour: number,
    dryRun: boolean,
  ): Promise<boolean> {
    await this.simulateDelay(200, 800);

    if (dryRun) {
      return true; // Dry run always succeeds
    }

    // Simulate occasional failures
    const successRate = 0.95;
    return this.seededRandomBoolean(externalId, successRate, 3000);
  }
}
