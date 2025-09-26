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
export declare function AlertsList({
  alerts,
  isLoading,
  showActions,
  limit,
  onAcknowledge,
  onResolve,
}: AlertsListProps): any;
export { type Alert };
//# sourceMappingURL=AlertsList.d.ts.map
