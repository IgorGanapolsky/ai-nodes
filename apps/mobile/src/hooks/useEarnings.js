import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../utils/api';
import { webSocketService } from '../services/websocket';
export const useEarnings = (nodeId, timeRange = '7d') => {
    const [earnings, setEarnings] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [loading, setLoading] = useState({ isLoading: true, error: null });
    const fetchEarnings = useCallback(async () => {
        setLoading({ isLoading: true, error: null });
        try {
            const response = await apiClient.getEarnings(nodeId, timeRange);
            if (response.success && response.data) {
                setEarnings(response.data);
                // Transform data for charts
                const groupedData = groupEarningsByTime(response.data, timeRange);
                setChartData(groupedData);
            }
            else {
                setLoading({ isLoading: false, error: response.error || 'Failed to fetch earnings' });
            }
        }
        catch (error) {
            setLoading({
                isLoading: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        finally {
            setLoading(prev => ({ ...prev, isLoading: false }));
        }
    }, [nodeId, timeRange]);
    const groupEarningsByTime = (data, range) => {
        const grouped = new Map();
        data.forEach(earning => {
            const date = new Date(earning.timestamp);
            let key;
            switch (range) {
                case '24h':
                    key = date.getHours().toString().padStart(2, '0') + ':00';
                    break;
                case '7d':
                    key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    break;
                case '30d':
                    key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    break;
                default:
                    key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            grouped.set(key, (grouped.get(key) || 0) + earning.amount);
        });
        const sortedEntries = Array.from(grouped.entries()).sort();
        return {
            labels: sortedEntries.map(([label]) => label),
            datasets: [
                {
                    data: sortedEntries.map(([, value]) => value),
                    color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
                    strokeWidth: 2,
                },
            ],
        };
    };
    const refreshEarnings = useCallback(() => {
        fetchEarnings();
    }, [fetchEarnings]);
    // WebSocket real-time updates
    useEffect(() => {
        const unsubscribe = webSocketService.subscribe('earnings_update', (data) => {
            setEarnings(prev => {
                const newEarnings = [...prev, data];
                // Re-transform data for charts
                const groupedData = groupEarningsByTime(newEarnings, timeRange);
                setChartData(groupedData);
                return newEarnings;
            });
        });
        return unsubscribe;
    }, [timeRange]);
    useEffect(() => {
        fetchEarnings();
    }, [fetchEarnings]);
    const totalEarnings = earnings.reduce((sum, earning) => sum + earning.amount, 0);
    const todayEarnings = earnings
        .filter(earning => {
        const earningDate = new Date(earning.timestamp);
        const today = new Date();
        return earningDate.toDateString() === today.toDateString();
    })
        .reduce((sum, earning) => sum + earning.amount, 0);
    const yesterdayEarnings = earnings
        .filter(earning => {
        const earningDate = new Date(earning.timestamp);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return earningDate.toDateString() === yesterday.toDateString();
    })
        .reduce((sum, earning) => sum + earning.amount, 0);
    const earningsGrowth = yesterdayEarnings > 0
        ? ((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100
        : 0;
    return {
        earnings,
        chartData,
        loading,
        totalEarnings,
        todayEarnings,
        yesterdayEarnings,
        earningsGrowth,
        refreshEarnings,
    };
};
