import { BaseConnector } from '../base';
import { DeviceStatus, DeviceMetrics, DeviceOccupancy, PricingSuggestion } from '../types';

/**
 * Natix Connector for mapping and camera data
 * Specializes in decentralized mapping data collection via mobile devices
 */
export class NatixConnector extends BaseConnector {
  constructor() {
    super('Natix');
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
      // Driving and mapping metrics
      distanceDriven: this.seededRandomInRange(externalId, 10, 500, index + 5000), // km
      tripsCompleted: Math.floor(this.seededRandomInRange(externalId, 5, 50, index + 5001)),
      averageTripDuration: this.seededRandomInRange(externalId, 900, 3600, index + 5002), // seconds
      hoursActive: this.seededRandomInRange(externalId, 2, 12, index + 5003),

      // Camera and data collection
      photosCollected: Math.floor(this.seededRandomInRange(externalId, 100, 2000, index + 5004)),
      videoMinutesRecorded: this.seededRandomInRange(externalId, 30, 300, index + 5005),
      gpsPointsCollected: Math.floor(
        this.seededRandomInRange(externalId, 1000, 20000, index + 5006),
      ),
      mapDataUploaded: this.seededRandomInRange(externalId, 50, 2000, index + 5007), // MB

      // Location and coverage metrics
      uniqueLocationsVisited: Math.floor(
        this.seededRandomInRange(externalId, 10, 100, index + 5008),
      ),
      countriesCovered: Math.floor(this.seededRandomInRange(externalId, 1, 15, index + 5009)),
      citiesCovered: Math.floor(this.seededRandomInRange(externalId, 1, 50, index + 5010)),
      roadTypesCovered: this.getRoadTypes(externalId, index),

      // Natix-specific metrics
      natixTokensEarned: this.seededRandomInRange(externalId, 0.1, 20.0, index + 5011),
      qualityScore: this.seededRandomInRange(externalId, 0.6, 1.0, index + 5012),
      contributionRank: Math.floor(this.seededRandomInRange(externalId, 1, 10000, index + 5013)),

      // Device and app metrics
      batteryUsage: this.seededRandomInRange(externalId, 10, 40, index + 5014), // percentage per hour
      dataUsageMobile: this.seededRandomInRange(externalId, 100, 2000, index + 5015), // MB
      appCrashes: Math.floor(this.seededRandomInRange(externalId, 0, 3, index + 5016)),
      gpsAccuracy: this.seededRandomInRange(externalId, 3, 10, index + 5017), // meters

      // Performance metrics
      uploadSuccessRate: this.seededRandomInRange(externalId, 0.85, 1.0, index + 5018),
      averageUploadTime: this.seededRandomInRange(externalId, 30, 300, index + 5019), // seconds
      dataCompressionRatio: this.seededRandomInRange(externalId, 0.3, 0.8, index + 5020),

      // Environmental data
      weatherConditions: this.getWeatherCondition(externalId, index),
      timeOfDayPattern: this.getTimePattern(externalId, index),
      speedProfile: this.getSpeedProfile(externalId, index),
    };
  }

  private getRoadTypes(externalId: string, index: number): string[] {
    const allRoadTypes = ['highway', 'urban', 'rural', 'residential', 'commercial', 'industrial'];
    const count = Math.floor(this.seededRandomInRange(externalId, 1, 4, index + 5021));
    const selectedTypes: string[] = [];

    for (let i = 0; i < count; i++) {
      const typeIndex = Math.floor(
        this.seededRandomInRange(externalId, 0, allRoadTypes.length, index + 5022 + i),
      );
      const roadType = allRoadTypes[typeIndex];
      if (!selectedTypes.includes(roadType)) {
        selectedTypes.push(roadType);
      }
    }

    return selectedTypes;
  }

  private getWeatherCondition(externalId: string, index: number): string {
    const conditions = ['sunny', 'cloudy', 'rainy', 'foggy', 'snowy'];
    const conditionIndex = Math.floor(
      this.seededRandomInRange(externalId, 0, conditions.length, index + 5023),
    );
    return conditions[conditionIndex];
  }

  private getTimePattern(externalId: string, index: number): Record<string, number> {
    return {
      morning: this.seededRandomInRange(externalId, 0, 100, index + 5024),
      afternoon: this.seededRandomInRange(externalId, 0, 100, index + 5025),
      evening: this.seededRandomInRange(externalId, 0, 100, index + 5026),
      night: this.seededRandomInRange(externalId, 0, 30, index + 5027), // Less night driving
    };
  }

  private getSpeedProfile(externalId: string, index: number): Record<string, number> {
    return {
      averageSpeed: this.seededRandomInRange(externalId, 30, 80, index + 5028), // km/h
      maxSpeed: this.seededRandomInRange(externalId, 60, 120, index + 5029), // km/h
      stopTime: this.seededRandomInRange(externalId, 10, 40, index + 5030), // percentage of trip
      idleTime: this.seededRandomInRange(externalId, 5, 20, index + 5031), // percentage of trip
    };
  }
}
