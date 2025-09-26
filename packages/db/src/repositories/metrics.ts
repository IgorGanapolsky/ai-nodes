import { eq, and, or, desc, asc, count, avg, max, sql } from 'drizzle-orm';
import { BaseRepository, QueryResult, FilterOptions, PaginationOptions } from './base';
import { metrics, type Metric, type NewMetric } from '../schema/metrics';

export interface MetricsFilters extends FilterOptions {
  nodeId?: string | string[];
  cpuUsageMin?: number;
  cpuUsageMax?: number;
  memoryUsageMin?: number;
  memoryUsageMax?: number;
  storageUsageMin?: number;
  storageUsageMax?: number;
}

export interface MetricsTimeSeries {
  timestamp: number;
  date: string;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  avgStorageUsage: number;
  avgBandwidthUp: number;
  avgBandwidthDown: number;
  avgNetworkLatency: number;
  count: number;
}

export interface MetricsAggregation {
  nodeId: string;
  avgCpuUsage: number;
  maxCpuUsage: number;
  avgMemoryUsage: number;
  maxMemoryUsage: number;
  avgStorageUsage: number;
  maxStorageUsage: number;
  avgBandwidthUp: number;
  avgBandwidthDown: number;
  avgNetworkLatency: number;
  uptime: number;
  dataPoints: number;
}

export interface PerformanceAlert {
  nodeId: string;
  alertType: 'cpu' | 'memory' | 'storage' | 'network' | 'uptime';
  currentValue: number;
  threshold: number;
  severity: 'warning' | 'critical';
  timestamp: number;
}

export interface NodeHealthScore {
  nodeId: string;
  healthScore: number; // 0-100
  cpuScore: number;
  memoryScore: number;
  storageScore: number;
  networkScore: number;
  uptimeScore: number;
  lastUpdated: number;
}

export class MetricsRepository extends BaseRepository<typeof metrics, Metric, NewMetric> {
  protected table = metrics;

