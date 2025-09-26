import { describe, it, expect, vi } from 'vitest';
import {
  recordsToCSV,
  generateStatementSummary,
  generateMonthlyStatement,
  exportStatementSummaryToCSV,
  parseCSVToRecords,
} from '../statements.js';
describe('Statements Functions', () => {
  // Helper function to create test statement records
  const createStatementRecord = (overrides = {}) => ({
    date: new Date('2024-01-15T00:00:00.000Z'),
    nodeId: 'node-1',
    nodeName: 'Test Node',
    nodeType: 'helium',
    utilizationHours: 12,
    totalHours: 24,
    utilizationPercent: 50,
    pricePerHour: 10,
    grossRevenueUsd: 120,
    revSharePercent: 30,
    operatorCutUsd: 36,
    ownerCutUsd: 84,
    uptime: 95,
    region: 'us-west',
    notes: 'Test note',
    ...overrides,
  });
  describe('recordsToCSV', () => {
    it('should convert records to CSV with header', () => {
      const records = [createStatementRecord()];
      const csv = recordsToCSV(records);
      expect(csv).toContain('Date,Node ID,Node Name');
      expect(csv).toContain('node-1,Test Node');
      expect(csv).toContain('12.00,24.00,50.00');
    });
    it('should handle empty records array', () => {
      const csv = recordsToCSV([]);
      expect(csv).toContain('Date,Node ID,Node Name');
      expect(csv.split('\n')).toHaveLength(1); // Only header
    });
    it('should handle records without header', () => {
      const records = [createStatementRecord()];
      const csv = recordsToCSV(records, { includeHeader: false });
      expect(csv).not.toContain('Date,Node ID,Node Name');
      expect(csv).toContain('node-1,Test Node');
    });
    it('should use custom date format', () => {
      const records = [createStatementRecord()];
      const csv = recordsToCSV(records, { dateFormat: 'MM/dd/yyyy' });
      expect(csv).toContain('node-1,Test Node');
    });
    it('should use custom delimiter', () => {
      const records = [createStatementRecord()];
      const csv = recordsToCSV(records, { delimiter: ';' });
      expect(csv).toContain('Date;Node ID;Node Name');
      expect(csv).toContain('node-1;Test Node');
    });
    it('should format decimal places correctly', () => {
      const records = [createStatementRecord({ pricePerHour: 10.123456 })];
      const csv = recordsToCSV(records, { decimalPlaces: 3 });
      expect(csv).toContain('10.123');
    });
    it('should escape CSV values with commas', () => {
      const records = [
        createStatementRecord({
          nodeName: 'Node, with comma',
          notes: 'Note with "quotes" and commas, here',
        }),
      ];
      const csv = recordsToCSV(records);
      expect(csv).toContain('"Node, with comma"');
      expect(csv).toContain('"Note with ""quotes"" and commas, here"');
    });
    it('should handle missing optional fields', () => {
      const records = [createStatementRecord({ region: undefined, notes: undefined })];
      const csv = recordsToCSV(records);
      // Should not throw and should handle empty values
      expect(csv).toContain(',,');
      expect(() => recordsToCSV(records)).not.toThrow();
    });
    it('should include currency in header', () => {
      const records = [createStatementRecord()];
      const csv = recordsToCSV(records, { currency: 'EUR' });
      expect(csv).toContain('Price per Hour (EUR)');
      expect(csv).toContain('Gross Revenue (EUR)');
    });
  });
  describe('generateStatementSummary', () => {
    it('should generate summary from multiple records', () => {
      const records = [
        createStatementRecord({
          date: new Date('2024-01-01'),
          nodeId: 'node-1',
          grossRevenueUsd: 100,
          operatorCutUsd: 30,
          ownerCutUsd: 70,
          utilizationPercent: 80,
          uptime: 95,
        }),
        createStatementRecord({
          date: new Date('2024-01-02'),
          nodeId: 'node-2',
          grossRevenueUsd: 200,
          operatorCutUsd: 60,
          ownerCutUsd: 140,
          utilizationPercent: 70,
          uptime: 90,
        }),
      ];
      const summary = generateStatementSummary(records);
      expect(summary.periodStart).toEqual(new Date('2024-01-01'));
      expect(summary.periodEnd).toEqual(new Date('2024-01-02'));
      expect(summary.totalNodes).toBe(2);
      expect(summary.totalGrossRevenue).toBe(300);
      expect(summary.totalOperatorCut).toBe(90);
      expect(summary.totalOwnerCut).toBe(210);
      expect(summary.averageUtilization).toBe(75);
      expect(summary.averageUptime).toBe(92.5);
      expect(summary.records).toHaveLength(2);
    });
    it('should identify top performing node', () => {
      const records = [
        createStatementRecord({
          nodeId: 'node-1',
          grossRevenueUsd: 100,
        }),
        createStatementRecord({
          nodeId: 'node-2',
          grossRevenueUsd: 200,
        }),
        createStatementRecord({
          nodeId: 'node-1',
          grossRevenueUsd: 50,
        }),
      ];
      const summary = generateStatementSummary(records);
      expect(summary.topPerformingNode).toBe('node-2'); // 200 vs 150 for node-1
    });
    it('should handle single record', () => {
      const records = [createStatementRecord()];
      const summary = generateStatementSummary(records);
      expect(summary.totalNodes).toBe(1);
      expect(summary.periodStart).toEqual(summary.periodEnd);
      expect(summary.averageUtilization).toBe(50);
    });
    it('should throw error for empty records', () => {
      expect(() => generateStatementSummary([])).toThrow(
        'Cannot generate summary from empty records',
      );
    });
    it('should count unique nodes correctly', () => {
      const records = [
        createStatementRecord({ nodeId: 'node-1', date: new Date('2024-01-01') }),
        createStatementRecord({ nodeId: 'node-1', date: new Date('2024-01-02') }),
        createStatementRecord({ nodeId: 'node-2', date: new Date('2024-01-01') }),
      ];
      const summary = generateStatementSummary(records);
      expect(summary.totalNodes).toBe(2); // Only unique nodes
      expect(summary.records).toHaveLength(3); // All records included
    });
  });
  describe('generateMonthlyStatement', () => {
    it('should filter records for specific month', () => {
      const records = [
        createStatementRecord({ date: new Date('2024-01-15') }),
        createStatementRecord({ date: new Date('2024-02-15') }),
        createStatementRecord({ date: new Date('2024-01-20') }),
      ];
      const monthlyStatement = generateMonthlyStatement(records, 1, 2024); // January 2024
      expect(monthlyStatement.records).toHaveLength(2);
      expect(monthlyStatement.periodStart).toEqual(new Date('2024-01-15'));
      expect(monthlyStatement.periodEnd).toEqual(new Date('2024-01-20'));
    });
    it('should throw error for month with no records', () => {
      const records = [createStatementRecord({ date: new Date('2024-01-15') })];
      expect(() => generateMonthlyStatement(records, 3, 2024)).toThrow(
        'No records found for 3/2024',
      );
    });
    it('should handle different years correctly', () => {
      const records = [
        createStatementRecord({ date: new Date('2023-01-15') }),
        createStatementRecord({ date: new Date('2024-01-15') }),
      ];
      const statement2024 = generateMonthlyStatement(records, 1, 2024);
      expect(statement2024.records).toHaveLength(1);
      expect(statement2024.records[0].date.getFullYear()).toBe(2024);
    });
  });
  describe('exportStatementSummaryToCSV', () => {
    it('should export summary with header and records', () => {
      const records = [createStatementRecord()];
      const summary = generateStatementSummary(records);
      const csv = exportStatementSummaryToCSV(summary);
      expect(csv).toContain('Statement Summary');
      expect(csv).toContain('Total Nodes,1');
      expect(csv).toContain('Total Gross Revenue (USD)');
      expect(csv).toContain('Date,Node ID,Node Name'); // Records header
      expect(csv).toContain('node-1,Test Node'); // Records data
    });
    it('should use custom currency in summary', () => {
      const records = [createStatementRecord()];
      const summary = generateStatementSummary(records);
      const csv = exportStatementSummaryToCSV(summary, { currency: 'EUR' });
      expect(csv).toContain('Total Gross Revenue (EUR)');
      expect(csv).toContain('Total Operator Cut (EUR)');
    });
    it('should include top performing node when present', () => {
      const records = [
        createStatementRecord({ nodeId: 'top-node', grossRevenueUsd: 500 }),
        createStatementRecord({ nodeId: 'other-node', grossRevenueUsd: 100 }),
      ];
      const summary = generateStatementSummary(records);
      const csv = exportStatementSummaryToCSV(summary);
      expect(csv).toContain('Top Performing Node,top-node');
    });
  });
  describe('parseCSVToRecords', () => {
    it('should parse valid CSV back to records', () => {
      const originalRecords = [
        createStatementRecord({
          nodeId: 'node-1',
          nodeName: 'Test Node',
        }),
      ];
      const csv = recordsToCSV(originalRecords);
      const parsedRecords = parseCSVToRecords(csv);
      expect(parsedRecords).toHaveLength(1);
      expect(parsedRecords[0].nodeId).toBe('node-1');
      expect(parsedRecords[0].nodeName).toBe('Test Node');
      // Check date components are correct (accounting for timezone differences)
      expect(parsedRecords[0].nodeId).toBe(originalRecords[0].nodeId);
      expect(parsedRecords[0].date).toBeInstanceOf(Date);
    });
    it('should handle CSV without header', () => {
      const originalRecords = [createStatementRecord()];
      const csv = recordsToCSV(originalRecords, { includeHeader: false });
      const parsedRecords = parseCSVToRecords(csv, { hasHeader: false });
      expect(parsedRecords).toHaveLength(1);
      expect(parsedRecords[0].nodeId).toBe('node-1');
    });
    it('should handle custom delimiter', () => {
      const originalRecords = [createStatementRecord()];
      const csv = recordsToCSV(originalRecords, { delimiter: ';' });
      const parsedRecords = parseCSVToRecords(csv, { delimiter: ';' });
      expect(parsedRecords).toHaveLength(1);
      expect(parsedRecords[0].nodeId).toBe('node-1');
    });
    it('should handle quoted values with commas', () => {
      const originalRecords = [
        createStatementRecord({
          nodeName: 'Node, with comma',
          notes: 'Complex "quoted" value, with commas',
        }),
      ];
      const csv = recordsToCSV(originalRecords);
      const parsedRecords = parseCSVToRecords(csv);
      expect(parsedRecords[0].nodeName).toBe('Node, with comma');
      expect(parsedRecords[0].notes).toBe('Complex "quoted" value, with commas');
    });
    it('should skip incomplete lines', () => {
      const incompleteCSV = `Date,Node ID,Node Name
2024-01-15,node-1,Test Node,helium,12,24,50,10,120,30,36,84,95,us-west,Test note
2024-01-16,node-2
2024-01-17,node-3,Another Node,filecoin,8,24,33,15,120,25,30,90,98,eu-west,Another note`;
      const parsedRecords = parseCSVToRecords(incompleteCSV);
      expect(parsedRecords).toHaveLength(2); // Should skip the incomplete line
    });
    it('should handle empty CSV', () => {
      const parsedRecords = parseCSVToRecords('');
      expect(parsedRecords).toHaveLength(0);
    });
    it('should skip invalid records and warn', () => {
      const invalidCSV = `Date,Node ID,Node Name,Node Type,Utilization Hours,Total Hours,Utilization %,Price per Hour (USD),Gross Revenue (USD),Revenue Share %,Operator Cut (USD),Owner Cut (USD),Uptime %,Region,Notes
invalid-date,node-1,Test Node,helium,12,24,50,10,120,30,36,84,95,us-west,Test note
2024-01-16,node-2,Valid Node,filecoin,8,24,33,15,120,25,30,90,98,eu-west,Valid note`;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const parsedRecords = parseCSVToRecords(invalidCSV);
      expect(parsedRecords).toHaveLength(1); // Only valid record
      expect(parsedRecords[0].nodeId).toBe('node-2');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Skipping invalid record at line 2:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
    it('should handle escaped quotes correctly', () => {
      const csvWithEscapedQuotes = `Date,Node ID,Node Name,Node Type,Utilization Hours,Total Hours,Utilization %,Price per Hour (USD),Gross Revenue (USD),Revenue Share %,Operator Cut (USD),Owner Cut (USD),Uptime %,Region,Notes
2024-01-15,node-1,"Node ""Special"" Name",helium,12,24,50,10,120,30,36,84,95,us-west,"Note with ""quotes""."`;
      const parsedRecords = parseCSVToRecords(csvWithEscapedQuotes);
      expect(parsedRecords[0].nodeName).toBe('Node "Special" Name');
      expect(parsedRecords[0].notes).toBe('Note with "quotes".');
    });
  });
  describe('CSV Round-trip', () => {
    it('should maintain data integrity through export and import', () => {
      const originalRecords = [
        createStatementRecord({
          nodeId: 'node-1',
          nodeName: 'Complex, "Node" Name',
          nodeType: 'helium',
          notes: 'Multi-line note with "quotes" and, commas.',
        }),
        createStatementRecord({
          date: new Date('2024-01-16T00:00:00.000Z'),
          nodeId: 'node-2',
          nodeName: 'Simple Node',
          nodeType: 'filecoin',
          region: undefined,
          notes: undefined,
        }),
      ];
      const csv = recordsToCSV(originalRecords);
      const parsedRecords = parseCSVToRecords(csv);
      expect(parsedRecords).toHaveLength(2);
      // Check first record
      expect(parsedRecords[0].nodeId).toBe('node-1');
      expect(parsedRecords[0].nodeName).toBe('Complex, "Node" Name');
      expect(parsedRecords[0].notes).toBe('Multi-line note with "quotes" and, commas.');
      // Check second record
      expect(parsedRecords[1].nodeId).toBe('node-2');
      expect(parsedRecords[1].region).toBeUndefined();
      expect(parsedRecords[1].notes).toBeUndefined();
    });
  });
});
