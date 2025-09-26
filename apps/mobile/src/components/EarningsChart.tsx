import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { ChartData } from '../types';
import { formatCurrency } from '../utils/formatters';

const screenWidth = Dimensions.get('window').width;

interface EarningsChartProps {
  data: ChartData;
  type?: 'line' | 'bar';
  title?: string;
  subtitle?: string;
  height?: number;
}

export const EarningsChart: React.FC<EarningsChartProps> = ({
  data,
  type = 'line',
  title,
  subtitle,
  height = 220,
}) => {
  const chartConfig = {
    backgroundColor: '#1a1a2e',
    backgroundGradientFrom: '#1a1a2e',
    backgroundGradientTo: '#16213e',
    decimalPlaces: 2,
    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: '#10B981',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: 'rgba(255, 255, 255, 0.1)',
    },
  };

  const chartData = {
    labels:
      data.labels.length > 6
        ? data.labels.filter((_, index) => index % Math.ceil(data.labels.length / 6) === 0)
        : data.labels,
    datasets: data.datasets.map((dataset) => ({
      data:
        data.labels.length > 6
          ? dataset.data.filter((_, index) => index % Math.ceil(data.labels.length / 6) === 0)
          : dataset.data,
      color: dataset.color || ((opacity = 1) => `rgba(16, 185, 129, ${opacity})`),
      strokeWidth: dataset.strokeWidth || 2,
    })),
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      width: screenWidth - 32,
      height,
      chartConfig,
      bezier: type === 'line',
      style: {
        marginVertical: 8,
        borderRadius: 16,
      },
    };

    if (type === 'line') {
      return <LineChart {...commonProps} />;
    } else {
      return <BarChart {...commonProps} yAxisLabel="" yAxisSuffix="" />;
    }
  };

  const totalEarnings = data.datasets[0]?.data.reduce((sum, value) => sum + value, 0) || 0;
  const averageEarnings = totalEarnings / (data.datasets[0]?.data.length || 1);

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={styles.statValue}>{formatCurrency(totalEarnings)}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Average</Text>
          <Text style={styles.statValue}>{formatCurrency(averageEarnings)}</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>{renderChart()}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  chartContainer: {
    alignItems: 'center',
  },
});
