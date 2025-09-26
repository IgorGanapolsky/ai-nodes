import { z } from 'zod';
// Time series data point schema
export const DataPoint = z.object({
  timestamp: z.date(),
  value: z.number(),
  metadata: z.record(z.string(), z.any()).optional(),
});
// Time series schema
export const TimeSeries = z.object({
  metric: z.string(),
  unit: z.string().optional(),
  data: z.array(DataPoint),
});
// Performance metrics schema
export const PerformanceMetrics = z.object({
  utilization: z.number().min(0).max(1),
  revenueUsd: z.number().min(0),
  uptime: z.number().min(0).max(1),
  responseTime: z.number().min(0).optional(),
  errorRate: z.number().min(0).max(1).optional(),
  queueDepth: z.number().int().min(0).optional(),
  timestamp: z.date(),
});
// Trend analysis result
export const TrendAnalysis = z.object({
  direction: z.enum(['increasing', 'decreasing', 'stable']),
  strength: z.enum(['weak', 'moderate', 'strong']),
  slope: z.number(),
  correlation: z.number().min(-1).max(1),
  confidence: z.number().min(0).max(1),
  period: z.string(),
});
/**
 * Calculate simple rolling average for a time series
 * @param data Array of data points
 * @param config Rolling average configuration
 * @returns Array of rolling averages
 */
export function calculateRollingAverage(data, config) {
  const { windowSize, minDataPoints = 1 } = config;
  if (windowSize <= 0) {
    throw new Error('Window size must be positive');
  }
  if (data.length === 0) {
    return [];
  }
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - windowSize + 1);
    const window = data.slice(start, i + 1);
    if (window.length >= minDataPoints) {
      const average = window.reduce((sum, point) => sum + point.value, 0) / window.length;
      result.push({
        timestamp: data[i].timestamp,
        value: average,
        metadata: {
          windowSize: window.length,
          originalValue: data[i].value,
        },
      });
    }
  }
  return result;
}
/**
 * Calculate exponentially weighted moving average
 * @param data Array of data points
 * @param alpha Smoothing factor (0 < alpha <= 1)
 * @returns Array of EWMA values
 */
export function calculateEWMA(data, alpha) {
  if (alpha <= 0 || alpha > 1) {
    throw new Error('Alpha must be between 0 and 1');
  }
  if (data.length === 0) {
    return [];
  }
  const result = [];
  let ewma = data[0].value;
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ewma = data[i].value;
    } else {
      ewma = alpha * data[i].value + (1 - alpha) * ewma;
    }
    result.push({
      timestamp: data[i].timestamp,
      value: ewma,
      metadata: {
        alpha,
        originalValue: data[i].value,
      },
    });
  }
  return result;
}
/**
 * Calculate utilization rate for a given time period
 * @param activeHours Hours the node was actively processing requests
 * @param totalHours Total hours in the period
 * @returns Utilization rate (0-1)
 */
export function calculateUtilization(activeHours, totalHours) {
  if (totalHours <= 0) {
    throw new Error('Total hours must be positive');
  }
  if (activeHours < 0) {
    throw new Error('Active hours cannot be negative');
  }
  if (activeHours > totalHours) {
    throw new Error('Active hours cannot exceed total hours');
  }
  return activeHours / totalHours;
}
/**
 * Calculate average utilization from a time series of metrics
 * @param metrics Array of performance metrics
 * @returns Average utilization and related statistics
 */
export function calculateAverageUtilization(metrics) {
  if (metrics.length === 0) {
    throw new Error('Cannot calculate average from empty metrics array');
  }
  const utilizations = metrics.map((m) => m.utilization);
  const sum = utilizations.reduce((acc, val) => acc + val, 0);
  const average = sum / utilizations.length;
  const min = Math.min(...utilizations);
  const max = Math.max(...utilizations);
  // Calculate standard deviation
  const squaredDifferences = utilizations.map((val) => Math.pow(val - average, 2));
  const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / utilizations.length;
  const standardDeviation = Math.sqrt(variance);
  return {
    average,
    min,
    max,
    standardDeviation,
    dataPoints: utilizations.length,
  };
}
/**
 * Analyze trend in time series data
 * @param data Array of data points
 * @param periodDescription Description of the time period
 * @returns Trend analysis result
 */
