import { z } from 'zod';
export declare const StatementRecord: z.ZodObject<
  {
    date: z.ZodDate;
    nodeId: z.ZodString;
    nodeName: z.ZodString;
    nodeType: z.ZodString;
    utilizationHours: z.ZodNumber;
    totalHours: z.ZodNumber;
    utilizationPercent: z.ZodNumber;
    pricePerHour: z.ZodNumber;
    grossRevenueUsd: z.ZodNumber;
    revSharePercent: z.ZodNumber;
    operatorCutUsd: z.ZodNumber;
    ownerCutUsd: z.ZodNumber;
    uptime: z.ZodNumber;
    region: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
  },
  z.core.$strip
>;
export type StatementRecord = z.infer<typeof StatementRecord>;
export declare const StatementSummary: z.ZodObject<
  {
    periodStart: z.ZodDate;
    periodEnd: z.ZodDate;
    totalNodes: z.ZodNumber;
    totalGrossRevenue: z.ZodNumber;
    totalOperatorCut: z.ZodNumber;
    totalOwnerCut: z.ZodNumber;
    averageUtilization: z.ZodNumber;
    averageUptime: z.ZodNumber;
    topPerformingNode: z.ZodOptional<z.ZodString>;
    records: z.ZodArray<
      z.ZodObject<
        {
          date: z.ZodDate;
          nodeId: z.ZodString;
          nodeName: z.ZodString;
          nodeType: z.ZodString;
          utilizationHours: z.ZodNumber;
          totalHours: z.ZodNumber;
          utilizationPercent: z.ZodNumber;
          pricePerHour: z.ZodNumber;
          grossRevenueUsd: z.ZodNumber;
          revSharePercent: z.ZodNumber;
          operatorCutUsd: z.ZodNumber;
          ownerCutUsd: z.ZodNumber;
          uptime: z.ZodNumber;
          region: z.ZodOptional<z.ZodString>;
          notes: z.ZodOptional<z.ZodString>;
        },
        z.core.$strip
      >
    >;
  },
  z.core.$strip
>;
export type StatementSummary = z.infer<typeof StatementSummary>;
export interface CSVExportOptions {
  includeHeader?: boolean;
  dateFormat?: string;
  delimiter?: string;
  decimalPlaces?: number;
  currency?: string;
}
/**
 * Convert statement records to CSV format
 * @param records Array of statement records
 * @param options CSV export options
 * @returns CSV string
 */
export declare function recordsToCSV(
  records: StatementRecord[],
  options?: CSVExportOptions,
): string;
/**
 * Generate statement summary from records
 * @param records Array of statement records
 * @returns Statement summary
 */
export declare function generateStatementSummary(records: StatementRecord[]): StatementSummary;
/**
 * Generate monthly statement from daily records
 * @param dailyRecords Array of daily statement records
 * @param month Month (1-12)
 * @param year Year
 * @returns Monthly statement summary
 */
export declare function generateMonthlyStatement(
  dailyRecords: StatementRecord[],
  month: number,
  year: number,
): StatementSummary;
/**
 * Export statement summary to CSV with summary header
 * @param summary Statement summary
 * @param options CSV export options
 * @returns CSV string with summary information
 */
export declare function exportStatementSummaryToCSV(
  summary: StatementSummary,
  options?: CSVExportOptions,
): string;
/**
 * Parse CSV string back to statement records
 * @param csvContent CSV string content
 * @param options Parse options
 * @returns Array of statement records
 */
export declare function parseCSVToRecords(
  csvContent: string,
  options?: {
    hasHeader?: boolean;
    delimiter?: string;
  },
): StatementRecord[];
//# sourceMappingURL=statements.d.ts.map
