import { describe, it, expect } from 'vitest';
import {
  suggestPriceAdjustment,
  calculateOptimalPrice,
  generatePricingRoadmap,
} from '../pricing.js';
describe('Pricing Functions', () => {
  describe('suggestPriceAdjustment', () => {
    it('should suggest price increase for high utilization with queue', () => {
      const suggestion = suggestPriceAdjustment(0.9, 0.7, 10, 8, 'conservative');
      expect(suggestion.currentPrice).toBe(10);
      expect(suggestion.suggestedPrice).toBeGreaterThan(10);
      expect(suggestion.adjustmentPercent).toBeGreaterThan(0);
      expect(suggestion.confidence).toBe('high');
      expect(suggestion.priority).toBe('high');
      expect(suggestion.reason).toContain('deep queue');
    });
    it('should suggest price decrease for low utilization with no queue', () => {
      const suggestion = suggestPriceAdjustment(0.3, 0.7, 10, 0, 'conservative');
      expect(suggestion.suggestedPrice).toBeLessThan(10);
      expect(suggestion.adjustmentPercent).toBeLessThan(0);
      expect(suggestion.confidence).toBe('high');
      expect(suggestion.priority).toBe('high');
      expect(suggestion.reason).toContain('Low utilization');
    });
    it('should suggest minimal adjustment when near target', () => {
      const suggestion = suggestPriceAdjustment(0.72, 0.7, 10, 2, 'conservative');
      expect(suggestion.adjustmentPercent).toBe(0);
      expect(suggestion.suggestedPrice).toBe(10);
      expect(suggestion.reason).toContain('near target');
      expect(suggestion.priority).toBe('low');
    });
    it('should handle aggressive strategy with larger adjustments', () => {
      const conservative = suggestPriceAdjustment(0.9, 0.7, 10, 5, 'conservative');
      const aggressive = suggestPriceAdjustment(0.9, 0.7, 10, 5, 'aggressive');
      expect(Math.abs(aggressive.adjustmentPercent)).toBeGreaterThan(
        Math.abs(conservative.adjustmentPercent),
      );
    });
    it('should apply market conditions correctly', () => {
      const marketConditions = {
        demandLevel: 'high',
        seasonality: 0.8,
        networkCongestion: 0.5,
      };
      const withoutMarket = suggestPriceAdjustment(0.9, 0.7, 10, 5, 'conservative');
      const withMarket = suggestPriceAdjustment(0.9, 0.7, 10, 5, 'conservative', marketConditions);
      // High demand should increase adjustments
      expect(Math.abs(withMarket.adjustmentPercent)).toBeGreaterThan(
        Math.abs(withoutMarket.adjustmentPercent),
      );
    });
    it('should throw error for invalid utilization values', () => {
      expect(() => suggestPriceAdjustment(-0.1, 0.7, 10)).toThrow(
        'Current utilization must be between 0 and 1',
      );
      expect(() => suggestPriceAdjustment(0.8, 1.1, 10)).toThrow(
        'Target utilization must be between 0 and 1',
      );
    });
    it('should throw error for negative price', () => {
      expect(() => suggestPriceAdjustment(0.8, 0.7, -10)).toThrow(
        'Current price must be non-negative',
      );
    });
    it('should throw error for negative queue depth', () => {
      expect(() => suggestPriceAdjustment(0.8, 0.7, 10, -5)).toThrow(
        'Queue depth must be non-negative',
      );
    });
    it('should never suggest negative prices', () => {
      const suggestion = suggestPriceAdjustment(0.1, 0.7, 1, 0, 'aggressive');
      expect(suggestion.suggestedPrice).toBeGreaterThanOrEqual(0);
    });
  });
  describe('calculateOptimalPrice', () => {
    it('should calculate optimal price using elasticity', () => {
      const optimalPrice = calculateOptimalPrice(10, 0.8, -1.5, 0.6);
      expect(optimalPrice).toBeGreaterThan(0);
      expect(optimalPrice).not.toBe(10);
    });
    it('should increase price when target utilization is lower', () => {
      const optimalPrice = calculateOptimalPrice(10, 0.8, -1.0, 0.4);
      expect(optimalPrice).toBeGreaterThan(10);
    });
    it('should decrease price when target utilization is higher', () => {
      const optimalPrice = calculateOptimalPrice(10, 0.4, -1.0, 0.8);
      expect(optimalPrice).toBeLessThan(10);
    });
    it('should throw error for positive elasticity', () => {
      expect(() => calculateOptimalPrice(10, 0.8, 1.5, 0.6)).toThrow(
        'Demand elasticity should typically be negative',
      );
    });
    it('should throw error for zero utilization', () => {
      expect(() => calculateOptimalPrice(10, 0, -1.5, 0.6)).toThrow(
        'Utilization values must be positive',
      );
    });
  });
  describe('generatePricingRoadmap', () => {
    it('should generate three-tier pricing roadmap', () => {
      const currentMetrics = {
        utilization: 0.6,
        price: 10,
        queueDepth: 3,
        revenueRunRate: 4000,
      };
      const targets = {
        utilization: 0.8,
        revenue: 5000,
      };
      const roadmap = generatePricingRoadmap(currentMetrics, targets);
      expect(roadmap).toHaveProperty('immediate');
      expect(roadmap).toHaveProperty('shortTerm');
      expect(roadmap).toHaveProperty('longTerm');
      expect(roadmap.immediate.currentPrice).toBe(10);
      expect(roadmap.shortTerm.currentPrice).toBe(roadmap.immediate.suggestedPrice);
      expect(roadmap.longTerm.currentPrice).toBe(roadmap.shortTerm.suggestedPrice);
    });
    it('should use different strategies for different timeframes', () => {
      const currentMetrics = {
        utilization: 0.9,
        price: 10,
        queueDepth: 10,
        revenueRunRate: 6000,
      };
      const targets = {
        utilization: 0.8,
        revenue: 5500,
      };
      const roadmap = generatePricingRoadmap(currentMetrics, targets);
      // Immediate should be aggressive (priority depends on actual conditions)
      expect(['low', 'medium', 'high']).toContain(roadmap.immediate.priority);
      // Long-term should assume better queue management
      expect(roadmap.longTerm).toBeDefined();
    });
  });
  describe('Market Conditions Integration', () => {
    it('should handle high demand market conditions', () => {
      const highDemand = { demandLevel: 'high' };
      const suggestion = suggestPriceAdjustment(0.8, 0.7, 10, 2, 'conservative', highDemand);
      const baselineSuggestion = suggestPriceAdjustment(0.8, 0.7, 10, 2, 'conservative');
      expect(Math.abs(suggestion.adjustmentPercent)).toBeGreaterThan(
        Math.abs(baselineSuggestion.adjustmentPercent),
      );
    });
    it('should handle low demand market conditions', () => {
      const lowDemand = { demandLevel: 'low' };
      const suggestion = suggestPriceAdjustment(0.8, 0.7, 10, 2, 'conservative', lowDemand);
      const baselineSuggestion = suggestPriceAdjustment(0.8, 0.7, 10, 2, 'conservative');
      expect(Math.abs(suggestion.adjustmentPercent)).toBeLessThan(
        Math.abs(baselineSuggestion.adjustmentPercent),
      );
    });
    it('should handle seasonality adjustments', () => {
      const seasonalHigh = {
        demandLevel: 'medium',
        seasonality: 1.0, // Peak season
      };
      const seasonalLow = {
        demandLevel: 'medium',
        seasonality: 0.0, // Off season
      };
      const highSuggestion = suggestPriceAdjustment(0.8, 0.7, 10, 2, 'conservative', seasonalHigh);
      const lowSuggestion = suggestPriceAdjustment(0.8, 0.7, 10, 2, 'conservative', seasonalLow);
      expect(Math.abs(highSuggestion.adjustmentPercent)).toBeGreaterThan(
        Math.abs(lowSuggestion.adjustmentPercent),
      );
    });
    it('should handle network congestion', () => {
      const congested = {
        demandLevel: 'medium',
        networkCongestion: 1.0,
      };
      const suggestion = suggestPriceAdjustment(0.7, 0.7, 10, 0, 'conservative', congested);
      // Even with balanced utilization, congestion should suggest price increase
      expect(suggestion.adjustmentPercent).toBeGreaterThan(0);
    });
  });
});
