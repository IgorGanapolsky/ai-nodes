import { z } from 'zod';
// Pricing suggestion schema
export const PricingSuggestion = z.object({
  currentPrice: z.number().min(0),
  suggestedPrice: z.number().min(0),
  adjustmentPercent: z.number(),
  adjustmentAmount: z.number(),
  reason: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  priority: z.enum(['low', 'medium', 'high']),
  expectedImpact: z.object({
    utilizationChange: z.number(),
    revenueChange: z.number(),
  }),
});
// Market conditions schema
export const MarketConditions = z.object({
  demandLevel: z.enum(['low', 'medium', 'high']),
  competitorPricing: z.number().min(0).optional(),
  seasonality: z.number().min(0).max(1).optional(), // 0-1 seasonal adjustment factor
  networkCongestion: z.number().min(0).max(1).optional(), // 0-1 congestion level
});
// Pricing strategy options
export const PricingStrategy = z.enum([
  'conservative', // Small, safe adjustments
  'aggressive', // Larger adjustments for faster optimization
  'market_based', // Based on competitor pricing
  'utilization_driven', // Purely based on utilization targets
]);
/**
 * Suggest price adjustment based on utilization and queue depth
 * @param currentUtilization Current utilization percentage (0-1)
 * @param targetUtilization Target utilization percentage (0-1)
 * @param currentPrice Current price per hour in USD
 * @param queueDepth Number of pending requests in queue
 * @param strategy Pricing strategy to use
 * @param marketConditions Optional market conditions
 * @returns Pricing suggestion
 */
export function suggestPriceAdjustment(
  currentUtilization,
  targetUtilization,
  currentPrice,
  queueDepth = 0,
  strategy = 'conservative',
  marketConditions,
) {
  // Validate inputs
  if (currentUtilization < 0 || currentUtilization > 1) {
    throw new Error('Current utilization must be between 0 and 1');
  }
  if (targetUtilization < 0 || targetUtilization > 1) {
    throw new Error('Target utilization must be between 0 and 1');
  }
  if (currentPrice < 0) {
    throw new Error('Current price must be non-negative');
  }
  if (queueDepth < 0) {
    throw new Error('Queue depth must be non-negative');
  }
  const utilizationGap = currentUtilization - targetUtilization;
  const queuePressure = Math.min(queueDepth / 10, 1); // Normalize queue depth to 0-1
  // Base adjustment calculation
  let adjustmentPercent = 0;
  let reason = '';
  let confidence = 'medium';
  let priority = 'medium';
  // Determine base adjustment based on utilization gap and queue
  if (utilizationGap > 0.2 && queueDepth > 5) {
    // High utilization and deep queue - increase price significantly
    adjustmentPercent = getStrategyMultiplier(strategy) * (0.15 + queuePressure * 0.1);
    reason = 'High utilization with deep queue - demand exceeds capacity';
    confidence = 'high';
    priority = 'high';
  } else if (utilizationGap > 0.1) {
    // Above target utilization - increase price
    adjustmentPercent = getStrategyMultiplier(strategy) * (0.05 + utilizationGap * 0.2);
    reason = 'Utilization above target - reducing demand through price increase';
    confidence = 'medium';
    priority = 'medium';
  } else if (utilizationGap < -0.2 && queueDepth === 0) {
    // Low utilization and no queue - decrease price significantly
    adjustmentPercent = -getStrategyMultiplier(strategy) * (0.1 + Math.abs(utilizationGap) * 0.15);
    reason = 'Low utilization with no queue - stimulating demand through price reduction';
    confidence = 'high';
    priority = 'high';
  } else if (utilizationGap < -0.05) {
    // Below target utilization - decrease price
    adjustmentPercent = -getStrategyMultiplier(strategy) * (0.03 + Math.abs(utilizationGap) * 0.1);
    reason = 'Utilization below target - stimulating demand through price reduction';
    confidence = 'medium';
    priority = 'medium';
  } else {
    // Utilization near target - minimal adjustment
    adjustmentPercent = 0;
    reason = 'Utilization near target - no price adjustment needed';
    confidence = 'high';
    priority = 'low';
  }
  // Apply market conditions if provided
  if (marketConditions) {
    adjustmentPercent = applyMarketConditions(adjustmentPercent, marketConditions);
  }
  // Calculate final suggested price and amounts
  const adjustmentAmount = currentPrice * adjustmentPercent;
  const suggestedPrice = Math.max(0, currentPrice + adjustmentAmount);
  // Estimate expected impact
  const expectedUtilizationChange = -adjustmentPercent * 2; // Rough inverse relationship
  const expectedRevenueChange = adjustmentPercent + expectedUtilizationChange;
  return {
    currentPrice,
    suggestedPrice,
    adjustmentPercent,
    adjustmentAmount,
    reason,
    confidence,
    priority,
    expectedImpact: {
      utilizationChange: expectedUtilizationChange,
      revenueChange: expectedRevenueChange,
    },
  };
}
/**
 * Get strategy multiplier for adjustment magnitude
 */
