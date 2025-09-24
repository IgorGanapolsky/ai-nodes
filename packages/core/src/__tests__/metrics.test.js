import { describe, it, expect } from 'vitest';
import { calculateRollingAverage, calculateEWMA, calculateUtilization, calculateAverageUtilization, analyzeTrend, calculateRevenuePerHour, detectAnomalies, calculatePerformanceScore, } from '../metrics.js';
describe('Metrics Functions', () => {
    // Helper function to create test data points
    const createDataPoints = (values, startDate = new Date('2024-01-01')) => {
        return values.map((value, index) => ({
            timestamp: new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000), // Daily intervals
            value,
        }));
    };
    describe('calculateRollingAverage', () => {
        it('should calculate rolling average with specified window size', () => {
            const data = createDataPoints([1, 2, 3, 4, 5]);
            const result = calculateRollingAverage(data, { windowSize: 3 });
            expect(result).toHaveLength(5);
            expect(result[2].value).toBe(2); // (1+2+3)/3
            expect(result[3].value).toBe(3); // (2+3+4)/3
            expect(result[4].value).toBe(4); // (3+4+5)/3
        });
        it('should handle window size larger than data length', () => {
            const data = createDataPoints([1, 2, 3]);
            const result = calculateRollingAverage(data, { windowSize: 5 });
            expect(result).toHaveLength(3);
            expect(result[0].value).toBe(1);
            expect(result[1].value).toBe(1.5); // (1+2)/2
            expect(result[2].value).toBe(2); // (1+2+3)/3
        });
        it('should respect minimum data points requirement', () => {
            const data = createDataPoints([1, 2, 3, 4, 5]);
            const result = calculateRollingAverage(data, { windowSize: 3, minDataPoints: 3 });
            expect(result).toHaveLength(3); // Only last 3 points have enough data
            expect(result[0].value).toBe(2); // (1+2+3)/3
        });
        it('should return empty array for empty input', () => {
            const result = calculateRollingAverage([], { windowSize: 3 });
            expect(result).toHaveLength(0);
        });
        it('should throw error for invalid window size', () => {
            const data = createDataPoints([1, 2, 3]);
            expect(() => calculateRollingAverage(data, { windowSize: 0 }))
                .toThrow('Window size must be positive');
        });
        it('should include metadata in results', () => {
            const data = createDataPoints([1, 2, 3]);
            const result = calculateRollingAverage(data, { windowSize: 2 });
            expect(result[1].metadata).toHaveProperty('windowSize');
            expect(result[1].metadata).toHaveProperty('originalValue');
            expect(result[1].metadata?.windowSize).toBe(2);
            expect(result[1].metadata?.originalValue).toBe(2);
        });
    });
    describe('calculateEWMA', () => {
        it('should calculate exponentially weighted moving average', () => {
            const data = createDataPoints([10, 20, 30, 40, 50]);
            const result = calculateEWMA(data, 0.3);
            expect(result).toHaveLength(5);
            expect(result[0].value).toBe(10); // First value unchanged
            expect(result[1].value).toBe(0.3 * 20 + 0.7 * 10); // 13
        });
        it('should handle alpha = 1 (no smoothing)', () => {
            const data = createDataPoints([10, 20, 30]);
            const result = calculateEWMA(data, 1.0);
            expect(result[0].value).toBe(10);
            expect(result[1].value).toBe(20);
            expect(result[2].value).toBe(30);
        });
        it('should throw error for invalid alpha', () => {
            const data = createDataPoints([1, 2, 3]);
            expect(() => calculateEWMA(data, 0)).toThrow('Alpha must be between 0 and 1');
            expect(() => calculateEWMA(data, 1.1)).toThrow('Alpha must be between 0 and 1');
        });
        it('should return empty array for empty input', () => {
            const result = calculateEWMA([], 0.5);
            expect(result).toHaveLength(0);
        });
        it('should include metadata with alpha and original values', () => {
            const data = createDataPoints([10, 20]);
            const result = calculateEWMA(data, 0.3);
            expect(result[1].metadata?.alpha).toBe(0.3);
            expect(result[1].metadata?.originalValue).toBe(20);
        });
    });
    describe('calculateUtilization', () => {
        it('should calculate utilization correctly', () => {
            expect(calculateUtilization(8, 24)).toBe(8 / 24);
            expect(calculateUtilization(24, 24)).toBe(1);
            expect(calculateUtilization(0, 24)).toBe(0);
        });
        it('should throw error for invalid inputs', () => {
            expect(() => calculateUtilization(8, 0)).toThrow('Total hours must be positive');
            expect(() => calculateUtilization(-1, 24)).toThrow('Active hours cannot be negative');
            expect(() => calculateUtilization(25, 24)).toThrow('Active hours cannot exceed total hours');
        });
    });
    describe('calculateAverageUtilization', () => {
        const createMetrics = (utilizations) => {
            return utilizations.map((utilization, index) => ({
                utilization,
                revenueUsd: utilization * 100,
                uptime: 0.95,
                timestamp: new Date(Date.now() + index * 1000),
            }));
        };
        it('should calculate average and statistics correctly', () => {
            const metrics = createMetrics([0.6, 0.7, 0.8, 0.9]);
            const result = calculateAverageUtilization(metrics);
            expect(result.average).toBeCloseTo(0.75);
            expect(result.min).toBe(0.6);
            expect(result.max).toBe(0.9);
            expect(result.dataPoints).toBe(4);
            expect(result.standardDeviation).toBeGreaterThan(0);
        });
        it('should handle single data point', () => {
            const metrics = createMetrics([0.8]);
            const result = calculateAverageUtilization(metrics);
            expect(result.average).toBe(0.8);
            expect(result.min).toBe(0.8);
            expect(result.max).toBe(0.8);
            expect(result.standardDeviation).toBe(0);
        });
        it('should throw error for empty array', () => {
            expect(() => calculateAverageUtilization([]))
                .toThrow('Cannot calculate average from empty metrics array');
        });
    });
    describe('analyzeTrend', () => {
        it('should detect increasing trend', () => {
            const data = createDataPoints([1, 2, 3, 4, 5]);
            const result = analyzeTrend(data, '5 days');
            expect(result.direction).toBe('increasing');
            expect(result.slope).toBeGreaterThan(0);
            expect(result.correlation).toBeCloseTo(1, 1);
            expect(result.strength).toBe('strong');
            expect(result.period).toBe('5 days');
        });
        it('should detect decreasing trend', () => {
            const data = createDataPoints([5, 4, 3, 2, 1]);
            const result = analyzeTrend(data);
            expect(result.direction).toBe('decreasing');
            expect(result.slope).toBeLessThan(0);
            expect(result.correlation).toBeCloseTo(-1, 1);
            expect(result.strength).toBe('strong');
        });
        it('should detect stable trend', () => {
            const data = createDataPoints([5, 5, 5, 5, 5]);
            const result = analyzeTrend(data);
            expect(result.direction).toBe('stable');
            expect(Math.abs(result.slope)).toBeLessThan(1e-10);
        });
        it('should classify trend strength correctly', () => {
            // Strong correlation
            const strongData = createDataPoints([1, 2, 3, 4, 5]);
            const strongResult = analyzeTrend(strongData);
            expect(strongResult.strength).toBe('strong');
            // Weak correlation (noisy data)
            const weakData = createDataPoints([1, 3, 2, 4, 3]);
            const weakResult = analyzeTrend(weakData);
            expect(['weak', 'moderate']).toContain(weakResult.strength);
        });
        it('should calculate confidence based on correlation and data points', () => {
            const data = createDataPoints([1, 2, 3, 4, 5]);
            const result = analyzeTrend(data);
            expect(result.confidence).toBeGreaterThan(0);
            expect(result.confidence).toBeLessThanOrEqual(1);
        });
        it('should throw error for insufficient data', () => {
            const data = createDataPoints([1]);
            expect(() => analyzeTrend(data)).toThrow('Need at least 2 data points for trend analysis');
        });
    });
    describe('calculateRevenuePerHour', () => {
        const createRevenueMetrics = () => [
            {
                utilization: 0.5,
                revenueUsd: 120,
                uptime: 0.95,
                timestamp: new Date('2024-01-01'),
            },
            {
                utilization: 0.6,
                revenueUsd: 144,
                uptime: 0.98,
                timestamp: new Date('2024-01-02'),
            },
            {
                utilization: 0.7,
                revenueUsd: 168,
                uptime: 0.92,
                timestamp: new Date('2024-01-03'),
            },
        ];
        it('should calculate revenue per hour correctly', () => {
            const metrics = createRevenueMetrics();
            const result = calculateRevenuePerHour(metrics);
            // Revenue per hour = revenueUsd / (utilization * 24)
            expect(result.current).toBe(168 / (0.7 * 24)); // Last metric
            expect(result.average).toBeGreaterThan(0);
            expect(result.trend).toHaveProperty('direction');
            expect(result.trend).toHaveProperty('strength');
        });
        it('should handle zero utilization gracefully', () => {
            const metrics = [
                {
                    utilization: 0,
                    revenueUsd: 0,
                    uptime: 1,
                    timestamp: new Date('2024-01-01'),
                },
                {
                    utilization: 0,
                    revenueUsd: 0,
                    uptime: 1,
                    timestamp: new Date('2024-01-02'),
                }
            ];
            const result = calculateRevenuePerHour(metrics);
            expect(result.current).toBe(0);
            expect(result.average).toBe(0);
        });
        it('should throw error for empty metrics', () => {
            expect(() => calculateRevenuePerHour([]))
                .toThrow('Cannot calculate revenue per hour from empty metrics');
        });
    });
    describe('detectAnomalies', () => {
        it('should detect statistical outliers', () => {
            const data = createDataPoints([1, 2, 2, 2, 1, 10, 2, 1]); // 10 is an outlier
            const anomalies = detectAnomalies(data, 2);
            expect(anomalies).toHaveLength(1);
            expect(anomalies[0].value).toBe(10);
        });
        it('should not find anomalies in uniform data', () => {
            const data = createDataPoints([5, 5, 5, 5, 5]);
            const anomalies = detectAnomalies(data, 2);
            expect(anomalies).toHaveLength(0);
        });
        it('should adjust sensitivity with standard deviation threshold', () => {
            const data = createDataPoints([1, 2, 3, 4, 10]);
            const strictAnomalies = detectAnomalies(data, 1); // More sensitive
            const lenientAnomalies = detectAnomalies(data, 3); // Less sensitive
            expect(strictAnomalies.length).toBeGreaterThanOrEqual(lenientAnomalies.length);
        });
        it('should return empty array for insufficient data', () => {
            const data = createDataPoints([1, 2]);
            const anomalies = detectAnomalies(data);
            expect(anomalies).toHaveLength(0);
        });
    });
    describe('calculatePerformanceScore', () => {
        it('should calculate performance score with default weights', () => {
            const metrics = {
                utilization: 0.8,
                revenueUsd: 1000,
                uptime: 0.95,
                responseTime: 100,
                errorRate: 0.02,
                timestamp: new Date(),
            };
            const score = calculatePerformanceScore(metrics);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
        });
        it('should handle optimal performance metrics', () => {
            const perfectMetrics = {
                utilization: 0.8, // Optimal utilization
                revenueUsd: 1000,
                uptime: 1.0,
                responseTime: 0,
                errorRate: 0,
                timestamp: new Date(),
            };
            const score = calculatePerformanceScore(perfectMetrics);
            expect(score).toBeGreaterThan(90);
        });
        it('should handle poor performance metrics', () => {
            const poorMetrics = {
                utilization: 0.1,
                revenueUsd: 100,
                uptime: 0.5,
                responseTime: 1000,
                errorRate: 0.5,
                timestamp: new Date(),
            };
            const score = calculatePerformanceScore(poorMetrics);
            expect(score).toBeLessThan(50);
        });
        it('should apply custom weights correctly', () => {
            const metrics = {
                utilization: 1.0, // Very high
                revenueUsd: 1000,
                uptime: 0.5, // Poor
                timestamp: new Date(),
            };
            const utilizationWeighted = calculatePerformanceScore(metrics, {
                utilization: 1.0,
                uptime: 0.0,
            });
            const uptimeWeighted = calculatePerformanceScore(metrics, {
                utilization: 0.0,
                uptime: 1.0,
            });
            expect(utilizationWeighted).toBeGreaterThan(uptimeWeighted);
        });
        it('should handle missing optional metrics', () => {
            const basicMetrics = {
                utilization: 0.7,
                revenueUsd: 800,
                uptime: 0.9,
                timestamp: new Date(),
            };
            const score = calculatePerformanceScore(basicMetrics);
            expect(score).toBeGreaterThan(0);
            expect(score).toBeLessThanOrEqual(100);
        });
        it('should handle utilization above 0.8 with diminishing returns', () => {
            const highUtil = {
                utilization: 0.9,
                revenueUsd: 1000,
                uptime: 1.0,
                timestamp: new Date(),
            };
            const optimalUtil = {
                utilization: 0.8,
                revenueUsd: 1000,
                uptime: 1.0,
                timestamp: new Date(),
            };
            const highScore = calculatePerformanceScore(highUtil);
            const optimalScore = calculatePerformanceScore(optimalUtil);
            // High utilization should score well but with diminishing returns
            expect(highScore).toBeGreaterThan(optimalScore);
            expect(highScore - optimalScore).toBeLessThan(20); // Diminishing returns
        });
    });
});
