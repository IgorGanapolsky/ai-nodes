import { z } from 'zod';
import { format } from 'date-fns';
// Statement record schema
export const StatementRecord = z.object({
  date: z.date(),
  nodeId: z.string(),
  nodeName: z.string(),
  nodeType: z.string(),
  utilizationHours: z.number().min(0),
  totalHours: z.number().min(0),
  utilizationPercent: z.number().min(0).max(100),
  pricePerHour: z.number().min(0),
  grossRevenueUsd: z.number().min(0),
  revSharePercent: z.number().min(0).max(100),
  operatorCutUsd: z.number().min(0),
  ownerCutUsd: z.number().min(0),
  uptime: z.number().min(0).max(100),
  region: z.string().optional(),
  notes: z.string().optional(),
});
// Statement summary schema
export const StatementSummary = z.object({
  periodStart: z.date(),
  periodEnd: z.date(),
  totalNodes: z.number().int().min(0),
  totalGrossRevenue: z.number().min(0),
  totalOperatorCut: z.number().min(0),
  totalOwnerCut: z.number().min(0),
  averageUtilization: z.number().min(0).max(100),
  averageUptime: z.number().min(0).max(100),
  topPerformingNode: z.string().optional(),
  records: z.array(StatementRecord),
});
/**
 * Convert statement records to CSV format
 * @param records Array of statement records
 * @param options CSV export options
 * @returns CSV string
 */
export function recordsToCSV(records, options = {}) {
  const {
    includeHeader = true,
    dateFormat = 'yyyy-MM-dd',
    delimiter = ',',
    decimalPlaces = 2,
    currency = 'USD',
  } = options;
  if (records.length === 0) {
    return includeHeader ? getCSVHeader(delimiter, currency) : '';
  }
  const lines = [];
  if (includeHeader) {
    lines.push(getCSVHeader(delimiter, currency));
  }
  for (const record of records) {
    const row = [
      format(record.date, dateFormat),
      escapeCSVValue(record.nodeId),
      escapeCSVValue(record.nodeName),
      escapeCSVValue(record.nodeType),
      record.utilizationHours.toFixed(decimalPlaces),
      record.totalHours.toFixed(decimalPlaces),
      record.utilizationPercent.toFixed(decimalPlaces),
      record.pricePerHour.toFixed(decimalPlaces),
      record.grossRevenueUsd.toFixed(decimalPlaces),
      record.revSharePercent.toFixed(decimalPlaces),
      record.operatorCutUsd.toFixed(decimalPlaces),
      record.ownerCutUsd.toFixed(decimalPlaces),
      record.uptime.toFixed(decimalPlaces),
      escapeCSVValue(record.region || ''),
      escapeCSVValue(record.notes || ''),
    ];
    lines.push(row.join(delimiter));
  }
  return lines.join('\n');
}
/**
 * Generate CSV header
 */
function getCSVHeader(delimiter, currency) {
  const headers = [
    'Date',
    'Node ID',
    'Node Name',
    'Node Type',
    'Utilization Hours',
    'Total Hours',
    'Utilization %',
    `Price per Hour (${currency})`,
    `Gross Revenue (${currency})`,
    'Revenue Share %',
    `Operator Cut (${currency})`,
    `Owner Cut (${currency})`,
    'Uptime %',
    'Region',
    'Notes',
  ];
  return headers.join(delimiter);
}
/**
 * Escape CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value) {
  if (!value) return '';
  // If value contains delimiter, quotes, or newlines, wrap in quotes and escape internal quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
/**
 * Generate statement summary from records
 * @param records Array of statement records
 * @returns Statement summary
 */
export function generateStatementSummary(records) {
  if (records.length === 0) {
    throw new Error('Cannot generate summary from empty records');
  }
  // Sort records by date to find period boundaries
  const sortedRecords = [...records].sort((a, b) => a.date.getTime() - b.date.getTime());
  const periodStart = sortedRecords[0].date;
  const periodEnd = sortedRecords[sortedRecords.length - 1].date;
  // Calculate totals
  const totalGrossRevenue = records.reduce((sum, r) => sum + r.grossRevenueUsd, 0);
  const totalOperatorCut = records.reduce((sum, r) => sum + r.operatorCutUsd, 0);
  const totalOwnerCut = records.reduce((sum, r) => sum + r.ownerCutUsd, 0);
  // Calculate averages
  const averageUtilization =
    records.reduce((sum, r) => sum + r.utilizationPercent, 0) / records.length;
  const averageUptime = records.reduce((sum, r) => sum + r.uptime, 0) / records.length;
  // Find top performing node (by gross revenue)
  const nodeRevenues = new Map();
  records.forEach((record) => {
    const current = nodeRevenues.get(record.nodeId) || 0;
    nodeRevenues.set(record.nodeId, current + record.grossRevenueUsd);
  });
  let topPerformingNode;
  let maxRevenue = 0;
  for (const [nodeId, revenue] of nodeRevenues.entries()) {
    if (revenue > maxRevenue) {
      maxRevenue = revenue;
      topPerformingNode = nodeId;
    }
  }
  // Count unique nodes
  const uniqueNodes = new Set(records.map((r) => r.nodeId));
  return {
    periodStart,
    periodEnd,
    totalNodes: uniqueNodes.size,
    totalGrossRevenue,
    totalOperatorCut,
    totalOwnerCut,
    averageUtilization,
    averageUptime,
    topPerformingNode,
    records,
  };
}
/**
 * Generate monthly statement from daily records
 * @param dailyRecords Array of daily statement records
 * @param month Month (1-12)
 * @param year Year
 * @returns Monthly statement summary
 */
