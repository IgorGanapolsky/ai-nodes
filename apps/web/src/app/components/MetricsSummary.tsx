import { Users, Server, Activity, TrendingUp, Zap, AlertTriangle } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercentage } from '@/lib/utils';

export interface SummaryData {
  totalOwners: number;
  activeOwners: number;
  inactiveOwners: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalEarnings: number;
  targetEarnings: number;
  averageUptime: number;
  totalAlerts: number;
  criticalAlerts: number;
  performanceScore: number;
  earningsGrowth: number; // percentage
  uptimeGrowth: number; // percentage
  onPaceOwners: number; // owners meeting their targets
}

interface MetricsSummaryProps {
  data: SummaryData;
}

export function MetricsSummary({ data }: MetricsSummaryProps) {
  const earningsProgress =
    data.targetEarnings > 0 ? (data.totalEarnings / data.targetEarnings) * 100 : 0;
  const activeOwnerPercentage =
    data.totalOwners > 0 ? (data.activeOwners / data.totalOwners) * 100 : 0;
  const deviceOnlinePercentage =
    data.totalDevices > 0 ? (data.onlineDevices / data.totalDevices) * 100 : 0;
  const onPacePercentage = data.totalOwners > 0 ? (data.onPaceOwners / data.totalOwners) * 100 : 0;

  const metrics = [
    {
      title: 'Total Owners',
      value: data.totalOwners.toString(),
      description: `${data.activeOwners} active, ${data.inactiveOwners} inactive`,
      icon: Users,
      trend: data.activeOwners > data.inactiveOwners ? 'up' : 'down',
      progress: activeOwnerPercentage,
      badge:
        activeOwnerPercentage > 80
          ? 'Good'
          : activeOwnerPercentage > 60
            ? 'Fair'
            : 'Needs attention',
      color:
        activeOwnerPercentage > 80
          ? 'text-green-600'
          : activeOwnerPercentage > 60
            ? 'text-yellow-600'
            : 'text-red-600',
    },
    {
      title: 'Device Status',
      value: data.totalDevices.toString(),
      description: `${data.onlineDevices} online, ${data.offlineDevices} offline`,
      icon: Server,
      trend: deviceOnlinePercentage > 90 ? 'up' : 'down',
      progress: deviceOnlinePercentage,
      badge:
        deviceOnlinePercentage > 90
          ? 'Excellent'
          : deviceOnlinePercentage > 75
            ? 'Good'
            : 'Critical',
      color:
        deviceOnlinePercentage > 90
          ? 'text-green-600'
          : deviceOnlinePercentage > 75
            ? 'text-yellow-600'
            : 'text-red-600',
    },
    {
      title: 'Platform Health',
      value: `${data.averageUptime.toFixed(1)}%`,
      description: `${formatPercentage(data.uptimeGrowth, true)} from last period`,
      icon: Activity,
      trend: data.uptimeGrowth >= 0 ? 'up' : 'down',
      progress: data.averageUptime,
      badge: data.averageUptime > 95 ? 'Excellent' : data.averageUptime > 85 ? 'Good' : 'Poor',
      color:
        data.averageUptime > 95
          ? 'text-green-600'
          : data.averageUptime > 85
            ? 'text-yellow-600'
            : 'text-red-600',
    },
    {
      title: 'Earnings Performance',
      value: formatCurrency(data.totalEarnings),
      description: `Target: ${formatCurrency(data.targetEarnings)}`,
      icon: Zap,
      trend: data.earningsGrowth >= 0 ? 'up' : 'down',
      progress: Math.min(earningsProgress, 100),
      badge: earningsProgress >= 95 ? 'On-pace' : earningsProgress >= 80 ? 'Behind' : 'Critical',
      color:
        earningsProgress >= 95
          ? 'text-green-600'
          : earningsProgress >= 80
            ? 'text-yellow-600'
            : 'text-red-600',
      extra: `${formatPercentage(data.earningsGrowth, true)} growth`,
    },
    {
      title: 'Performance Score',
      value: `${data.performanceScore}/100`,
      description: `${data.onPaceOwners} of ${data.totalOwners} owners on-pace`,
      icon: TrendingUp,
      trend: onPacePercentage > 70 ? 'up' : 'down',
      progress: data.performanceScore,
      badge:
        data.performanceScore > 80 ? 'Excellent' : data.performanceScore > 60 ? 'Good' : 'Poor',
      color:
        data.performanceScore > 80
          ? 'text-green-600'
          : data.performanceScore > 60
            ? 'text-yellow-600'
            : 'text-red-600',
    },
    {
      title: 'Active Alerts',
      value: data.totalAlerts.toString(),
      description:
        data.criticalAlerts > 0 ? `${data.criticalAlerts} critical alerts` : 'No critical alerts',
      icon: AlertTriangle,
      trend: data.totalAlerts === 0 ? 'up' : 'down',
      progress: Math.max(0, 100 - data.totalAlerts * 10), // Inverse progress - fewer alerts is better
      badge: data.totalAlerts === 0 ? 'All Clear' : data.criticalAlerts > 0 ? 'Critical' : 'Active',
      color:
        data.totalAlerts === 0
          ? 'text-green-600'
          : data.criticalAlerts > 0
            ? 'text-red-600'
            : 'text-yellow-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
      {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        return (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="space-y-1">
                <CardTitle className="text-sm font-medium leading-none">{metric.title}</CardTitle>
                <CardDescription className="text-xs">{metric.description}</CardDescription>
              </div>
              <div className={`${metric.color} opacity-60`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Main Value */}
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${metric.color}`}>{metric.value}</div>
                <Badge
                  variant={
                    metric.badge === 'Excellent' ||
                    metric.badge === 'On-pace' ||
                    metric.badge === 'All Clear'
                      ? 'default'
                      : metric.badge === 'Critical'
                        ? 'destructive'
                        : 'secondary'
                  }
                  className="text-xs"
                >
                  {metric.badge}
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1">
                <Progress value={metric.progress} className="h-1" />
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{metric.progress.toFixed(0)}%</span>
                  {metric.extra && (
                    <span className={metric.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                      {metric.extra}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
