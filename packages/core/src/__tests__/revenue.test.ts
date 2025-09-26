import { describe, it, expect } from 'vitest';
import {
  computeRevShare,
  calculateTargetUtilization,
  calculateMonthlyGross,
  calculateRevenueGap,
} from '../revenue.js';

describe('Revenue Functions', () => {
  describe('computeRevShare', () => {
    it('should calculate revenue sharing correctly', () => {
      const result = computeRevShare(1000, 0.3);

      expect(result.grossUsd).toBe(1000);
      expect(result.myCutUsd).toBe(300);
      expect(result.ownerCutUsd).toBe(700);
      expect(result.revSharePct).toBe(0.3);
    });

    it('should handle zero gross revenue', () => {
      const result = computeRevShare(0, 0.3);

      expect(result.grossUsd).toBe(0);
      expect(result.myCutUsd).toBe(0);
      expect(result.ownerCutUsd).toBe(0);
    });

    it('should handle 100% revenue share', () => {
      const result = computeRevShare(1000, 1.0);

      expect(result.myCutUsd).toBe(1000);
      expect(result.ownerCutUsd).toBe(0);
    });

    it('should handle 0% revenue share', () => {
      const result = computeRevShare(1000, 0);

      expect(result.myCutUsd).toBe(0);
      expect(result.ownerCutUsd).toBe(1000);
    });

    it('should throw error for negative gross revenue', () => {
      expect(() => computeRevShare(-100, 0.3)).toThrow('Gross USD must be non-negative');
    });

    it('should throw error for invalid revenue share percentage', () => {
      expect(() => computeRevShare(1000, -0.1)).toThrow(
        'Revenue share percentage must be between 0 and 1',
      );
      expect(() => computeRevShare(1000, 1.1)).toThrow(
        'Revenue share percentage must be between 0 and 1',
      );
    });
  });

  describe('calculateTargetUtilization', () => {
    it('should calculate target utilization correctly', () => {
      const result = calculateTargetUtilization(3600, 5, 30); // $3600 target, $5/hour, 30 days

      expect(result.targetMonthlyGross).toBe(3600);
      expect(result.currentPricePerHour).toBe(5);
      expect(result.daysInMonth).toBe(30);
      expect(result.totalHours).toBe(720); // 30 * 24
      expect(result.requiredHours).toBe(720); // 3600 / 5
      expect(result.targetUtilization).toBe(1.0); // 720 / 720
    });

    it('should cap utilization at 100%', () => {
      const result = calculateTargetUtilization(10000, 5, 30); // Impossible target

      expect(result.targetUtilization).toBe(1.0);
      expect(result.requiredHours).toBe(2000); // 10000 / 5
    });

    it('should handle different month lengths', () => {
      const result = calculateTargetUtilization(2976, 4, 31); // 31-day month

      expect(result.totalHours).toBe(744); // 31 * 24
      expect(result.targetUtilization).toBe(1.0);
    });

    it('should throw error for negative target', () => {
      expect(() => calculateTargetUtilization(-1000, 5, 30)).toThrow(
        'Target monthly gross must be non-negative',
      );
    });

    it('should throw error for non-positive price', () => {
      expect(() => calculateTargetUtilization(1000, 0, 30)).toThrow(
        'Current price per hour must be positive',
      );
      expect(() => calculateTargetUtilization(1000, -5, 30)).toThrow(
        'Current price per hour must be positive',
      );
    });

    it('should throw error for invalid days', () => {
      expect(() => calculateTargetUtilization(1000, 5, 0)).toThrow(
        'Days in month must be between 1 and 31',
      );
      expect(() => calculateTargetUtilization(1000, 5, 32)).toThrow(
        'Days in month must be between 1 and 31',
      );
    });
  });

  describe('calculateMonthlyGross', () => {
    it('should calculate monthly gross revenue correctly', () => {
      const result = calculateMonthlyGross(0.8, 10, 30); // 80% utilization, $10/hour, 30 days

      expect(result).toBe(5760); // 30 * 24 * 0.8 * 10
    });

    it('should handle 100% utilization', () => {
      const result = calculateMonthlyGross(1.0, 5, 30);

      expect(result).toBe(3600); // 30 * 24 * 1.0 * 5
    });

    it('should handle 0% utilization', () => {
      const result = calculateMonthlyGross(0, 10, 30);

      expect(result).toBe(0);
    });

    it('should throw error for invalid utilization', () => {
      expect(() => calculateMonthlyGross(-0.1, 10, 30)).toThrow(
        'Utilization percentage must be between 0 and 1',
      );
      expect(() => calculateMonthlyGross(1.1, 10, 30)).toThrow(
        'Utilization percentage must be between 0 and 1',
      );
    });

    it('should throw error for negative price', () => {
      expect(() => calculateMonthlyGross(0.8, -10, 30)).toThrow(
        'Price per hour must be non-negative',
      );
    });
  });

  describe('calculateRevenueGap', () => {
    it('should calculate revenue gap when under target', () => {
      const result = calculateRevenueGap(5000, 0.5, 10, 30); // Target $5000, 50% util, $10/hour, 30 days
      const expectedCurrentGross = 30 * 24 * 0.5 * 10; // 3600

      expect(result.currentMonthlyGross).toBe(expectedCurrentGross);
      expect(result.revenueGapUsd).toBe(5000 - expectedCurrentGross);
      expect(result.gapPercentage).toBe((5000 - expectedCurrentGross) / 5000);
      expect(result.isTargetMet).toBe(false);
    });

    it('should show target is met when revenue exceeds target', () => {
      const result = calculateRevenueGap(3000, 0.8, 10, 30); // Target $3000, actual $5760

      expect(result.revenueGapUsd).toBeLessThan(0);
      expect(result.isTargetMet).toBe(true);
    });

    it('should handle exact target match', () => {
      const result = calculateRevenueGap(3600, 0.5, 10, 30); // Exact match

      expect(result.revenueGapUsd).toBe(0);
      expect(result.gapPercentage).toBe(0);
      expect(result.isTargetMet).toBe(true);
    });

    it('should handle zero target gracefully', () => {
      const result = calculateRevenueGap(0, 0.5, 10, 30);

      expect(result.gapPercentage).toBe(0);
      expect(result.isTargetMet).toBe(true);
    });
  });
});
