import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NodeCard } from '../components/NodeCard';
import AlertBanner from '../components/AlertBanner';
import { useNodes } from '../hooks/useNodes';
import { useEarnings } from '../hooks/useEarnings';
import { useSettings } from '../hooks/useSettings';
import { useReinvest } from '../hooks/useReinvest';
import { webSocketService } from '../services/websocket';
import { notificationService } from '../services/notifications';
import { Alert as AlertType } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';

const DashboardScreen: React.FC = () => {
  const [alerts, setAlerts] = useState<AlertType[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    nodes,
    loading: nodesLoading,
    totalNodes,
    onlineNodes,
    offlineNodes,
    refreshNodes,
  } = useNodes();
  const { totalEarnings, todayEarnings, earningsGrowth } = useEarnings();
  const { settings } = useSettings();
  const { checkAutoReinvest, isReinvesting } = useReinvest();

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeConnection = async () => {
      if (settings.apiKey) {
        try {
          await webSocketService.connect(settings.apiKey);
          setIsConnected(true);
        } catch (error) {
          console.error('Failed to connect to WebSocket:', error);
          setIsConnected(false);
        }
      }
    };

    initializeConnection();

    return () => {
      webSocketService.disconnect();
    };
  }, [settings.apiKey]);

  // Initialize notifications
  useEffect(() => {
    const initializeNotifications = async () => {
      if (settings.notifications.enabled) {
        await notificationService.initialize();
      }
    };

    initializeNotifications();
  }, [settings.notifications.enabled]);

  // Listen for alerts from WebSocket
  useEffect(() => {
    const unsubscribe = webSocketService.subscribe('alert', (alertData: AlertType) => {
      setAlerts((prev) => [alertData, ...prev.filter((alert) => alert.id !== alertData.id)]);

      // Send local notification based on alert type
      if (settings.notifications.enabled) {
        switch (alertData.type) {
          case 'error':
            if (settings.notifications.nodeOffline) {
              notificationService.scheduleNodeOfflineAlert(
                alertData.nodeId || 'Unknown Node',
                alertData.nodeId || '',
              );
            }
            break;
          case 'warning':
            if (settings.notifications.lowPerformance) {
              notificationService.scheduleLowPerformanceAlert(
                alertData.nodeId || 'Unknown Node',
                75, // This would come from the alert data
              );
            }
            break;
        }
      }
    });

    return unsubscribe;
  }, [settings.notifications]);

  // Auto-reinvest check
  useEffect(() => {
    if (settings.autoReinvest && totalEarnings > 0) {
      checkAutoReinvest(totalEarnings);
    }
  }, [settings.autoReinvest, totalEarnings, checkAutoReinvest]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshNodes();
      // Clear dismissed alerts on refresh
      setAlerts((prev) => prev.filter((alert) => !alert.dismissed));
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleDismissAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((alert) => (alert.id === alertId ? { ...alert, dismissed: true } : alert)),
    );
  };

  const handleAlertPress = (alert: AlertType) => {
    Alert.alert(alert.title, alert.message, [
      { text: 'Dismiss', onPress: () => handleDismissAlert(alert.id) },
      { text: 'OK' },
    ]);
  };

  if (nodesLoading.isLoading && nodes.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  if (nodesLoading.error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorText}>{nodesLoading.error}</Text>
        <Text style={styles.errorSubtext}>
          Please check your API key in Settings and ensure you have an internet connection.
        </Text>
      </View>
    );
  }

  const activeAlerts = alerts.filter((alert) => !alert.dismissed);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    >
      {/* Connection Status */}
      <View
        style={[styles.connectionStatus, { backgroundColor: isConnected ? '#10B981' : '#EF4444' }]}
      >
        <Text style={styles.connectionText}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </Text>
      </View>

      {/* Alerts */}
      {activeAlerts.map((alert) => (
        <AlertBanner
          key={alert.id}
          alert={alert}
          onDismiss={handleDismissAlert}
          onPress={handleAlertPress}
        />
      ))}

      {/* Stats Overview */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalNodes}</Text>
          <Text style={styles.statLabel}>Total Nodes</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>{onlineNodes}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>{offlineNodes}</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
      </View>

      {/* Earnings Overview */}
      <View style={styles.earningsContainer}>
        <Text style={styles.sectionTitle}>Earnings Overview</Text>
        <View style={styles.earningsCard}>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>{formatCurrency(totalEarnings)}</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text style={styles.earningsLabel}>Today</Text>
            <View style={styles.earningsWithGrowth}>
              <Text style={styles.earningsValue}>{formatCurrency(todayEarnings)}</Text>
              <Text
                style={[
                  styles.growthIndicator,
                  { color: earningsGrowth >= 0 ? '#10B981' : '#EF4444' },
                ]}
              >
                {earningsGrowth >= 0 ? '↗' : '↘'} {formatPercentage(Math.abs(earningsGrowth))}
              </Text>
            </View>
          </View>
          {isReinvesting && (
            <View style={styles.reinvestingIndicator}>
              <ActivityIndicator size="small" color="#10B981" />
              <Text style={styles.reinvestingText}>Auto-reinvesting...</Text>
            </View>
          )}
        </View>
      </View>

      {/* Recent Nodes */}
      <View style={styles.nodesSection}>
        <Text style={styles.sectionTitle}>Recent Nodes</Text>
        {nodes.slice(0, 3).map((node) => (
          <NodeCard
            key={node.id}
            node={node}
            onPress={() => {
              // Navigation to node details would go here
              console.log('Navigate to node details:', node.id);
            }}
          />
        ))}
      </View>

      {/* Auto-reinvest Status */}
      {settings.autoReinvest && (
        <View style={styles.autoReinvestContainer}>
          <Text style={styles.sectionTitle}>Auto-Reinvest</Text>
          <View style={styles.autoReinvestCard}>
            <Text style={styles.autoReinvestStatus}>
              ✅ Enabled - Threshold: {formatCurrency(settings.reinvestThreshold)}
            </Text>
            <Text style={styles.autoReinvestSubtext}>
              Remaining: {formatCurrency(Math.max(0, settings.reinvestThreshold - totalEarnings))}
            </Text>
          </View>
        </View>
      )}
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
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  connectionStatus: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  connectionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  earningsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  earningsCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B981',
  },
  earningsWithGrowth: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  growthIndicator: {
    fontSize: 14,
    fontWeight: '600',
  },
  reinvestingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  reinvestingText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  nodesSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  autoReinvestContainer: {
    padding: 16,
  },
  autoReinvestCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  autoReinvestStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 4,
  },
  autoReinvestSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default DashboardScreen;
