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
export declare abstract class BaseConnector implements IConnector {
  protected networkName: string;
  constructor(networkName: string);
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
  protected seededRandom(seed: string, index?: number): number;
  /**
   * Generate a hash code from a string
   */
  private hashCode;
  /**
   * Generate a deterministic random number within a range
   */
  protected seededRandomInRange(seed: string, min: number, max: number, index?: number): number;
  /**
   * Generate deterministic boolean based on probability
   */
  protected seededRandomBoolean(seed: string, probability?: number, index?: number): boolean;
  /**
   * Simulate network delay
   */
  protected simulateDelay(minMs?: number, maxMs?: number): Promise<void>;
  /**
   * Generate mock device status
   */
  protected generateMockDeviceStatus(externalId: string): DeviceStatus;
  /**
   * Generate mock device metrics for a time period
   */
  protected generateMockMetrics(externalId: string, since: Date): DeviceMetrics[];
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
  ): DeviceOccupancy;
  /**
   * Generate mock pricing suggestion
   */
  protected generateMockPricingSuggestion(
    externalId: string,
    targetUtilization: number,
  ): PricingSuggestion;
  /**
   * Mock implementation of pricing application
   */
  protected mockApplyPricing(
    externalId: string,
    pricePerHour: number,
    dryRun: boolean,
  ): Promise<boolean>;
}
//# sourceMappingURL=base.d.ts.map