function getStrategyMultiplier(strategy) {
  switch (strategy) {
    case 'conservative':
      return 0.5;
    case 'aggressive':
      return 1.5;
    case 'market_based':
      return 1.0;
    case 'utilization_driven':
      return 1.2;
    default:
      return 1.0;
  }
}
/**
 * Apply market conditions to pricing adjustment
 */
function applyMarketConditions(baseAdjustment, conditions) {
  let adjustment = baseAdjustment;
  // Apply demand level adjustments
  switch (conditions.demandLevel) {
    case 'high':
      adjustment *= 1.3; // Increase adjustments in high demand
      break;
    case 'low':
      adjustment *= 0.7; // Reduce adjustments in low demand
      break;
    case 'medium':
    default:
      // No change for medium demand
      break;
  }
  // Apply seasonality if provided
  if (conditions.seasonality !== undefined) {
    const seasonalMultiplier = 0.8 + conditions.seasonality * 0.4; // 0.8 to 1.2 range
    adjustment *= seasonalMultiplier;
  }
  // Apply network congestion if provided
  if (conditions.networkCongestion !== undefined) {
    adjustment += conditions.networkCongestion * 0.05; // Add up to 5% for high congestion
  }
  return adjustment;
}
/**
 * Calculate optimal price point based on demand elasticity
 * @param currentPrice Current price per hour
 * @param currentUtilization Current utilization (0-1)
 * @param demandElasticity Price elasticity of demand (typically negative)
 * @param targetUtilization Target utilization (0-1)
 * @returns Optimal price suggestion
 */
export function calculateOptimalPrice(
  currentPrice,
  currentUtilization,
  demandElasticity,
  targetUtilization,
) {
  if (demandElasticity >= 0) {
    throw new Error('Demand elasticity should typically be negative');
  }
  if (currentUtilization <= 0 || targetUtilization <= 0) {
    throw new Error('Utilization values must be positive');
  }
  // Using elasticity formula: % change in quantity = elasticity × % change in price
  // We want: targetUtilization = currentUtilization × (1 + elasticity × priceChangePercent)
  const utilizationRatio = targetUtilization / currentUtilization;
  const priceChangePercent = (utilizationRatio - 1) / demandElasticity;
  return currentPrice * (1 + priceChangePercent);
}
/**
 * Generate pricing recommendations for different time horizons
 * @param currentMetrics Current node performance metrics
 * @param targets Performance targets
 * @returns Short, medium, and long-term pricing recommendations
 */
export function generatePricingRoadmap(currentMetrics, targets) {
  // Immediate (next 1-7 days): Focus on queue management
  const immediate = suggestPriceAdjustment(
    currentMetrics.utilization,
    targets.utilization,
    currentMetrics.price,
    currentMetrics.queueDepth,
    'aggressive',
  );
  // Short-term (1-4 weeks): Balanced approach
  const shortTermPrice = immediate.suggestedPrice;
  const shortTerm = suggestPriceAdjustment(
    currentMetrics.utilization,
    targets.utilization,
    shortTermPrice,
    Math.floor(currentMetrics.queueDepth * 0.7), // Assume queue will reduce
    'conservative',
  );
  // Long-term (1-3 months): Revenue optimization
  const longTermPrice = shortTerm.suggestedPrice;
  const longTerm = suggestPriceAdjustment(
    targets.utilization * 0.9, // Assume we'll be closer to target
    targets.utilization,
    longTermPrice,
    0, // Assume queue will be managed
    'market_based',
  );
  return {
    immediate,
    shortTerm,
    longTerm,
  };
}
//# sourceMappingURL=pricing.js.map
