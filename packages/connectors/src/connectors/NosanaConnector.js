import { BaseConnector } from '../base';
/**
 * Nosana Connector for CPU compute resources
 * Specializes in decentralized CPU computing and AI inference
 */
export class NosanaConnector extends BaseConnector {
    constructor() {
        super('Nosana');
    }
    async getDeviceStatus(externalId) {
        await this.simulateDelay();
        return this.generateMockDeviceStatus(externalId);
    }
    async getMetrics(externalId, since) {
        await this.simulateDelay();
        return this.generateMockMetrics(externalId, since);
    }
    async getOccupancy(externalId, periodStart, periodEnd) {
        await this.simulateDelay();
        return this.generateMockOccupancy(externalId, periodStart, periodEnd);
    }
    async suggestPricing(externalId, targetUtilization) {
        await this.simulateDelay();
        return this.generateMockPricingSuggestion(externalId, targetUtilization);
    }
    async applyPricing(externalId, pricePerHour, dryRun) {
        return this.mockApplyPricing(externalId, pricePerHour, dryRun);
    }
    generateCustomMetrics(externalId, index) {
        return {
            // CPU-specific metrics
            cpuCores: Math.floor(this.seededRandomInRange(externalId, 4, 32, index + 2000)),
            cpuFrequency: this.seededRandomInRange(externalId, 2.0, 4.5, index + 2001), // GHz
            cpuTemperature: this.seededRandomInRange(externalId, 35, 75, index + 2002), // °C
            // AI/ML workload metrics
            inferenceJobsCompleted: Math.floor(this.seededRandomInRange(externalId, 10, 100, index + 2003)),
            averageInferenceTime: this.seededRandomInRange(externalId, 50, 500, index + 2004), // ms
            modelsLoaded: Math.floor(this.seededRandomInRange(externalId, 1, 8, index + 2005)),
            // Nosana-specific metrics
            nosTokensEarned: this.seededRandomInRange(externalId, 0.5, 10.0, index + 2006),
            stakeAmount: this.seededRandomInRange(externalId, 100, 5000, index + 2007),
            reputationScore: this.seededRandomInRange(externalId, 0.7, 1.0, index + 2008),
            // Performance metrics
            throughputPerSecond: this.seededRandomInRange(externalId, 5, 50, index + 2009), // operations/sec
            queueWaitTime: this.seededRandomInRange(externalId, 1, 30, index + 2010), // seconds
            successRate: this.seededRandomInRange(externalId, 0.95, 1.0, index + 2011),
            // System metrics
            containerCount: Math.floor(this.seededRandomInRange(externalId, 1, 12, index + 2012)),
            dockerImageSize: this.seededRandomInRange(externalId, 0.5, 5.0, index + 2013), // GB
            networkBandwidthUsed: this.seededRandomInRange(externalId, 10, 200, index + 2014), // Mbps
        };
    }
}
