'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Info,
  Zap,
  Server,
  Activity,
  MoreVertical,
  Eye,
  EyeOff,
  TrendingUp,
  Shield,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatDate } from '@/lib/utils';

export interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  category: 'uptime' | 'performance' | 'earnings' | 'security' | 'system';
  title: string;
  message: string;
  deviceId?: string;
  deviceName?: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
}

interface AlertsListProps {
  alerts: Alert[];
  isLoading?: boolean;
  showActions?: boolean;
  limit?: number;
  onAcknowledge?: (alertId: string) => Promise<void>;
  onResolve?: (alertId: string) => Promise<void>;
}

// Alert type icons
const getAlertIcon = (category: Alert['category']) => {
  switch (category) {
    case 'uptime':
      return Activity;
    case 'performance':
      return TrendingUp;
    case 'earnings':
      return Zap;
    case 'security':
      return Shield;
    case 'system':
      return Server;
    default:
      return AlertTriangle;
  }
};

// Alert type colors
const getAlertColor = (type: Alert['type'], severity: Alert['severity']) => {
  if (severity === 'critical') return 'text-red-600 dark:text-red-400';
  if (type === 'critical') return 'text-red-600 dark:text-red-400';
  if (type === 'warning') return 'text-yellow-600 dark:text-yellow-400';
  return 'text-blue-600 dark:text-blue-400';
};

const getBadgeVariant = (
  type: Alert['type'],
  severity: Alert['severity'],
): 'default' | 'secondary' | 'destructive' => {
  if (severity === 'critical' || type === 'critical') return 'destructive';
  if (type === 'warning') return 'default';
  return 'secondary';
};

export function AlertsList({
  alerts,
  isLoading,
  showActions = false,
  limit,
  onAcknowledge,
  onResolve,
}: AlertsListProps) {
  const [loadingActions, setLoadingActions] = useState<Set<string>>(new Set());

  const displayAlerts = limit ? alerts.slice(0, limit) : alerts;

  const handleAcknowledge = async (alertId: string) => {
    if (!onAcknowledge) return;

    setLoadingActions((prev) => new Set(prev).add(alertId));
    try {
      await onAcknowledge(alertId);
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  const handleResolve = async (alertId: string) => {
    if (!onResolve) return;

    setLoadingActions((prev) => new Set(prev).add(alertId));
    try {
      await onResolve(alertId);
    } finally {
      setLoadingActions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (!displayAlerts.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <CheckCircle className="h-8 w-8 mb-2 text-green-500" />
        <p className="font-medium">All clear!</p>
        <p className="text-sm">No active alerts at this time</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {displayAlerts.map((alert) => {
        const IconComponent = getAlertIcon(alert.category);
        const colorClass = getAlertColor(alert.type, alert.severity);
        const isActionLoading = loadingActions.has(alert.id);

        return (
          <Card
            key={alert.id}
            className={`transition-all duration-200 ${
              alert.resolved
                ? 'opacity-60 bg-muted/30'
                : alert.acknowledged
                  ? 'border-l-4 border-l-blue-500'
                  : alert.severity === 'critical'
                    ? 'border-l-4 border-l-red-500'
                    : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  {/* Icon */}
                  <div className={`flex-shrink-0 ${colorClass}`}>
                    <IconComponent className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {alert.title}
                      </h4>
                      <Badge variant={getBadgeVariant(alert.type, alert.severity)}>
                        {alert.severity}
                      </Badge>
                      {alert.acknowledged && (
                        <Badge variant="secondary" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Acknowledged
                        </Badge>
                      )}
                      {alert.resolved && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Resolved
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                      {alert.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(alert.timestamp)}
                      </div>
                      {alert.deviceName && (
                        <div className="flex items-center gap-1">
                          <Server className="h-3 w-3" />
                          {alert.deviceName}
                        </div>
                      )}
                      <div className="capitalize">{alert.category}</div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                {showActions && !alert.resolved && (
                  <div className="flex items-center gap-2">
                    {!alert.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={isActionLoading}
                        className="h-8"
                      >
                        {isActionLoading ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          disabled={isActionLoading}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!alert.acknowledged && (
                          <DropdownMenuItem
                            onClick={() => handleAcknowledge(alert.id)}
                            className="cursor-pointer"
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Acknowledge
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleResolve(alert.id)}
                          className="cursor-pointer"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Mark as Resolved
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                          <Info className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {limit && alerts.length > limit && (
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Showing {limit} of {alerts.length} alerts
          </p>
          <Button variant="outline" size="sm" className="mt-2">
            View All Alerts
          </Button>
        </div>
      )}
    </div>
  );
}

// Export individual Alert types for reuse
export { type Alert };
