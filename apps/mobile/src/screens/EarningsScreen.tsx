import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { EarningsChart } from '../components/EarningsChart';
import { useEarnings } from '../hooks/useEarnings';
import { useReinvest } from '../hooks/useReinvest';
import { useSettings } from '../hooks/useSettings';
import { formatCurrency, formatPercentage, formatDate } from '../utils/formatters';

const { width } = Dimensions.get('window');

const timeRanges = [
  { key: '24h', label: '24H' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
  { key: '3m', label: '3M' },
];

const EarningsScreen: React.FC = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  const {
    earnings,
    chartData,
    loading,
    totalEarnings,
    todayEarnings,
    yesterdayEarnings,
    earningsGrowth,
    refreshEarnings,
  } = useEarnings(undefined, selectedTimeRange);

  const { triggerReinvest, isReinvesting, reinvestHistory, totalReinvested, successfulReinvests } =
    useReinvest();

  const { settings } = useSettings();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshEarnings();
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleManualReinvest = async () => {
    const result = await triggerReinvest();
    if (!result.success) {
      // Show error alert
      console.error('Reinvest failed:', result.error);
    }
  };

  if (loading.isLoading && !chartData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading earnings data...</Text>
      </View>
    );
  }

  if (loading.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Unable to Load Earnings</Text>
        <Text style={styles.errorText}>{loading.error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(totalEarnings)}</Text>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{formatCurrency(todayEarnings)}</Text>
          <Text style={styles.summaryLabel}>Today</Text>
          <Text style={[styles.growthText, { color: earningsGrowth >= 0 ? '#10B981' : '#EF4444' }]}>
            {earningsGrowth >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(earningsGrowth))}
          </Text>
        </View>
      </View>

      {/* Time Range Selector */}
      <View style={styles.timeRangeContainer}>
        <Text style={styles.sectionTitle}>Earnings Trend</Text>
        <View style={styles.timeRangeSelector}>
          {timeRanges.map((range) => (
            <TouchableOpacity
              key={range.key}
              style={[
                styles.timeRangeButton,
                selectedTimeRange === range.key && styles.timeRangeButtonActive,
              ]}
              onPress={() => setSelectedTimeRange(range.key)}
            >
              <Text
                style={[
                  styles.timeRangeText,
                  selectedTimeRange === range.key && styles.timeRangeTextActive,
                ]}
              >
                {range.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Earnings Chart */}
      {chartData && (
        <EarningsChart
          data={chartData}
          type="line"
          title="Earnings Over Time"
          subtitle={`${timeRanges.find((r) => r.key === selectedTimeRange)?.label} view`}
        />
      )}

      {/* Reinvest Section */}
      <View style={styles.reinvestSection}>
        <Text style={styles.sectionTitle}>Auto-Reinvest</Text>
        <View style={styles.reinvestCard}>
          <View style={styles.reinvestHeader}>
            <View>
              <Text style={styles.reinvestStatus}>
                {settings.autoReinvest ? '✅ Enabled' : '❌ Disabled'}
              </Text>
              <Text style={styles.reinvestThreshold}>
                Threshold: {formatCurrency(settings.reinvestThreshold)}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.reinvestButton, isReinvesting && styles.reinvestButtonDisabled]}
              onPress={handleManualReinvest}
              disabled={isReinvesting}
            >
              {isReinvesting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.reinvestButtonText}>Reinvest Now</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.reinvestStats}>
            <View style={styles.reinvestStat}>
              <Text style={styles.reinvestStatValue}>{formatCurrency(totalReinvested)}</Text>
              <Text style={styles.reinvestStatLabel}>Total Reinvested</Text>
            </View>
            <View style={styles.reinvestStat}>
              <Text style={styles.reinvestStatValue}>{successfulReinvests}</Text>
              <Text style={styles.reinvestStatLabel}>Successful</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Reinvest History */}
      {reinvestHistory.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent Reinvest History</Text>
          {reinvestHistory.slice(0, 5).map((record, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyContent}>
                <Text style={styles.historyAmount}>{formatCurrency(record.amount)}</Text>
                <Text style={styles.historyDate}>{formatDate(record.timestamp)}</Text>
              </View>
              <View
                style={[
                  styles.historyStatus,
                  { backgroundColor: record.status === 'success' ? '#10B981' : '#EF4444' },
                ]}
              >
                <Text style={styles.historyStatusText}>
                  {record.status === 'success' ? '✓' : '✗'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Recent Earnings Transactions */}
      <View style={styles.transactionsSection}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {earnings.slice(0, 10).map((earning, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionContent}>
              <Text style={styles.transactionType}>
                {earning.type.charAt(0).toUpperCase() + earning.type.slice(1)} Earnings
              </Text>
              <Text style={styles.transactionDate}>{formatDate(earning.timestamp)}</Text>
            </View>
            <Text style={styles.transactionAmount}>+{formatCurrency(earning.amount)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  growthText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  timeRangeContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  timeRangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  timeRangeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  timeRangeButtonActive: {
    backgroundColor: '#10B981',
  },
  timeRangeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeRangeTextActive: {
    color: '#FFFFFF',
  },
  reinvestSection: {
    padding: 16,
  },
  reinvestCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reinvestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  reinvestStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  reinvestThreshold: {
    fontSize: 14,
    color: '#6B7280',
  },
  reinvestButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  reinvestButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  reinvestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reinvestStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  reinvestStat: {
    alignItems: 'center',
  },
  reinvestStatValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  reinvestStatLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  historySection: {
    padding: 16,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  historyContent: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyStatus: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyStatusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  transactionsSection: {
    padding: 16,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionContent: {
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#10B981',
  },
});

export default EarningsScreen;
