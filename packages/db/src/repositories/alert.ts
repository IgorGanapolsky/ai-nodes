import { eq, and, desc, count, sql, gte, lte } from 'drizzle-orm';
import { BaseRepository, QueryResult, FilterOptions, PaginationOptions } from './base';
import { alerts, type Alert, type NewAlert } from '../schema/alerts';

export interface AlertFilters extends FilterOptions {
  nodeId?: string | string[];
  type?: 'offline' | 'high_cpu' | 'high_memory' | 'low_storage' | 'network_issues' | 'sync_error' | 'earning_drop' | 'security_warning' | 'maintenance_required' | 'custom' | string | string[];
  severity?: 'low' | 'medium' | 'high' | 'critical' | string | string[];
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

export class AlertRepository extends BaseRepository<typeof alerts, Alert, NewAlert> {
  protected table = alerts;

  // Find alerts by node
  async findByNode(
    nodeId: string | string[],
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<AlertFilters, 'nodeId'>;
      includeResolved?: boolean;
    } = {},
  ): Promise<QueryResult<Alert>> {
    const filters = { ...options.filters, nodeId };

    if (!options.includeResolved) {
      (filters as any).resolved = false;
    }

    return this.findMany({
      filters,
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Find unresolved alerts
  async findUnresolved(
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<AlertFilters, 'resolved'>;
    } = {},
  ): Promise<QueryResult<Alert>> {
    return this.findMany({
      filters: { ...options.filters, resolved: false },
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Find alerts by severity
  async findBySeverity(
    severity: string | string[],
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<AlertFilters, 'severity'>;
    } = {},
  ): Promise<QueryResult<Alert>> {
    return this.findMany({
      filters: { ...options.filters, severity },
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Find critical alerts
  async findCritical(
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<AlertFilters, 'severity'>;
    } = {},
  ): Promise<QueryResult<Alert>> {
    return this.findBySeverity('critical', options);
  }

  // Create alert with automatic notification flagging
  async createAlert(
    alertData: Omit<NewAlert, 'id' | 'timestamp' | 'createdAt' | 'updatedAt'>,
  ): Promise<Alert> {
    const newAlert: NewAlert = {
      ...alertData,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.create(newAlert);
  }

  // Resolve alert
  async resolveAlert(alertId: string, resolvedBy?: string): Promise<Alert | null> {
    return this.update(alertId, {
      resolved: true,
      resolvedAt: new Date(),
      resolvedBy,
      updatedAt: new Date(),
    });
  }

  // Acknowledge alert
  async acknowledgeAlert(alertId: string, acknowledgedBy?: string): Promise<Alert | null> {
    return this.update(alertId, {
      acknowledgedAt: new Date(),
      acknowledgedBy,
      updatedAt: new Date(),
    });
  }

  // Bulk resolve alerts
  async bulkResolveAlerts(alertIds: string[], resolvedBy?: string): Promise<number> {
    let resolvedCount = 0;

    for (const alertId of alertIds) {
      const result = await this.resolveAlert(alertId, resolvedBy);
      if (result) {resolvedCount++;}
    }

    return resolvedCount;
  }

  // Mark notifications as sent
  async markNotificationSent(alertId: string, channels: string[]): Promise<Alert | null> {
    return this.update(alertId, {
      notificationSent: true,
      notificationChannels: JSON.stringify(channels),
      updatedAt: new Date(),
    });
  }

  // Get alert statistics
  async getAlertStats(filters: Omit<AlertFilters, 'resolved'> = {}): Promise<AlertStats> {
    const whereConditions: any[] = [];

    // Simplified filtering for now - complex array filtering commented out due to type issues
    // TODO: Fix advanced filtering with proper Drizzle ORM types
    if (filters.nodeId && !Array.isArray(filters.nodeId)) {
      whereConditions.push(eq(this.table.nodeId, filters.nodeId));
    }
    if (filters.type && !Array.isArray(filters.type)) {
      whereConditions.push(eq(this.table.type, filters.type as any));
    }
    if (filters.severity && !Array.isArray(filters.severity)) {
      whereConditions.push(eq(this.table.severity, filters.severity as any));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get total count
    const totalResult = await this.db
      .select({ count: count() })
      .from(this.table)
      .where(whereClause || undefined);

    // Get unresolved count
    const unresolvedResult = await this.db
      .select({ count: count() })
      .from(this.table)
      .where(whereClause ? and(whereClause, eq(this.table.resolved, false)) : eq(this.table.resolved, false));

    // Get severity breakdown
    const severityResult = await this.db
      .select({
        severity: this.table.severity,
        count: count(),
      })
      .from(this.table)
      .where(whereClause ? and(whereClause, eq(this.table.resolved, false)) : eq(this.table.resolved, false))
      .groupBy(this.table.severity);

    // Get type breakdown
    const typeResult = await this.db
      .select({
        type: this.table.type,
        count: count(),
      })
      .from(this.table)
      .where(whereClause ? and(whereClause, eq(this.table.resolved, false)) : eq(this.table.resolved, false))
      .groupBy(this.table.type);

    // Get node breakdown
    const nodeResult = await this.db
      .select({
        nodeId: this.table.nodeId,
        count: count(),
      })
      .from(this.table)
      .where(whereClause ? and(whereClause, eq(this.table.resolved, false)) : eq(this.table.resolved, false))
      .groupBy(this.table.nodeId);

    const total = totalResult[0]?.count || 0;
    const unresolved = unresolvedResult[0]?.count || 0;

    const severityBreakdown = severityResult.reduce(
      (acc, { severity, count }) => {
        acc[severity] = count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      total,
      unresolved,
      critical: severityBreakdown.critical || 0,
      high: severityBreakdown.high || 0,
      medium: severityBreakdown.medium || 0,
      low: severityBreakdown.low || 0,
      byType: typeResult.reduce(
        (acc, { type, count }) => {
          acc[type] = count;
          return acc;
        },
        {} as Record<string, number>,
      ),
      byNode: nodeResult.reduce(
        (acc, { nodeId, count }) => {
          acc[nodeId] = count;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  // Get recent alerts
  async getRecentAlerts(
    hours: number = 24,
    options: {
      pagination?: PaginationOptions;
      filters?: AlertFilters;
    } = {},
  ): Promise<QueryResult<Alert>> {
    const cutoffDate = new Date(Date.now() - hours * 60 * 60 * 1000);

    const { pagination } = options;

    const whereConditions: any[] = [gte(this.table.timestamp, cutoffDate)];

    // Simplified filtering for now - complex array filtering commented out due to type issues
    // TODO: Fix advanced filtering with proper Drizzle ORM types
    if (options.filters?.nodeId && !Array.isArray(options.filters.nodeId)) {
      whereConditions.push(eq(this.table.nodeId, options.filters.nodeId));
    }
    if (options.filters?.type && !Array.isArray(options.filters.type)) {
      whereConditions.push(eq(this.table.type, options.filters.type as any));
    }
    if (options.filters?.severity && !Array.isArray(options.filters.severity)) {
      whereConditions.push(eq(this.table.severity, options.filters.severity as any));
    }
    if (options.filters?.resolved !== undefined) {
      whereConditions.push(eq(this.table.resolved, options.filters.resolved));
    }

    const whereClause = and(...whereConditions);
    const limit = pagination?.limit || 50;
    const offset = pagination?.offset || 0;

    const data = await this.db
      .select()
      .from(this.table)
      .where(whereClause)
      .orderBy(desc(this.table.timestamp))
      .limit(limit)
      .offset(offset);

    const totalResult = await this.db
      .select({ count: count() })
      .from(this.table)
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    return {
      data,
      total,
      page: pagination?.page || 1,
      limit,
      hasMore: offset + data.length < total,
    };
  }

  // Get alert trends
  async getAlertTrends(
    days: number = 7,
  ): Promise<
    Array<{ date: string; total: number; critical: number; high: number; resolved: number }>
  > {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const results = await this.db
      .select({
        date: sql<string>`date(${this.table.timestamp}, 'unixepoch')`,
        total: count(),
        critical: sql<number>`SUM(CASE WHEN ${this.table.severity} = 'critical' THEN 1 ELSE 0 END)`,
        high: sql<number>`SUM(CASE WHEN ${this.table.severity} = 'high' THEN 1 ELSE 0 END)`,
        resolved: sql<number>`SUM(CASE WHEN ${this.table.resolved} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(this.table)
      .where(
        and(
          gte(this.table.timestamp, startDate),
          lte(this.table.timestamp, endDate),
        ),
      )
      .groupBy(sql`date(${this.table.timestamp}, 'unixepoch')`)
      .orderBy(sql`date(${this.table.timestamp}, 'unixepoch')`);

    return results.map((result) => ({
      date: result.date,
      total: result.total || 0,
      critical: result.critical || 0,
      high: result.high || 0,
      resolved: result.resolved || 0,
    }));
  }

  // Auto-resolve alerts based on conditions
  async autoResolveStaleAlerts(
    staleHours: number = 48,
    resolvedBy: string = 'system',
  ): Promise<number> {
    const cutoffDate = new Date(Date.now() - staleHours * 60 * 60 * 1000);

    // Find old unresolved alerts
    const staleAlerts = await this.db
      .select({ id: this.table.id })
      .from(this.table)
      .where(
        and(eq(this.table.resolved, false), lte(this.table.timestamp, cutoffDate)),
      );

    const alertIds = staleAlerts.map((alert) => alert.id);
    return this.bulkResolveAlerts(alertIds, resolvedBy);
  }

  // Get alerts requiring notification
  async getAlertsRequiringNotification(): Promise<Alert[]> {
    return this.db
      .select()
      .from(this.table)
      .where(and(eq(this.table.resolved, false), eq(this.table.notificationSent, false)))
      .orderBy(desc(this.table.severity), desc(this.table.timestamp));
  }

  // Find duplicate alerts (same type and node within time window)
  async findDuplicateAlerts(
    nodeId: string,
    type: string,
    windowMinutes: number = 30,
  ): Promise<Alert[]> {
    const cutoffDate = new Date(Date.now() - windowMinutes * 60 * 1000);

    return this.db
      .select()
      .from(this.table)
      .where(
        and(
          eq(this.table.nodeId, nodeId),
          eq(this.table.type, type as any),
          eq(this.table.resolved, false),
          gte(this.table.timestamp, cutoffDate),
        ),
      )
      .orderBy(desc(this.table.timestamp));
  }
}
