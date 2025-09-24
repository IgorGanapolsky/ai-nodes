import { BaseRepository, QueryResult, FilterOptions, PaginationOptions } from './base';
import { earnings, type Earning, type NewEarning } from '../schema/earnings';
export interface EarningsFilters extends FilterOptions {
    nodeId?: string | string[];
    currency?: string;
    earningType?: string | string[];
    isPaid?: boolean;
    cryptoCurrency?: string;
}
export interface EarningsReport {
    totalEarnings: number;
    totalUnpaid: number;
    totalPaid: number;
    earningsCount: number;
    averageEarning: number;
    byCurrency: Record<string, {
        total: number;
        count: number;
        average: number;
    }>;
    byType: Record<string, {
        total: number;
        count: number;
        average: number;
    }>;
    byNode: Record<string, {
        total: number;
        count: number;
        average: number;
    }>;
}
export interface TimeSeriesPoint {
    timestamp: number;
    date: string;
    totalEarnings: number;
    count: number;
    averageEarning: number;
}
export interface EarningsSummary {
    period: string;
    totalAmount: number;
    transactionCount: number;
    averageAmount: number;
    currency: string;
}
export declare class EarningsRepository extends BaseRepository<typeof earnings, Earning, NewEarning> {
    protected table: any;
    findByNode(nodeId: string | string[], options?: {
        pagination?: PaginationOptions;
        filters?: Omit<EarningsFilters, 'nodeId'>;
        dateRange?: {
            start: Date;
            end: Date;
        };
    }): Promise<QueryResult<Earning>>;
    findUnpaid(options?: {
        pagination?: PaginationOptions;
        filters?: Omit<EarningsFilters, 'isPaid'>;
    }): Promise<QueryResult<Earning>>;
    findByDateRange(startDate: Date, endDate: Date, options?: {
        pagination?: PaginationOptions;
        filters?: EarningsFilters;
    }): Promise<QueryResult<Earning>>;
    markAsPaid(earningIds: string[], transactionHash?: string): Promise<number>;
    getEarningsReport(filters?: EarningsFilters, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<EarningsReport>;
    getTimeSeries(interval: 'hour' | 'day' | 'week' | 'month', startDate: Date, endDate: Date, filters?: EarningsFilters): Promise<TimeSeriesPoint[]>;
    getSummaryByPeriod(period: 'today' | 'week' | 'month' | 'year', currency?: string, filters?: Omit<EarningsFilters, 'currency'>): Promise<EarningsSummary>;
    getTopEarningNodes(limit?: number, dateRange?: {
        start: Date;
        end: Date;
    }, currency?: string): Promise<Array<{
        nodeId: string;
        totalEarnings: number;
        earningsCount: number;
        averageEarning: number;
    }>>;
    getProjectedEarnings(nodeId: string, days?: number, projectionDays?: number): Promise<{
        dailyAverage: number;
        projectedTotal: number;
        confidence: number;
    }>;
}
//# sourceMappingURL=earnings.d.ts.map