export function generateMonthlyStatement(dailyRecords, month, year) {
  // Filter records for the specified month and year
  const monthlyRecords = dailyRecords.filter((record) => {
    const recordDate = record.date;
    return recordDate.getMonth() === month - 1 && recordDate.getFullYear() === year;
  });
  if (monthlyRecords.length === 0) {
    throw new Error(`No records found for ${month}/${year}`);
  }
  return generateStatementSummary(monthlyRecords);
}
/**
 * Export statement summary to CSV with summary header
 * @param summary Statement summary
 * @param options CSV export options
 * @returns CSV string with summary information
 */
export function exportStatementSummaryToCSV(summary, options = {}) {
  const {
    dateFormat = 'yyyy-MM-dd',
    delimiter = ',',
    decimalPlaces = 2,
    currency = 'USD',
  } = options;
  const lines = [];
  // Add summary header
  lines.push(
    `Statement Summary${delimiter}Period: ${format(summary.periodStart, dateFormat)} to ${format(summary.periodEnd, dateFormat)}`,
  );
  lines.push(`Total Nodes${delimiter}${summary.totalNodes}`);
  lines.push(
    `Total Gross Revenue (${currency})${delimiter}${summary.totalGrossRevenue.toFixed(decimalPlaces)}`,
  );
  lines.push(
    `Total Operator Cut (${currency})${delimiter}${summary.totalOperatorCut.toFixed(decimalPlaces)}`,
  );
  lines.push(
    `Total Owner Cut (${currency})${delimiter}${summary.totalOwnerCut.toFixed(decimalPlaces)}`,
  );
  lines.push(
    `Average Utilization (%)${delimiter}${summary.averageUtilization.toFixed(decimalPlaces)}`,
  );
  lines.push(`Average Uptime (%)${delimiter}${summary.averageUptime.toFixed(decimalPlaces)}`);
  if (summary.topPerformingNode) {
    lines.push(`Top Performing Node${delimiter}${summary.topPerformingNode}`);
  }
  lines.push(''); // Empty line separator
  // Add detailed records
  const recordsCSV = recordsToCSV(summary.records, { ...options, includeHeader: true });
  lines.push(recordsCSV);
  return lines.join('\n');
}
/**
 * Parse CSV string back to statement records
 * @param csvContent CSV string content
 * @param options Parse options
 * @returns Array of statement records
 */
export function parseCSVToRecords(csvContent, options = {}) {
  const { hasHeader = true, delimiter = ',' } = options;
  const lines = csvContent.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length === 0) {
    return [];
  }
  const startIndex = hasHeader ? 1 : 0;
  const records = [];
  for (let i = startIndex; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i], delimiter);
    if (fields.length < 13) {
      continue; // Skip incomplete lines
    }
    try {
      const record = {
        date: new Date(fields[0]),
        nodeId: fields[1],
        nodeName: fields[2],
        nodeType: fields[3],
        utilizationHours: parseFloat(fields[4]),
        totalHours: parseFloat(fields[5]),
        utilizationPercent: parseFloat(fields[6]),
        pricePerHour: parseFloat(fields[7]),
        grossRevenueUsd: parseFloat(fields[8]),
        revSharePercent: parseFloat(fields[9]),
        operatorCutUsd: parseFloat(fields[10]),
        ownerCutUsd: parseFloat(fields[11]),
        uptime: parseFloat(fields[12]),
        region: fields[13] || undefined,
        notes: fields[14] || undefined,
      };
      // Validate the parsed record
      StatementRecord.parse(record);
      records.push(record);
    } catch (error) {
      console.warn(`Skipping invalid record at line ${i + 1}:`, error);
    }
  }
  return records;
}
/**
 * Parse a single CSV line, handling quoted values properly
 */
function parseCSVLine(line, delimiter) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;
  while (i < line.length) {
    const char = line[i];
    if (char === '"' && !inQuotes) {
      inQuotes = true;
    } else if (char === '"' && inQuotes) {
      // Check for escaped quote
      if (i + 1 < line.length && line[i + 1] === '"') {
        currentField += '"';
        i++; // Skip the next quote
      } else {
        inQuotes = false;
      }
    } else if (char === delimiter && !inQuotes) {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
    i++;
  }
  // Add the last field
  fields.push(currentField);
  return fields;
}
//# sourceMappingURL=statements.js.map
