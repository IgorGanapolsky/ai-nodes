import { BaseRepository, QueryResult, FilterOptions, PaginationOptions } from './base';
import { alerts, type Alert, type NewAlert } from '../schema/alerts';
export interface AlertFilters extends FilterOptions {
  nodeId?: string | string[];
  type?: string | string[];
  severity?: string | string[];
  resolved?: boolean;
}
export interface AlertStats {
  total: number;
  unresolved: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<string, number>;
  byNode: Record<string, number>;
}
export declare class AlertRepository extends BaseRepository<typeof alerts, Alert, NewAlert> {
  protected table: any;
  findByNode(
    nodeId: string | string[],
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<AlertFilters, 'nodeId'>;
      includeResolved?: boolean;
    },
  ): Promise<QueryResult<Alert>>;
  findUnresolved(options?: {
    pagination?: PaginationOptions;
    filters?: Omit<AlertFilters, 'resolved'>;
  }): Promise<QueryResult<Alert>>;
  findBySeverity(
    severity: string | string[],
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<AlertFilters, 'severity'>;
    },
  ): Promise<QueryResult<Alert>>;
  findCritical(options?: {
    pagination?: PaginationOptions;
    filters?: Omit<AlertFilters, 'severity'>;
  }): Promise<QueryResult<Alert>>;
  createAlert(
    alertData: Omit<NewAlert, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>,
  ): Promise<Alert>;
  resolveAlert(alertId: string, resolvedBy?: string): Promise<Alert | null>;
  acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<Alert | null>;
  bulkResolveAlerts(alertIds: string[], resolvedBy?: string): Promise<number>;
  markNotificationSent(alertId: string, channels: string[]): Promise<Alert | null>;
  getAlertStats(filters?: Omit<AlertFilters, 'resolved'>): Promise<AlertStats>;
  getRecentAlerts(
    hours?: number,
    options?: {
      pagination?: PaginationOptions;
      filters?: AlertFilters;
    },
  ): Promise<QueryResult<Alert>>;
  getAlertTrends(days?: number): Promise<
    Array<{
      date: string;
      total: number;
      critical: number;
      high: number;
      resolved: number;
    }>
  >;
  autoResolveStaleAlerts(staleHours?: number, resolvedBy?: string): Promise<number>;
  getAlertsRequiringNotification(): Promise<Alert[]>;
  findDuplicateAlerts(nodeId: string, type: string, windowMinutes?: number): Promise<Alert[]>;
}
//# sourceMappingURL=alert.d.ts.map
