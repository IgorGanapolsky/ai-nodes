import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatUptime,
  getStatusColor,
  getPerformanceColor,
} from '../formatters';
describe('formatters', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly', () => {
      expect(formatCurrency(123.45)).toBe('$123.45');
      expect(formatCurrency(1000)).toBe('$1,000.00');
      expect(formatCurrency(0.1234)).toBe('$0.1234');
    });
  });
  describe('formatNumber', () => {
    it('formats numbers with specified decimals', () => {
      expect(formatNumber(123.456, 2)).toBe('123.46');
      expect(formatNumber(1000, 0)).toBe('1,000');
      expect(formatNumber(0.123, 3)).toBe('0.123');
    });
  });
  describe('formatPercentage', () => {
    it('formats percentage correctly', () => {
      expect(formatPercentage(85.67)).toBe('85.7%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });
  describe('formatUptime', () => {
    it('formats uptime correctly', () => {
      expect(formatUptime(3661)).toBe('1h 1m'); // 1 hour 1 minute 1 second
      expect(formatUptime(86461)).toBe('1d 0h'); // 1 day 1 minute 1 second
      expect(formatUptime(120)).toBe('2m'); // 2 minutes
    });
  });
  describe('getStatusColor', () => {
    it('returns correct colors for status', () => {
      expect(getStatusColor('online')).toBe('#10B981');
      expect(getStatusColor('offline')).toBe('#EF4444');
      expect(getStatusColor('maintenance')).toBe('#F59E0B');
      expect(getStatusColor('unknown')).toBe('#6B7280');
    });
  });
  describe('getPerformanceColor', () => {
    it('returns correct colors for performance', () => {
      expect(getPerformanceColor(95)).toBe('#10B981'); // >= 90
      expect(getPerformanceColor(75)).toBe('#F59E0B'); // >= 70
      expect(getPerformanceColor(50)).toBe('#EF4444'); // < 70
    });
  });
});