export function analyzeTrend(data, periodDescription = 'unknown') {
  if (data.length < 2) {
    throw new Error('Need at least 2 data points for trend analysis');
  }
  // Convert timestamps to numeric values for regression
  const timestamps = data.map((d) => d.timestamp.getTime());
  const values = data.map((d) => d.value);
  // Calculate linear regression
  const n = data.length;
  const sumX = timestamps.reduce((sum, x) => sum + x, 0);
  const sumY = values.reduce((sum, y) => sum + y, 0);
  const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);
  const sumYY = values.reduce((sum, y) => sum + y * y, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  // Calculate correlation coefficient
  const correlation =
    (n * sumXY - sumX * sumY) / Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
  // Determine trend direction and strength
  let direction;
  let strength;
  const absSlope = Math.abs(slope);
  const absCorrelation = Math.abs(correlation);
  if (absSlope < 1e-10) {
    direction = 'stable';
  } else if (slope > 0) {
    direction = 'increasing';
  } else {
    direction = 'decreasing';
  }
  if (absCorrelation < 0.3) {
    strength = 'weak';
  } else if (absCorrelation < 0.7) {
    strength = 'moderate';
  } else {
    strength = 'strong';
  }
  // Calculate confidence based on R-squared and data points
  const rSquared = correlation * correlation;
  const confidence = Math.min(rSquared * (Math.log(n) / Math.log(10)) * 0.3, 1);
  return {
    direction,
    strength,
    slope,
    correlation,
    confidence,
    period: periodDescription,
  };
}
/**
 * Calculate revenue per hour for given time periods
 * @param metrics Array of performance metrics
 * @returns Revenue per hour statistics
 */
export function calculateRevenuePerHour(metrics) {
  if (metrics.length === 0) {
    throw new Error('Cannot calculate revenue per hour from empty metrics');
  }
  // Sort by timestamp
  const sortedMetrics = [...metrics].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  // Calculate revenue per hour for each metric
  const revenuePerHourData = sortedMetrics.map((metric) => ({
    timestamp: metric.timestamp,
    value: metric.utilization > 0 ? metric.revenueUsd / (metric.utilization * 24) : 0,
  }));
  const current = revenuePerHourData[revenuePerHourData.length - 1]?.value || 0;
  const average =
    revenuePerHourData.reduce((sum, d) => sum + d.value, 0) / revenuePerHourData.length;
  const trend = analyzeTrend(revenuePerHourData, `${metrics.length} data points`);
  return {
    current,
    average,
    trend,
  };
}
/**
 * Identify performance anomalies using statistical methods
 * @param data Array of data points
 * @param standardDeviations Number of standard deviations for anomaly threshold
 * @returns Array of anomalous data points
 */
export function detectAnomalies(data, standardDeviations = 2) {
  if (data.length < 3) {
    return []; // Need sufficient data for meaningful statistics
  }
  const values = data.map((d) => d.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDifferences = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  const threshold = standardDeviations * standardDeviation;
  return data.filter((point) => Math.abs(point.value - mean) > threshold);
}
/**
 * Calculate performance score based on multiple metrics
 * @param metrics Performance metrics
 * @param weights Weights for different metrics
 * @returns Performance score (0-100)
 */
export function calculatePerformanceScore(metrics, weights = {}) {
  const {
    utilization: utilizationWeight = 0.4,
    uptime: uptimeWeight = 0.3,
    responseTime: responseTimeWeight = 0.2,
    errorRate: errorRateWeight = 0.1,
  } = weights;
  let score = 0;
  let totalWeight = 0;
  // Utilization score (higher is better, but diminishing returns after 0.8)
  const utilizationScore =
    metrics.utilization <= 0.8 ? metrics.utilization * 100 : 80 + (metrics.utilization - 0.8) * 50;
  score += utilizationScore * utilizationWeight;
  totalWeight += utilizationWeight;
  // Uptime score (linear, higher is better)
  score += metrics.uptime * 100 * uptimeWeight;
  totalWeight += uptimeWeight;
  // Response time score (lower is better, assuming 0-1000ms range)
  if (metrics.responseTime !== undefined) {
    const responseTimeScore = Math.max(0, 100 - metrics.responseTime / 10);
    score += responseTimeScore * responseTimeWeight;
    totalWeight += responseTimeWeight;
  }
  // Error rate score (lower is better)
  if (metrics.errorRate !== undefined) {
    const errorRateScore = (1 - metrics.errorRate) * 100;
    score += errorRateScore * errorRateWeight;
    totalWeight += errorRateWeight;
  }
  return totalWeight > 0 ? score / totalWeight : 0;
}
//# sourceMappingURL=metrics.js.map
