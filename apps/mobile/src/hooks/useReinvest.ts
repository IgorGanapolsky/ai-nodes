import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';
import { webSocketService } from '../services/websocket';
import { notificationService } from '../services/notifications';
import { useSettings } from './useSettings';

export const useReinvest = () => {
  const [isReinvesting, setIsReinvesting] = useState(false);
  const [lastReinvestAmount, setLastReinvestAmount] = useState<number | null>(null);
  const [reinvestHistory, setReinvestHistory] = useState<
    Array<{
      amount: number;
      timestamp: string;
      status: 'success' | 'failed';
    }>
  >([]);
  const { settings } = useSettings();

  const triggerReinvest = useCallback(async () => {
    if (isReinvesting) {return { success: false, error: 'Reinvest already in progress' };}

    setIsReinvesting(true);

    try {
      const response = await apiClient.triggerReinvest();

      if (response.success && response.data) {
        const { amount, status } = response.data;
        setLastReinvestAmount(amount);

        // Add to history
        const reinvestRecord = {
          amount,
          timestamp: new Date().toISOString(),
          status: status === 'success' ? ('success' as const) : ('failed' as const),
        };
        setReinvestHistory((prev) => [reinvestRecord, ...prev]);

        // Send notification
        if (status === 'success') {
          await notificationService.scheduleReinvestComplete(amount);
        }

        return { success: true, data: response.data };
      } else {
        // Add failed record
        const reinvestRecord = {
          amount: 0,
          timestamp: new Date().toISOString(),
          status: 'failed' as const,
        };
        setReinvestHistory((prev) => [reinvestRecord, ...prev]);

        return { success: false, error: response.error };
      }
    } catch (error) {
      // Add failed record
      const reinvestRecord = {
        amount: 0,
        timestamp: new Date().toISOString(),
        status: 'failed' as const,
      };
      setReinvestHistory((prev) => [reinvestRecord, ...prev]);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reinvest failed',
      };
    } finally {
      setIsReinvesting(false);
    }
  }, [isReinvesting]);

  const checkAutoReinvest = useCallback(
    async (currentEarnings: number) => {
      if (!settings.autoReinvest || isReinvesting) {return;}

      if (currentEarnings >= settings.reinvestThreshold) {
        console.log(
          `Auto-reinvest triggered: $${currentEarnings} >= $${settings.reinvestThreshold}`,
        );

        // Send notification about auto-reinvest
        await notificationService.scheduleLocalNotification(
          'Auto-Reinvest Triggered',
          `Earnings threshold reached ($${settings.reinvestThreshold}). Starting auto-reinvest...`,
        );

        await triggerReinvest();
      }
    },
    [settings.autoReinvest, settings.reinvestThreshold, isReinvesting, triggerReinvest],
  );

  // Listen for reinvest completion from WebSocket
  useEffect(() => {
    const unsubscribe = webSocketService.subscribe(
      'reinvest_complete',
      (data: { amount: number; status: string; timestamp: string }) => {
        setLastReinvestAmount(data.amount);
        setIsReinvesting(false);

        const reinvestRecord = {
          amount: data.amount,
          timestamp: data.timestamp,
          status: data.status === 'success' ? ('success' as const) : ('failed' as const),
        };
        setReinvestHistory((prev) => [reinvestRecord, ...prev]);

        // Send notification
        if (data.status === 'success') {
          notificationService.scheduleReinvestComplete(data.amount);
        }
      },
    );

    return unsubscribe;
  }, []);

  const totalReinvested = reinvestHistory
    .filter((record) => record.status === 'success')
    .reduce((sum, record) => sum + record.amount, 0);

  const successfulReinvests = reinvestHistory.filter(
    (record) => record.status === 'success',
  ).length;
  const failedReinvests = reinvestHistory.filter((record) => record.status === 'failed').length;

  return {
    isReinvesting,
    lastReinvestAmount,
    reinvestHistory,
    totalReinvested,
    successfulReinvests,
    failedReinvests,
    triggerReinvest,
    checkAutoReinvest,
  };
};