  // Find metrics by node
  async findByNode(
    nodeId: string | string[],
    options: {
      pagination?: PaginationOptions;
      dateRange?: { start: Date; end: Date };
      filters?: Omit<MetricsFilters, 'nodeId'>;
    } = {},
  ): Promise<QueryResult<Metric>> {
    const filters = { ...options.filters, nodeId };

    if (options.dateRange) {
      return this.findByDateRange(
        this.table.timestamp,
        options.dateRange.start,
        options.dateRange.end,
        {
          filters,
          pagination: options.pagination,
          sort: { column: 'timestamp', direction: 'desc' },
        },
      );
    }

    return this.findMany({
      filters,
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Get latest metrics for a node
  async getLatestByNode(nodeId: string): Promise<Metric | null> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(eq(this.table.nodeId, nodeId))
      .orderBy(desc(this.table.timestamp))
      .limit(1);

    return result[0] || null;
  }

  // Get latest metrics for all nodes
  async getLatestForAllNodes(): Promise<Metric[]> {
    const result = await this.db
      .select()
      .from(this.table)
      .where(
        sql`${this.table.timestamp} = (
          SELECT MAX(timestamp)
          FROM ${this.table} AS m2
          WHERE m2.node_id = ${this.table.nodeId}
        )`,
      )
      .orderBy(desc(this.table.timestamp));

    return result;
  }

  // Get time series data for metrics
  async getTimeSeries(
    nodeIds: string | string[],
    interval: 'minute' | 'hour' | 'day',
    startDate: Date,
    endDate: Date,
    metricTypes?: Array<'cpu' | 'memory' | 'storage' | 'network'>,
  ): Promise<MetricsTimeSeries[]> {
    const nodeIdArray = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    // SQL for different intervals
    const intervalSQL = {
      minute: sql`strftime('%Y-%m-%d %H:%M:00', datetime(${this.table.timestamp}, 'unixepoch'))`,
      hour: sql`strftime('%Y-%m-%d %H:00:00', datetime(${this.table.timestamp}, 'unixepoch'))`,
      day: sql`date(${this.table.timestamp}, 'unixepoch')`,
    };

    const timestampSQL = {
      minute: sql`strftime('%s', strftime('%Y-%m-%d %H:%M:00', datetime(${this.table.timestamp}, 'unixepoch')))`,
      hour: sql`strftime('%s', strftime('%Y-%m-%d %H:00:00', datetime(${this.table.timestamp}, 'unixepoch')))`,
      day: sql`strftime('%s', date(${this.table.timestamp}, 'unixepoch'))`,
    };

    const whereClause = and(
      or(...nodeIdArray.map((nodeId) => eq(this.table.nodeId, nodeId))),
      sql`${this.table.timestamp} >= ${startTimestamp}`,
      sql`${this.table.timestamp} <= ${endTimestamp}`,
    );

    const results = await this.db
      .select({
        period: intervalSQL[interval],
        timestamp: timestampSQL[interval],
        avgCpuUsage: avg(this.table.cpuUsage),
        avgMemoryUsage: avg(this.table.memoryUsage),
        avgStorageUsage: avg(this.table.storageUsage),
        avgBandwidthUp: avg(this.table.bandwidthUp),
        avgBandwidthDown: avg(this.table.bandwidthDown),
        avgNetworkLatency: avg(this.table.networkLatency),
        count: count(),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(intervalSQL[interval])
      .orderBy(asc(intervalSQL[interval]));

    return results.map(({ period, timestamp, ...metrics }) => ({
      timestamp: parseInt(timestamp as string),
      date: period as string,
      avgCpuUsage: Number(metrics.avgCpuUsage) || 0,
      avgMemoryUsage: Number(metrics.avgMemoryUsage) || 0,
      avgStorageUsage: Number(metrics.avgStorageUsage) || 0,
      avgBandwidthUp: Number(metrics.avgBandwidthUp) || 0,
      avgBandwidthDown: Number(metrics.avgBandwidthDown) || 0,
      avgNetworkLatency: Number(metrics.avgNetworkLatency) || 0,
      count: metrics.count || 0,
    }));
  }

  // Get aggregated metrics for nodes over a time period
  async getAggregatedMetrics(
    nodeIds: string | string[],
    startDate: Date,
    endDate: Date,
  ): Promise<MetricsAggregation[]> {
    const nodeIdArray = Array.isArray(nodeIds) ? nodeIds : [nodeIds];
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    const whereClause = and(
      or(...nodeIdArray.map((nodeId) => eq(this.table.nodeId, nodeId))),
      sql`${this.table.timestamp} >= ${startTimestamp}`,
      sql`${this.table.timestamp} <= ${endTimestamp}`,
    );

    const results = await this.db
      .select({
        nodeId: this.table.nodeId,
        avgCpuUsage: avg(this.table.cpuUsage),
        maxCpuUsage: max(this.table.cpuUsage),
        avgMemoryUsage: avg(this.table.memoryUsage),
        maxMemoryUsage: max(this.table.memoryUsage),
        avgStorageUsage: avg(this.table.storageUsage),
        maxStorageUsage: max(this.table.storageUsage),
        avgBandwidthUp: avg(this.table.bandwidthUp),
        avgBandwidthDown: avg(this.table.bandwidthDown),
        avgNetworkLatency: avg(this.table.networkLatency),
        maxUptime: max(this.table.uptime),
        dataPoints: count(),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.nodeId);

    return results.map((result) => ({
      nodeId: result.nodeId,
      avgCpuUsage: Number(result.avgCpuUsage) || 0,
      maxCpuUsage: result.maxCpuUsage || 0,
      avgMemoryUsage: Number(result.avgMemoryUsage) || 0,
      maxMemoryUsage: result.maxMemoryUsage || 0,
      avgStorageUsage: Number(result.avgStorageUsage) || 0,
      maxStorageUsage: result.maxStorageUsage || 0,
      avgBandwidthUp: Number(result.avgBandwidthUp) || 0,
      avgBandwidthDown: Number(result.avgBandwidthDown) || 0,
      avgNetworkLatency: Number(result.avgNetworkLatency) || 0,
      uptime: result.maxUptime || 0,
      dataPoints: result.dataPoints || 0,
    }));
  }

  // Detect performance alerts based on thresholds
  async detectPerformanceAlerts(
    thresholds: {
      cpuUsage?: number;
      memoryUsage?: number;
      storageUsage?: number;
      networkLatency?: number;
      uptimeMin?: number;
    } = {},
  ): Promise<PerformanceAlert[]> {
    const defaultThresholds = {
      cpuUsage: 80,
      memoryUsage: 85,
      storageUsage: 90,
      networkLatency: 500,
      uptimeMin: 3600, // 1 hour
      ...thresholds,
    };

    // Get latest metrics for all nodes
    const latestMetrics = await this.getLatestForAllNodes();
    const alerts: PerformanceAlert[] = [];

    for (const metric of latestMetrics) {
      // CPU alerts
      if (metric.cpuUsage && metric.cpuUsage > defaultThresholds.cpuUsage) {
        alerts.push({
          nodeId: metric.nodeId,
          alertType: 'cpu',
          currentValue: metric.cpuUsage,
          threshold: defaultThresholds.cpuUsage,
          severity: metric.cpuUsage > defaultThresholds.cpuUsage * 1.1 ? 'critical' : 'warning',
          timestamp: Math.floor(metric.timestamp.getTime() / 1000),
        });
      }

      // Memory alerts
      if (metric.memoryUsage && metric.memoryUsage > defaultThresholds.memoryUsage) {
        alerts.push({
          nodeId: metric.nodeId,
          alertType: 'memory',
          currentValue: metric.memoryUsage,
          threshold: defaultThresholds.memoryUsage,
          severity:
            metric.memoryUsage > defaultThresholds.memoryUsage * 1.1 ? 'critical' : 'warning',
          timestamp: Math.floor(metric.timestamp.getTime() / 1000),
        });
      }

      // Storage alerts
      if (metric.storageUsage && metric.storageUsage > defaultThresholds.storageUsage) {
        alerts.push({
          nodeId: metric.nodeId,
          alertType: 'storage',
          currentValue: metric.storageUsage,
          threshold: defaultThresholds.storageUsage,
          severity:
            metric.storageUsage > defaultThresholds.storageUsage * 1.05 ? 'critical' : 'warning',
          timestamp: Math.floor(metric.timestamp.getTime() / 1000),
        });
      }

      // Network latency alerts
      if (metric.networkLatency && metric.networkLatency > defaultThresholds.networkLatency) {
        alerts.push({
          nodeId: metric.nodeId,
          alertType: 'network',
          currentValue: metric.networkLatency,
          threshold: defaultThresholds.networkLatency,
          severity:
            metric.networkLatency > defaultThresholds.networkLatency * 2 ? 'critical' : 'warning',
          timestamp: Math.floor(metric.timestamp.getTime() / 1000),
        });
      }

      // Uptime alerts
      if (metric.uptime && metric.uptime < defaultThresholds.uptimeMin) {
        alerts.push({
          nodeId: metric.nodeId,
          alertType: 'uptime',
          currentValue: metric.uptime,
          threshold: defaultThresholds.uptimeMin,
          severity: metric.uptime < defaultThresholds.uptimeMin * 0.5 ? 'critical' : 'warning',
          timestamp: Math.floor(metric.timestamp.getTime() / 1000),
        });
      }
    }

    return alerts;
  }

  // Calculate health scores for nodes
  async calculateHealthScores(nodeIds?: string[]): Promise<NodeHealthScore[]> {
    let nodes: string[];

    if (nodeIds) {
      nodes = nodeIds;
    } else {
      // Get all unique node IDs
      const uniqueNodes = await this.db
        .selectDistinct({ nodeId: this.table.nodeId })
        .from(this.table);
      nodes = uniqueNodes.map((n) => n.nodeId);
    }

    const healthScores: NodeHealthScore[] = [];

    for (const nodeId of nodes) {
      const latestMetric = await this.getLatestByNode(nodeId);

      if (!latestMetric) {
        healthScores.push({
          nodeId,
          healthScore: 0,
          cpuScore: 0,
          memoryScore: 0,
          storageScore: 0,
          networkScore: 0,
          uptimeScore: 0,
          lastUpdated: 0,
        });
        continue;
      }

      // Calculate individual scores (0-100, higher is better)
      const cpuScore = latestMetric.cpuUsage ? Math.max(0, 100 - latestMetric.cpuUsage) : 100;
      const memoryScore = latestMetric.memoryUsage
        ? Math.max(0, 100 - latestMetric.memoryUsage)
        : 100;
      const storageScore = latestMetric.storageUsage
        ? Math.max(0, 100 - latestMetric.storageUsage)
        : 100;

      // Network score based on latency (lower latency = higher score)
      const networkScore = latestMetric.networkLatency
        ? Math.max(0, 100 - Math.min(100, latestMetric.networkLatency / 10))
        : 100;

      // Uptime score (normalize to 24 hours = 100)
      const uptimeScore = latestMetric.uptime
        ? Math.min(100, (latestMetric.uptime / (24 * 3600)) * 100)
        : 0;

      // Overall health score (weighted average)
      const healthScore =
        cpuScore * 0.25 +
        memoryScore * 0.25 +
        storageScore * 0.25 +
        networkScore * 0.15 +
        uptimeScore * 0.1;

      healthScores.push({
        nodeId,
        healthScore: Math.round(healthScore),
        cpuScore: Math.round(cpuScore),
        memoryScore: Math.round(memoryScore),
        storageScore: Math.round(storageScore),
        networkScore: Math.round(networkScore),
        uptimeScore: Math.round(uptimeScore),
        lastUpdated: Math.floor(latestMetric.timestamp.getTime() / 1000),
      });
    }

    return healthScores;
  }

  // Get resource utilization trends
  async getResourceTrends(
    nodeId: string,
    days: number = 7,
  ): Promise<{
    cpu: { trend: 'increasing' | 'decreasing' | 'stable'; change: number };
    memory: { trend: 'increasing' | 'decreasing' | 'stable'; change: number };
    storage: { trend: 'increasing' | 'decreasing' | 'stable'; change: number };
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    const midDate = new Date(endDate.getTime() - (days / 2) * 24 * 60 * 60 * 1000);

    const firstHalf = await this.getAggregatedMetrics([nodeId], startDate, midDate);
    const secondHalf = await this.getAggregatedMetrics([nodeId], midDate, endDate);

    const first = firstHalf[0];
    const second = secondHalf[0];

    const calculateTrend = (oldValue: number, newValue: number) => {
      const change = newValue - oldValue;
      const changePercent = oldValue > 0 ? (change / oldValue) * 100 : 0;

      if (Math.abs(changePercent) < 5) {
        return { trend: 'stable' as const, change: changePercent };
      }
      return {
        trend: changePercent > 0 ? ('increasing' as const) : ('decreasing' as const),
        change: changePercent,
      };
    };

    return {
      cpu: calculateTrend(first?.avgCpuUsage || 0, second?.avgCpuUsage || 0),
      memory: calculateTrend(first?.avgMemoryUsage || 0, second?.avgMemoryUsage || 0),
      storage: calculateTrend(first?.avgStorageUsage || 0, second?.avgStorageUsage || 0),
    };
  }

  // Get metrics summary for dashboard
  async getDashboardSummary(): Promise<{
    totalNodes: number;
    avgCpuUsage: number;
    avgMemoryUsage: number;
    avgStorageUsage: number;
    highCpuNodes: number;
    highMemoryNodes: number;
    highStorageNodes: number;
    lastUpdated: number;
  }> {
    const latestMetrics = await this.getLatestForAllNodes();

    if (latestMetrics.length === 0) {
      return {
        totalNodes: 0,
        avgCpuUsage: 0,
        avgMemoryUsage: 0,
        avgStorageUsage: 0,
        highCpuNodes: 0,
        highMemoryNodes: 0,
        highStorageNodes: 0,
        lastUpdated: 0,
      };
    }

    const totalCpu = latestMetrics.reduce((sum, m) => sum + (m.cpuUsage || 0), 0);
    const totalMemory = latestMetrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0);
    const totalStorage = latestMetrics.reduce((sum, m) => sum + (m.storageUsage || 0), 0);

    const highCpuNodes = latestMetrics.filter((m) => (m.cpuUsage || 0) > 80).length;
    const highMemoryNodes = latestMetrics.filter((m) => (m.memoryUsage || 0) > 85).length;
    const highStorageNodes = latestMetrics.filter((m) => (m.storageUsage || 0) > 90).length;

    const lastUpdated = Math.max(
      ...latestMetrics.map((m) => Math.floor(m.timestamp.getTime() / 1000)),
    );

    return {
      totalNodes: latestMetrics.length,
      avgCpuUsage: totalCpu / latestMetrics.length,
      avgMemoryUsage: totalMemory / latestMetrics.length,
      avgStorageUsage: totalStorage / latestMetrics.length,
      highCpuNodes,
      highMemoryNodes,
      highStorageNodes,
      lastUpdated,
    };
  }

  // Clean up old metrics (data retention)
  async cleanupOldMetrics(retentionDays: number = 90): Promise<number> {
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
    const cutoffTimestamp = Math.floor(cutoffDate.getTime() / 1000);

    const result = await this.db
      .delete(this.table)
      .where(sql`${this.table.timestamp} < ${cutoffTimestamp}`);

    return result.changes;
  }
}
