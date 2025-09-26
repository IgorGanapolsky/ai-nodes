import { eq, and, or, desc, asc, count, sum, avg, gte, lte, sql } from 'drizzle-orm';
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
  byCurrency: Record<string, { total: number; count: number; average: number }>;
  byType: Record<string, { total: number; count: number; average: number }>;
  byNode: Record<string, { total: number; count: number; average: number }>;
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

export class EarningsRepository extends BaseRepository<typeof earnings, Earning, NewEarning> {
  protected table = earnings;

  // Find earnings by node
  async findByNode(
    nodeId: string | string[],
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<EarningsFilters, 'nodeId'>;
      dateRange?: { start: Date; end: Date };
    } = {},
  ): Promise<QueryResult<Earning>> {
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

  // Find unpaid earnings
  async findUnpaid(
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<EarningsFilters, 'isPaid'>;
    } = {},
  ): Promise<QueryResult<Earning>> {
    return this.findMany({
      filters: { ...options.filters, isPaid: false },
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Find earnings by date range
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    options: {
      pagination?: PaginationOptions;
      filters?: EarningsFilters;
    } = {},
  ): Promise<QueryResult<Earning>> {
    return super.findByDateRange(this.table.timestamp, startDate, endDate, {
      ...options,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Mark earnings as paid
  async markAsPaid(earningIds: string[], transactionHash?: string): Promise<number> {
    const updateData: Partial<NewEarning> = {
      isPaid: true,
      paidAt: new Date(),
    };

    if (transactionHash) {
      updateData.transactionHash = transactionHash;
    }

    let updatedCount = 0;
    for (const earningId of earningIds) {
      const result = await this.update(earningId, updateData);
      if (result) updatedCount++;
    }

    return updatedCount;
  }

  // Get earnings statistics
  async getEarningsReport(
    filters: EarningsFilters = {},
    dateRange?: { start: Date; end: Date },
  ): Promise<EarningsReport> {
    let whereConditions = [];

    // Apply filters
    if (filters.nodeId) {
      if (Array.isArray(filters.nodeId)) {
        whereConditions.push(or(...filters.nodeId.map((id) => eq(this.table.nodeId, id))));
      } else {
        whereConditions.push(eq(this.table.nodeId, filters.nodeId));
      }
    }
    if (filters.currency) {
      whereConditions.push(eq(this.table.currency, filters.currency));
    }
    if (filters.earningType) {
      if (Array.isArray(filters.earningType)) {
        whereConditions.push(
          or(...filters.earningType.map((type) => eq(this.table.earningType, type))),
        );
      } else {
        whereConditions.push(eq(this.table.earningType, filters.earningType));
      }
    }
    if (filters.isPaid !== undefined) {
      whereConditions.push(eq(this.table.isPaid, filters.isPaid));
    }

    // Apply date range
    if (dateRange) {
      const startTimestamp = Math.floor(dateRange.start.getTime() / 1000);
      const endTimestamp = Math.floor(dateRange.end.getTime() / 1000);
      whereConditions.push(
        and(gte(this.table.timestamp, startTimestamp), lte(this.table.timestamp, endTimestamp)),
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get overall statistics
    const [totalStats, unpaidStats, paidStats] = await Promise.all([
      this.db
        .select({
          total: sum(this.table.amount),
          count: count(),
          average: avg(this.table.amount),
        })
        .from(this.table)
        .where(whereClause),
      this.db
        .select({
          total: sum(this.table.amount),
        })
        .from(this.table)
        .where(
          whereClause
            ? and(whereClause, eq(this.table.isPaid, false))
            : eq(this.table.isPaid, false),
        ),
      this.db
        .select({
          total: sum(this.table.amount),
        })
        .from(this.table)
        .where(
          whereClause ? and(whereClause, eq(this.table.isPaid, true)) : eq(this.table.isPaid, true),
        ),
    ]);

    // Get breakdown by currency
    const currencyStats = await this.db
      .select({
        currency: this.table.currency,
        total: sum(this.table.amount),
        count: count(),
        average: avg(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.currency);

    // Get breakdown by type
    const typeStats = await this.db
      .select({
        type: this.table.earningType,
        total: sum(this.table.amount),
        count: count(),
        average: avg(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.earningType);

    // Get breakdown by node
    const nodeStats = await this.db
      .select({
        nodeId: this.table.nodeId,
        total: sum(this.table.amount),
        count: count(),
        average: avg(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.nodeId);

    return {
      totalEarnings: totalStats[0]?.total || 0,
      totalUnpaid: unpaidStats[0]?.total || 0,
      totalPaid: paidStats[0]?.total || 0,
      earningsCount: totalStats[0]?.count || 0,
      averageEarning: totalStats[0]?.average || 0,
      byCurrency: currencyStats.reduce(
        (acc, { currency, total, count, average }) => {
          acc[currency] = { total: total || 0, count: count || 0, average: average || 0 };
          return acc;
        },
        {} as Record<string, { total: number; count: number; average: number }>,
      ),
      byType: typeStats.reduce(
        (acc, { type, total, count, average }) => {
          acc[type] = { total: total || 0, count: count || 0, average: average || 0 };
          return acc;
        },
        {} as Record<string, { total: number; count: number; average: number }>,
      ),
      byNode: nodeStats.reduce(
        (acc, { nodeId, total, count, average }) => {
          acc[nodeId] = { total: total || 0, count: count || 0, average: average || 0 };
          return acc;
        },
        {} as Record<string, { total: number; count: number; average: number }>,
      ),
    };
  }

  // Get time series data for earnings
  async getTimeSeries(
    interval: 'hour' | 'day' | 'week' | 'month',
    startDate: Date,
    endDate: Date,
    filters: EarningsFilters = {},
  ): Promise<TimeSeriesPoint[]> {
    let whereConditions = [];

    // Apply date range
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);
    whereConditions.push(
      and(gte(this.table.timestamp, startTimestamp), lte(this.table.timestamp, endTimestamp)),
    );

    // Apply filters
    if (filters.nodeId) {
      if (Array.isArray(filters.nodeId)) {
        whereConditions.push(or(...filters.nodeId.map((id) => eq(this.table.nodeId, id))));
      } else {
        whereConditions.push(eq(this.table.nodeId, filters.nodeId));
      }
    }
    if (filters.currency) {
      whereConditions.push(eq(this.table.currency, filters.currency));
    }

    const whereClause = and(...whereConditions);

    // SQL for different intervals
    const intervalSQL = {
      hour: sql`strftime('%Y-%m-%d %H:00:00', datetime(${this.table.timestamp}, 'unixepoch'))`,
      day: sql`date(${this.table.timestamp}, 'unixepoch')`,
      week: sql`strftime('%Y-W%W', datetime(${this.table.timestamp}, 'unixepoch'))`,
      month: sql`strftime('%Y-%m', datetime(${this.table.timestamp}, 'unixepoch'))`,
    };

    const timestampSQL = {
      hour: sql`strftime('%s', strftime('%Y-%m-%d %H:00:00', datetime(${this.table.timestamp}, 'unixepoch')))`,
      day: sql`strftime('%s', date(${this.table.timestamp}, 'unixepoch'))`,
      week: sql`strftime('%s', date(${this.table.timestamp}, 'unixepoch', 'weekday 0', '-6 days'))`,
      month: sql`strftime('%s', date(${this.table.timestamp}, 'unixepoch', 'start of month'))`,
    };

    const results = await this.db
      .select({
        period: intervalSQL[interval],
        timestamp: timestampSQL[interval],
        totalEarnings: sum(this.table.amount),
        count: count(),
        averageEarning: avg(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(intervalSQL[interval])
      .orderBy(asc(intervalSQL[interval]));

    return results.map(({ period, timestamp, totalEarnings, count, averageEarning }) => ({
      timestamp: parseInt(timestamp as string),
      date: period as string,
      totalEarnings: totalEarnings || 0,
      count: count || 0,
      averageEarning: averageEarning || 0,
    }));
  }

  // Get earnings summary for different periods
  async getSummaryByPeriod(
    period: 'today' | 'week' | 'month' | 'year',
    currency: string = 'USD',
    filters: Omit<EarningsFilters, 'currency'> = {},
  ): Promise<EarningsSummary> {
    const now = new Date();
    let startDate: Date;
    let periodLabel: string;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        periodLabel = 'Today';
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        periodLabel = 'Past 7 days';
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        periodLabel = 'This month';
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        periodLabel = 'This year';
        break;
    }

    const endDate = now;
    const startTimestamp = Math.floor(startDate.getTime() / 1000);
    const endTimestamp = Math.floor(endDate.getTime() / 1000);

    let whereConditions = [
      and(gte(this.table.timestamp, startTimestamp), lte(this.table.timestamp, endTimestamp)),
      eq(this.table.currency, currency),
    ];

    // Apply additional filters
    if (filters.nodeId) {
      if (Array.isArray(filters.nodeId)) {
        whereConditions.push(or(...filters.nodeId.map((id) => eq(this.table.nodeId, id))));
      } else {
        whereConditions.push(eq(this.table.nodeId, filters.nodeId));
      }
    }
    if (filters.earningType) {
      if (Array.isArray(filters.earningType)) {
        whereConditions.push(
          or(...filters.earningType.map((type) => eq(this.table.earningType, type))),
        );
      } else {
        whereConditions.push(eq(this.table.earningType, filters.earningType));
      }
    }

    const whereClause = and(...whereConditions);

    const result = await this.db
      .select({
        totalAmount: sum(this.table.amount),
        transactionCount: count(),
        averageAmount: avg(this.table.amount),
      })
      .from(this.table)
      .where(whereClause);

    return {
      period: periodLabel,
      totalAmount: result[0]?.totalAmount || 0,
      transactionCount: result[0]?.transactionCount || 0,
      averageAmount: result[0]?.averageAmount || 0,
      currency,
    };
  }

  // Get top earning nodes
  async getTopEarningNodes(
    limit: number = 10,
    dateRange?: { start: Date; end: Date },
    currency: string = 'USD',
  ): Promise<
    Array<{ nodeId: string; totalEarnings: number; earningsCount: number; averageEarning: number }>
  > {
    let whereConditions = [eq(this.table.currency, currency)];

    if (dateRange) {
      const startTimestamp = Math.floor(dateRange.start.getTime() / 1000);
      const endTimestamp = Math.floor(dateRange.end.getTime() / 1000);
      whereConditions.push(
        and(gte(this.table.timestamp, startTimestamp), lte(this.table.timestamp, endTimestamp)),
      );
    }

    const whereClause = and(...whereConditions);

    const results = await this.db
      .select({
        nodeId: this.table.nodeId,
        totalEarnings: sum(this.table.amount),
        earningsCount: count(),
        averageEarning: avg(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.nodeId)
      .orderBy(desc(sum(this.table.amount)))
      .limit(limit);

    return results.map(({ nodeId, totalEarnings, earningsCount, averageEarning }) => ({
      nodeId,
      totalEarnings: totalEarnings || 0,
      earningsCount: earningsCount || 0,
      averageEarning: averageEarning || 0,
    }));
  }

  // Calculate projected earnings based on historical data
  async getProjectedEarnings(
    nodeId: string,
    days: number = 30,
    projectionDays: number = 30,
  ): Promise<{ dailyAverage: number; projectedTotal: number; confidence: number }> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

    const historicalData = await this.findByNode(nodeId, {
      dateRange: { start: startDate, end: endDate },
    });

    if (historicalData.data.length === 0) {
      return { dailyAverage: 0, projectedTotal: 0, confidence: 0 };
    }

    const totalEarnings = historicalData.data.reduce((sum, earning) => sum + earning.amount, 0);
    const dailyAverage = totalEarnings / days;
    const projectedTotal = dailyAverage * projectionDays;

    // Simple confidence calculation based on data consistency
    const dailyEarnings = new Map<string, number>();
    historicalData.data.forEach((earning) => {
      const date = new Date(earning.timestamp * 1000).toDateString();
      dailyEarnings.set(date, (dailyEarnings.get(date) || 0) + earning.amount);
    });

    const earningsArray = Array.from(dailyEarnings.values());
    const variance =
      earningsArray.reduce((sum, value) => sum + Math.pow(value - dailyAverage, 2), 0) /
      earningsArray.length;
    const standardDeviation = Math.sqrt(variance);
    const confidence = Math.max(0, Math.min(1, 1 - standardDeviation / dailyAverage));

    return {
      dailyAverage,
      projectedTotal,
      confidence: isNaN(confidence) ? 0 : confidence,
    };
  }
}
