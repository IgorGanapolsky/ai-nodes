'use client';

import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
  ReferenceLine,
} from 'recharts';
import { useState } from 'react';
import { TrendingUp, Activity, Zap, Server } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';

interface UtilizationChartProps {
  ownerId: string;
  timeframe: string;
  isLoading?: boolean;
}

interface ChartDataPoint {
  timestamp: string;
  date: string;
  uptime: number;
  earnings: number;
  targetEarnings: number;
  devices: number;
  onlineDevices: number;
  networkLatency: number;
  cpuUsage: number;
  memoryUsage: number;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.dataKey === 'uptime' && '%'}
            {(entry.dataKey === 'earnings' || entry.dataKey === 'targetEarnings') && ' tokens'}
            {entry.dataKey === 'networkLatency' && 'ms'}
            {(entry.dataKey === 'cpuUsage' || entry.dataKey === 'memoryUsage') && '%'}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function UtilizationChart({ ownerId, timeframe, isLoading }: UtilizationChartProps) {
  const [chartType, setChartType] = useState<'overview' | 'performance' | 'resources'>('overview');

  // Fetch chart data
  const { data: chartData, isLoading: chartLoading } = useQuery({
    queryKey: ['owner-chart-data', ownerId, timeframe],
    queryFn: () => apiClient.getOwnerChartData(ownerId, timeframe),
    refetchInterval: 60000, // Refresh every minute
  });

  const data = chartData?.data || [];

  if (isLoading || chartLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <Activity className="h-8 w-8 mb-2" />
        <p>No utilization data available for the selected timeframe</p>
      </div>
    );
  }

  const averageUptime = data.reduce((acc, point) => acc + point.uptime, 0) / data.length;
  const totalEarnings = data[data.length - 1]?.earnings || 0;
  const targetEarnings = data[data.length - 1]?.targetEarnings || 0;
  const progressPercentage = targetEarnings > 0 ? (totalEarnings / targetEarnings) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageUptime.toFixed(1)}%</div>
            <Badge variant={averageUptime > 95 ? 'default' : 'secondary'} className="mt-1">
              {averageUptime > 95 ? 'Excellent' : averageUptime > 85 ? 'Good' : 'Needs attention'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Earnings Progress</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressPercentage.toFixed(0)}%</div>
            <Badge
              variant={progressPercentage >= 95 ? 'default' : 'secondary'}
              className="mt-1 gap-1"
            >
              <TrendingUp className="h-3 w-3" />
              {progressPercentage >= 95 ? 'On-pace' : 'Behind target'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Devices</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data[data.length - 1]?.onlineDevices || 0}</div>
            <div className="text-xs text-muted-foreground mt-1">
              of {data[data.length - 1]?.devices || 0} total
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs value={chartType} onValueChange={(value: any) => setChartType(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Earnings vs Target</CardTitle>
              <CardDescription>Actual earnings compared to target over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="targetGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--muted-foreground))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--muted-foreground))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickLine={{ stroke: 'hsl(var(--border))' }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="targetEarnings"
                      stackId="1"
                      stroke="hsl(var(--muted-foreground))"
                      fill="url(#targetGradient)"
                      name="Target Earnings"
                    />
                    <Area
                      type="monotone"
                      dataKey="earnings"
                      stackId="2"
                      stroke="hsl(var(--primary))"
                      fill="url(#earningsGradient)"
                      name="Actual Earnings"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Uptime & Device Status</CardTitle>
              <CardDescription>Device uptime and online status over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      yAxisId="uptime"
                      orientation="left"
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      domain={[0, 100]}
                    />
                    <YAxis
                      yAxisId="devices"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <ReferenceLine
                      yAxisId="uptime"
                      y={95}
                      stroke="hsl(var(--destructive))"
                      strokeDasharray="5 5"
                    />
                    <Line
                      yAxisId="uptime"
                      type="monotone"
                      dataKey="uptime"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Uptime %"
                    />
                    <Line
                      yAxisId="devices"
                      type="monotone"
                      dataKey="onlineDevices"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name="Online Devices"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Utilization</CardTitle>
              <CardDescription>CPU, memory usage and network latency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                      dataKey="cpuUsage"
                      fill="hsl(var(--primary))"
                      name="CPU Usage %"
                      radius={[2, 2, 0, 0]}
                    />
                    <Bar
                      dataKey="memoryUsage"
                      fill="hsl(var(--secondary))"
                      name="Memory Usage %"
                      radius={[2, 2, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
