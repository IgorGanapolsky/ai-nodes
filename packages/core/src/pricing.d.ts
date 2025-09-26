import { z } from 'zod';
export declare const PricingSuggestion: z.ZodObject<
  {
    currentPrice: z.ZodNumber;
    suggestedPrice: z.ZodNumber;
    adjustmentPercent: z.ZodNumber;
    adjustmentAmount: z.ZodNumber;
    reason: z.ZodString;
    confidence: z.ZodEnum<{
      low: 'low';
      medium: 'medium';
      high: 'high';
    }>;
    priority: z.ZodEnum<{
      low: 'low';
      medium: 'medium';
      high: 'high';
    }>;
    expectedImpact: z.ZodObject<
      {
        utilizationChange: z.ZodNumber;
        revenueChange: z.ZodNumber;
      },
      z.core.$strip
    >;
  },
  z.core.$strip
>;
export type PricingSuggestion = z.infer<typeof PricingSuggestion>;
export declare const MarketConditions: z.ZodObject<
  {
    demandLevel: z.ZodEnum<{
      low: 'low';
      medium: 'medium';
      high: 'high';
    }>;
    competitorPricing: z.ZodOptional<z.ZodNumber>;
    seasonality: z.ZodOptional<z.ZodNumber>;
    networkCongestion: z.ZodOptional<z.ZodNumber>;
  },
  z.core.$strip
>;
export type MarketConditions = z.infer<typeof MarketConditions>;
export declare const PricingStrategy: z.ZodEnum<{
  conservative: 'conservative';
  aggressive: 'aggressive';
  market_based: 'market_based';
  utilization_driven: 'utilization_driven';
}>;
export type PricingStrategy = z.infer<typeof PricingStrategy>;
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
export declare function suggestPriceAdjustment(
  currentUtilization: number,
  targetUtilization: number,
  currentPrice: number,
  queueDepth?: number,
  strategy?: PricingStrategy,
  marketConditions?: MarketConditions,
): PricingSuggestion;
/**
 * Calculate optimal price point based on demand elasticity
 * @param currentPrice Current price per hour
 * @param currentUtilization Current utilization (0-1)
 * @param demandElasticity Price elasticity of demand (typically negative)
 * @param targetUtilization Target utilization (0-1)
 * @returns Optimal price suggestion
 */
export declare function calculateOptimalPrice(
  currentPrice: number,
  currentUtilization: number,
  demandElasticity: number,
  targetUtilization: number,
): number;
/**
 * Generate pricing recommendations for different time horizons
 * @param currentMetrics Current node performance metrics
 * @param targets Performance targets
 * @returns Short, medium, and long-term pricing recommendations
 */
export declare function generatePricingRoadmap(
  currentMetrics: {
    utilization: number;
    price: number;
    queueDepth: number;
    revenueRunRate: number;
  },
  targets: {
    utilization: number;
    revenue: number;
  },
): {
  immediate: PricingSuggestion;
  shortTerm: PricingSuggestion;
  longTerm: PricingSuggestion;
};
//# sourceMappingURL=pricing.d.ts.map
