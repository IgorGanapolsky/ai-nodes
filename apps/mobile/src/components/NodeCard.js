import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, } from 'react-native';
import { formatCurrency, formatPercentage, formatRelativeTime, getStatusColor, getPerformanceColor, } from '../utils/formatters';
export const NodeCard = ({ node, onPress, style }) => {
    const statusColor = getStatusColor(node.status);
    const performanceColor = getPerformanceColor(node.metrics.performance);
    return (<TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name}>{node.name}</Text>
          <Text style={styles.type}>{node.type}</Text>
        </View>
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}/>
      </View>

      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, { color: statusColor }]}>
            {node.status.charAt(0).toUpperCase() + node.status.slice(1)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Performance</Text>
          <Text style={[styles.value, { color: performanceColor }]}>
            {formatPercentage(node.metrics.performance)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Daily Earnings</Text>
          <Text style={styles.earnings}>
            {formatCurrency(node.earnings.daily)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Total Earnings</Text>
          <Text style={styles.earnings}>
            {formatCurrency(node.earnings.total)}
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Location</Text>
          <Text style={styles.value}>{node.location}</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.label}>Last Updated</Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(node.lastUpdated)}
          </Text>
        </View>
      </View>

      {node.metrics.temperature && (<View style={styles.additionalMetrics}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Temp</Text>
            <Text style={styles.metricValue}>
              {Math.round(node.metrics.temperature)}°C
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Uptime</Text>
            <Text style={styles.metricValue}>
              {formatPercentage(node.metrics.uptime)}
            </Text>
          </View>
          {node.metrics.hashRate && (<View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Hash Rate</Text>
              <Text style={styles.metricValue}>
                {(node.metrics.hashRate / 1e9).toFixed(1)}GH/s
              </Text>
            </View>)}
        </View>)}
    </TouchableOpacity>);
};
const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleContainer: {
        flex: 1,
    },
    name: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    type: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    content: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    value: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
    earnings: {
        fontSize: 14,
        color: '#10B981',
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    additionalMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    metricItem: {
        alignItems: 'center',
    },
    metricLabel: {
        fontSize: 12,
        color: '#6B7280',
        marginBottom: 2,
    },
    metricValue: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '600',
    },
});
