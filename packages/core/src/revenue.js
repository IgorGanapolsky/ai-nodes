import { z } from 'zod';
// Revenue sharing calculation result schema
export const RevShareResult = z.object({
    myCutUsd: z.number().min(0),
    ownerCutUsd: z.number().min(0),
    grossUsd: z.number().min(0),
    revSharePct: z.number().min(0).max(1),
});
// Target utilization calculation result schema
export const UtilizationResult = z.object({
    targetUtilization: z.number().min(0).max(1),
    requiredHours: z.number().min(0),
    totalHours: z.number().min(0),
    targetMonthlyGross: z.number().min(0),
    currentPricePerHour: z.number().min(0),
    daysInMonth: z.number().int().min(1).max(31),
});
/**
 * Calculate revenue sharing between operator and node owner
 * @param grossUsd Total gross revenue in USD
 * @param revSharePct Revenue share percentage (0-1, where 0.3 = 30%)
 * @returns Revenue sharing breakdown
 */
export function computeRevShare(grossUsd, revSharePct) {
    // Validate inputs
    if (grossUsd < 0) {
        throw new Error('Gross USD must be non-negative');
    }
    if (revSharePct < 0 || revSharePct > 1) {
        throw new Error('Revenue share percentage must be between 0 and 1');
    }
    const myCutUsd = grossUsd * revSharePct;
    const ownerCutUsd = grossUsd - myCutUsd;
    return {
        myCutUsd,
        ownerCutUsd,
        grossUsd,
        revSharePct,
    };
}
/**
 * Calculate target utilization needed to achieve monthly gross revenue target
 * @param targetMonthlyGross Target monthly gross revenue in USD
 * @param currentPricePerHour Current price per hour in USD
 * @param daysInMonth Number of days in the month (default: 30)
 * @returns Target utilization calculation result
 */
export function calculateTargetUtilization(targetMonthlyGross, currentPricePerHour, daysInMonth = 30) {
    // Validate inputs
    if (targetMonthlyGross < 0) {
        throw new Error('Target monthly gross must be non-negative');
    }
    if (currentPricePerHour <= 0) {
        throw new Error('Current price per hour must be positive');
    }
    if (daysInMonth < 1 || daysInMonth > 31) {
        throw new Error('Days in month must be between 1 and 31');
    }
    const totalHours = daysInMonth * 24;
    const requiredHours = targetMonthlyGross / currentPricePerHour;
    const targetUtilization = Math.min(requiredHours / totalHours, 1.0);
    return {
        targetUtilization,
        requiredHours,
        totalHours,
        targetMonthlyGross,
        currentPricePerHour,
        daysInMonth,
    };
}
/**
 * Calculate actual monthly gross revenue based on utilization and pricing
 * @param utilizationPct Current utilization percentage (0-1)
 * @param pricePerHour Price per hour in USD
 * @param daysInMonth Number of days in the month (default: 30)
 * @returns Projected monthly gross revenue
 */
export function calculateMonthlyGross(utilizationPct, pricePerHour, daysInMonth = 30) {
    if (utilizationPct < 0 || utilizationPct > 1) {
        throw new Error('Utilization percentage must be between 0 and 1');
    }
    if (pricePerHour < 0) {
        throw new Error('Price per hour must be non-negative');
    }
    if (daysInMonth < 1 || daysInMonth > 31) {
        throw new Error('Days in month must be between 1 and 31');
    }
    const totalHours = daysInMonth * 24;
    const utilizedHours = totalHours * utilizationPct;
    return utilizedHours * pricePerHour;
}
/**
 * Calculate revenue gap between target and current performance
 * @param targetMonthlyGross Target monthly gross revenue
 * @param currentUtilization Current utilization percentage (0-1)
 * @param currentPricePerHour Current price per hour
 * @param daysInMonth Number of days in the month
 * @returns Revenue gap information
 */
export function calculateRevenueGap(targetMonthlyGross, currentUtilization, currentPricePerHour, daysInMonth = 30) {
    const currentMonthlyGross = calculateMonthlyGross(currentUtilization, currentPricePerHour, daysInMonth);
    const revenueGapUsd = targetMonthlyGross - currentMonthlyGross;
    const gapPercentage = targetMonthlyGross > 0 ? (revenueGapUsd / targetMonthlyGross) : 0;
    const isTargetMet = revenueGapUsd <= 0;
    return {
        revenueGapUsd,
        currentMonthlyGross,
        gapPercentage,
        isTargetMet,
    };
}
//# sourceMappingURL=revenue.js.map