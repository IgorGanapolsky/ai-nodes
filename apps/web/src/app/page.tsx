'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Activity, Server, AlertTriangle, Zap, TrendingUp, Clock } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MetricsChart } from '@/components/dashboard/metrics-chart';
import { NodesList } from '@/components/dashboard/nodes-list';
import { AlertsList } from '@/components/dashboard/alerts-list';
import { StatsCard } from '@/components/dashboard/stats-card';
import { apiClient } from '@/lib/api-client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function DashboardPage() {
  const [timeframe, setTimeframe] = useState('24h');

  // Fetch dashboard data
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['metrics-summary', timeframe],
    queryFn: () => apiClient.getMetricsSummary(timeframe),
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: ['nodes'],
    queryFn: () => apiClient.getNodes({ limit: 10 }),
    refetchInterval: 30000
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => apiClient.getAlerts({ status: 'active', limit: 5 }),
    refetchInterval: 15000 // More frequent for alerts
  });

  if (summaryLoading || nodesLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor and manage your DePIN nodes from a single interface
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={timeframe === '1h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('1h')}
          >
            1H
          </Button>
          <Button
            variant={timeframe === '24h' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('24h')}
          >
            24H
          </Button>
          <Button
            variant={timeframe === '7d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('7d')}
          >
            7D
          </Button>
          <Button
            variant={timeframe === '30d' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe('30d')}
          >
            30D
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Nodes"
            value={summary.totalNodes.toString()}
            description={`${summary.onlineNodes} online, ${summary.offlineNodes} offline`}
            icon={Server}
            trend={summary.onlineNodes / summary.totalNodes > 0.9 ? 'up' : 'down'}
          />
          <StatsCard
            title="Total Earnings"
            value={`${summary.totalEarnings.toFixed(4)} tokens`}
            description="Last 24 hours"
            icon={Zap}
            trend="up"
            formatAsCurrency
          />
          <StatsCard
            title="Average Uptime"
            value={`${summary.averageUptime.toFixed(1)}%`}
            description="Across all nodes"
            icon={Activity}
            trend={summary.averageUptime > 95 ? 'up' : 'down'}
          />
          <StatsCard
            title="Performance Score"
            value={`${summary.performanceScore.toFixed(0)}/100`}
            description={summary.alertsCount > 0 ? `${summary.alertsCount} active alerts` : 'No alerts'}
            icon={TrendingUp}
            trend={summary.performanceScore > 80 ? 'up' : 'down'}
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Metrics Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Metrics
            </CardTitle>
            <CardDescription>
              Real-time performance data for the last {timeframe}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MetricsChart timeframe={timeframe} />
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
              {alerts && alerts.total > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {alerts.total}
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Recent alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertsList alerts={alerts?.alerts || []} />
          </CardContent>
        </Card>
      </div>

      {/* Nodes List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Recent Nodes
          </CardTitle>
          <CardDescription>
            Overview of your DePIN nodes and their current status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NodesList nodes={nodes?.nodes || []} />
        </CardContent>
      </Card>
    </div>
  );
}