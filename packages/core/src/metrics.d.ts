import { z } from 'zod';
export declare const DataPoint: z.ZodObject<
  {
    timestamp: z.ZodDate;
    value: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
  },
  z.core.$strip
>;
export type DataPoint = z.infer<typeof DataPoint>;
export declare const TimeSeries: z.ZodObject<
  {
    metric: z.ZodString;
    unit: z.ZodOptional<z.ZodString>;
    data: z.ZodArray<
      z.ZodObject<
        {
          timestamp: z.ZodDate;
          value: z.ZodNumber;
          metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export type TimeSeries = z.infer<typeof TimeSeries>;
export declare const PerformanceMetrics: z.ZodObject<
  {
    utilization: z.ZodNumber;
    revenueUsd: z.ZodNumber;
    uptime: z.ZodNumber;
    responseTime: z.ZodOptional<z.ZodNumber>;
    errorRate: z.ZodOptional<z.ZodNumber>;
    queueDepth: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodDate;
  },
  z.core.$strip
>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetrics>;
export declare const TrendAnalysis: z.ZodObject<
  {
    direction: z.ZodEnum<{
      increasing: 'increasing';
      decreasing: 'decreasing';
      stable: 'stable';
    }>;
    strength: z.ZodEnum<{
      weak: 'weak';
      moderate: 'moderate';
      strong: 'strong';
    }>;
    slope: z.ZodNumber;
    correlation: z.ZodNumber;
    confidence: z.ZodNumber;
    period: z.ZodString;
  },
  z.core.$strip
>;
export type TrendAnalysis = z.infer<typeof TrendAnalysis>;
export interface RollingAverageConfig {
  windowSize: number;
  minDataPoints?: number;
  weightDecay?: number;
}
/**
 * Calculate simple rolling average for a time series
 * @param data Array of data points
 * @param config Rolling average configuration
 * @returns Array of rolling averages
 */
export declare function calculateRollingAverage(
  data: DataPoint[],
  config: RollingAverageConfig,
): DataPoint[];
/**
 * Calculate exponentially weighted moving average
 * @param data Array of data points
 * @param alpha Smoothing factor (0 < alpha <= 1)
 * @returns Array of EWMA values
 */
export declare function calculateEWMA(data: DataPoint[], alpha: number): DataPoint[];
/**
 * Calculate utilization rate for a given time period
 * @param activeHours Hours the node was actively processing requests
 * @param totalHours Total hours in the period
 * @returns Utilization rate (0-1)
 */
export declare function calculateUtilization(activeHours: number, totalHours: number): number;
/**
 * Calculate average utilization from a time series of metrics
 * @param metrics Array of performance metrics
 * @returns Average utilization and related statistics
 */
export declare function calculateAverageUtilization(metrics: PerformanceMetrics[]): {
  average: number;
  min: number;
  max: number;
  standardDeviation: number;
  dataPoints: number;
};
/**
 * Analyze trend in time series data
 * @param data Array of data points
 * @param periodDescription Description of the time period
 * @returns Trend analysis result
 */
export declare function analyzeTrend(data: DataPoint[], periodDescription?: string): TrendAnalysis;
/**
 * Calculate revenue per hour for given time periods
 * @param metrics Array of performance metrics
 * @returns Revenue per hour statistics
 */
export declare function calculateRevenuePerHour(metrics: PerformanceMetrics[]): {
  current: number;
  average: number;
  trend: TrendAnalysis;
};
/**
 * Identify performance anomalies using statistical methods
 * @param data Array of data points
 * @param standardDeviations Number of standard deviations for anomaly threshold
 * @returns Array of anomalous data points
 */
export declare function detectAnomalies(
  data: DataPoint[],
  standardDeviations?: number,
): DataPoint[];
/**
 * Calculate performance score based on multiple metrics
 * @param metrics Performance metrics
 * @param weights Weights for different metrics
 * @returns Performance score (0-100)
 */
export declare function calculatePerformanceScore(
  metrics: PerformanceMetrics,
  weights?: {
    utilization?: number;
    uptime?: number;
    responseTime?: number;
    errorRate?: number;
  },
): number;
//# sourceMappingURL=metrics.d.ts.map
