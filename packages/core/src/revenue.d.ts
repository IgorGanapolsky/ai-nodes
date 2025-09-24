import { z } from 'zod';
export declare const RevShareResult: z.ZodObject<{
    myCutUsd: z.ZodNumber;
    ownerCutUsd: z.ZodNumber;
    grossUsd: z.ZodNumber;
    revSharePct: z.ZodNumber;
}, z.core.$strip>;
export type RevShareResult = z.infer<typeof RevShareResult>;
export declare const UtilizationResult: z.ZodObject<{
    targetUtilization: z.ZodNumber;
    requiredHours: z.ZodNumber;
    totalHours: z.ZodNumber;
    targetMonthlyGross: z.ZodNumber;
    currentPricePerHour: z.ZodNumber;
    daysInMonth: z.ZodNumber;
}, z.core.$strip>;
export type UtilizationResult = z.infer<typeof UtilizationResult>;
/**
 * Calculate revenue sharing between operator and node owner
 * @param grossUsd Total gross revenue in USD
 * @param revSharePct Revenue share percentage (0-1, where 0.3 = 30%)
 * @returns Revenue sharing breakdown
 */
export declare function computeRevShare(grossUsd: number, revSharePct: number): RevShareResult;
/**
 * Calculate target utilization needed to achieve monthly gross revenue target
 * @param targetMonthlyGross Target monthly gross revenue in USD
 * @param currentPricePerHour Current price per hour in USD
 * @param daysInMonth Number of days in the month (default: 30)
 * @returns Target utilization calculation result
 */
export declare function calculateTargetUtilization(targetMonthlyGross: number, currentPricePerHour: number, daysInMonth?: number): UtilizationResult;
/**
 * Calculate actual monthly gross revenue based on utilization and pricing
 * @param utilizationPct Current utilization percentage (0-1)
 * @param pricePerHour Price per hour in USD
 * @param daysInMonth Number of days in the month (default: 30)
 * @returns Projected monthly gross revenue
 */
export declare function calculateMonthlyGross(utilizationPct: number, pricePerHour: number, daysInMonth?: number): number;
/**
 * Calculate revenue gap between target and current performance
 * @param targetMonthlyGross Target monthly gross revenue
 * @param currentUtilization Current utilization percentage (0-1)
 * @param currentPricePerHour Current price per hour
 * @param daysInMonth Number of days in the month
 * @returns Revenue gap information
 */
export declare function calculateRevenueGap(targetMonthlyGross: number, currentUtilization: number, currentPricePerHour: number, daysInMonth?: number): {
    revenueGapUsd: number;
    currentMonthlyGross: number;
    gapPercentage: number;
    isTargetMet: boolean;
};
//# sourceMappingURL=revenue.d.ts.map