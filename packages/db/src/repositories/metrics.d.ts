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
    healthScore: number;
    cpuScore: number;
    memoryScore: number;
    storageScore: number;
    networkScore: number;
    uptimeScore: number;
    lastUpdated: number;
}
export declare class MetricsRepository extends BaseRepository<typeof metrics, Metric, NewMetric> {
    protected table: any;
    findByNode(nodeId: string | string[], options?: {
        pagination?: PaginationOptions;
        dateRange?: {
            start: Date;
            end: Date;
        };
        filters?: Omit<MetricsFilters, 'nodeId'>;
    }): Promise<QueryResult<Metric>>;
    getLatestByNode(nodeId: string): Promise<Metric | null>;
    getLatestForAllNodes(): Promise<Metric[]>;
    getTimeSeries(nodeIds: string | string[], interval: 'minute' | 'hour' | 'day', startDate: Date, endDate: Date, metricTypes?: Array<'cpu' | 'memory' | 'storage' | 'network'>): Promise<MetricsTimeSeries[]>;
    getAggregatedMetrics(nodeIds: string | string[], startDate: Date, endDate: Date): Promise<MetricsAggregation[]>;
    detectPerformanceAlerts(thresholds?: {
        cpuUsage?: number;
        memoryUsage?: number;
        storageUsage?: number;
        networkLatency?: number;
        uptimeMin?: number;
    }): Promise<PerformanceAlert[]>;
    calculateHealthScores(nodeIds?: string[]): Promise<NodeHealthScore[]>;
    getResourceTrends(nodeId: string, days?: number): Promise<{
        cpu: {
            trend: 'increasing' | 'decreasing' | 'stable';
            change: number;
        };
        memory: {
            trend: 'increasing' | 'decreasing' | 'stable';
            change: number;
        };
        storage: {
            trend: 'increasing' | 'decreasing' | 'stable';
            change: number;
        };
    }>;
    getDashboardSummary(): Promise<{
        totalNodes: number;
        avgCpuUsage: number;
        avgMemoryUsage: number;
        avgStorageUsage: number;
        highCpuNodes: number;
        highMemoryNodes: number;
        highStorageNodes: number;
        lastUpdated: number;
    }>;
    cleanupOldMetrics(retentionDays?: number): Promise<number>;
}
//# sourceMappingURL=metrics.d.ts.map