'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Wallet,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Server,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeviceTable } from '@/app/components/DeviceTable';
import { UtilizationChart } from '@/app/components/UtilizationChart';
import { AlertsList } from '@/app/components/AlertsList';
import { StatementDownload } from '@/app/components/StatementDownload';
import { apiClient } from '@/lib/api-client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatCurrency } from '@/lib/utils';
export default function OwnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const ownerId = params.id;
  const [timeframe, setTimeframe] = useState('30d');
  // Fetch owner data
  const { data: owner, isLoading: ownerLoading } = useQuery({
    queryKey: ['owner', ownerId],
    queryFn: () => apiClient.getOwner(ownerId),
    refetchInterval: 30000,
  });
  // Fetch owner devices
  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ['owner-devices', ownerId],
    queryFn: () => apiClient.getOwnerDevices(ownerId),
    refetchInterval: 30000,
  });
  // Fetch owner metrics
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['owner-metrics', ownerId, timeframe],
    queryFn: () => apiClient.getOwnerMetrics(ownerId, timeframe),
    refetchInterval: 30000,
  });
  // Fetch owner alerts
  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['owner-alerts', ownerId],
    queryFn: () => apiClient.getOwnerAlerts(ownerId, { status: 'active' }),
    refetchInterval: 15000,
  });
  if (ownerLoading || !owner) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  // Calculate on-pace status
  const isOnPace = metrics && metrics.actualEarnings >= metrics.targetEarnings * 0.95;
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{owner.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {owner.email}
              </div>
              <div className="flex items-center gap-1">
                <Wallet className="h-4 w-4" />
                {owner.walletAddress?.slice(0, 8)}...{owner.walletAddress?.slice(-6)}
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Joined {new Date(owner.joinedAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnPace !== undefined && (
            <Badge variant={isOnPace ? 'default' : 'secondary'} className="gap-1">
              <TrendingUp className="h-3 w-3" />
              {isOnPace ? 'On-pace' : 'Behind target'}
            </Badge>
          )}
          <Badge variant={owner.status === 'active' ? 'default' : 'secondary'}>
            {owner.status}
          </Badge>
          <StatementDownload ownerId={ownerId} ownerName={owner.name} />
        </div>
      </div>

      {/* Summary Cards */}
      {metrics && !metricsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Devices</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalDevices}</div>
              <p className="text-xs text-muted-foreground">
                {metrics.onlineDevices} online, {metrics.offlineDevices} offline
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(metrics.totalEarnings)}</div>
              <p className="text-xs text-muted-foreground">
                Target: {formatCurrency(metrics.targetEarnings)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.averageUptime.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Across all devices</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {alerts?.total === 0 ? 'No active alerts' : 'Requires attention'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Timeframe Selector */}
          <div className="flex justify-end">
            <div className="flex gap-2">
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
              <Button
                variant={timeframe === '90d' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeframe('90d')}
              >
                90D
              </Button>
            </div>
          </div>

          {/* Utilization Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Device Utilization</CardTitle>
              <CardDescription>Performance metrics over the last {timeframe}</CardDescription>
            </CardHeader>
            <CardContent>
              <UtilizationChart
                ownerId={ownerId}
                timeframe={timeframe}
                isLoading={metricsLoading}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Devices</CardTitle>
              <CardDescription>Complete list of devices owned by {owner.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <DeviceTable devices={devices?.devices || []} isLoading={devicesLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Alerts</CardTitle>
              <CardDescription>Current alerts and notifications for {owner.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <AlertsList alerts={alerts?.alerts || []} isLoading={alertsLoading} showActions />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Financial Statements</CardTitle>
              <CardDescription>Download earnings statements and financial reports</CardDescription>
            </CardHeader>
            <CardContent>
              <StatementDownload ownerId={ownerId} ownerName={owner.name} showHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
