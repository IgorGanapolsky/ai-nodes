import { eq, and, or, desc, count, sum, sql } from 'drizzle-orm';
import { BaseRepository, QueryResult, FilterOptions, PaginationOptions } from './base';
import { revenueShares, type RevenueShare, type NewRevenueShare } from '../schema/revenue-shares';

export interface RevenueShareFilters extends FilterOptions {
  nodeId?: string | string[];
  shareType?: string | string[];
  paidOut?: boolean;
  period?: string;
  recipientId?: string;
}

export interface RevenueShareReport {
  totalShares: number;
  totalAmount: number;
  paidAmount: number;
  unpaidAmount: number;
  byShareType: Record<string, { count: number; amount: number }>;
  byPeriod: Record<string, { count: number; amount: number }>;
  byNode: Record<string, { count: number; amount: number }>;
}

export class RevenueShareRepository extends BaseRepository<
  typeof revenueShares,
  RevenueShare,
  NewRevenueShare
> {
  protected table = revenueShares;

  // Find revenue shares by node
  async findByNode(
    nodeId: string | string[],
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<RevenueShareFilters, 'nodeId'>;
      dateRange?: { start: Date; end: Date };
    } = {},
  ): Promise<QueryResult<RevenueShare>> {
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

  // Find revenue shares by period
  async findByPeriod(
    period: string,
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<RevenueShareFilters, 'period'>;
    } = {},
  ): Promise<QueryResult<RevenueShare>> {
    return this.findMany({
      filters: { ...options.filters, period },
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Find unpaid revenue shares
  async findUnpaid(
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<RevenueShareFilters, 'paidOut'>;
    } = {},
  ): Promise<QueryResult<RevenueShare>> {
    return this.findMany({
      filters: { ...options.filters, paidOut: false },
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Find revenue shares by recipient
  async findByRecipient(
    recipientId: string,
    options: {
      pagination?: PaginationOptions;
      filters?: Omit<RevenueShareFilters, 'recipientId'>;
    } = {},
  ): Promise<QueryResult<RevenueShare>> {
    return this.findMany({
      filters: { ...options.filters, recipientId },
      pagination: options.pagination,
      sort: { column: 'timestamp', direction: 'desc' },
    });
  }

  // Create revenue share with automatic calculations
  async createRevenueShare(
    shareData: Omit<NewRevenueShare, 'id' | 'amount' | 'timestamp' | 'createdAt' | 'updatedAt'>,
  ): Promise<RevenueShare> {
    const calculatedAmount = (shareData.totalEarnings * shareData.percentage) / 100;

    const newShare: NewRevenueShare = {
      ...shareData,
      amount: calculatedAmount,
      timestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return this.create(newShare);
  }

  // Mark revenue shares as paid
  async markAsPaid(shareIds: string[], transactionHash?: string): Promise<number> {
    let paidCount = 0;

    for (const shareId of shareIds) {
      const updateData: Partial<NewRevenueShare> = {
        paidOut: true,
        paidAt: new Date(),
        updatedAt: new Date(),
      };

      if (transactionHash) {
        updateData.transactionHash = transactionHash;
      }

      const result = await this.update(shareId, updateData);
      if (result) {paidCount++;}
    }

    return paidCount;
  }

  // Generate revenue shares for a period
  async generateRevenueShares(
    period: string,
    periodStart: Date,
    periodEnd: Date,
    shareConfigs: Array<{
      nodeId: string;
      shareType: string;
      percentage: number;
      recipientId?: string;
      recipientAddress?: string;
    }>,
  ): Promise<RevenueShare[]> {
    const createdShares: RevenueShare[] = [];

    // Get total earnings for the period for each node
    const nodeEarnings = new Map<string, number>();

    for (const config of shareConfigs) {
      if (!nodeEarnings.has(config.nodeId)) {
        // Calculate total earnings for this node in the period
        const earningsResult = await this.db
          .select({ total: sum(sql`amount`) })
          .from(sql`earnings`)
          .where(
            and(
              eq(sql`node_id`, config.nodeId),
              sql`timestamp >= ${Math.floor(periodStart.getTime() / 1000)}`,
              sql`timestamp <= ${Math.floor(periodEnd.getTime() / 1000)}`,
            ),
          );

        nodeEarnings.set(config.nodeId, earningsResult[0]?.total || 0);
      }

      const totalEarnings = nodeEarnings.get(config.nodeId) || 0;

      if (totalEarnings > 0) {
        const share = await this.createRevenueShare({
          nodeId: config.nodeId,
          percentage: config.percentage,
          period,
          periodStart,
          periodEnd,
          totalEarnings,
          shareType: config.shareType,
          recipientId: config.recipientId,
          recipientAddress: config.recipientAddress,
        });

        createdShares.push(share);
      }
    }

    return createdShares;
  }

  // Get revenue share report
  async getRevenueShareReport(
    filters: RevenueShareFilters = {},
    dateRange?: { start: Date; end: Date },
  ): Promise<RevenueShareReport> {
    const whereConditions = [];

    // Apply filters
    if (filters.nodeId) {
      if (Array.isArray(filters.nodeId)) {
        whereConditions.push(or(...filters.nodeId.map((id) => eq(this.table.nodeId, id))));
      } else {
        whereConditions.push(eq(this.table.nodeId, filters.nodeId));
      }
    }
    if (filters.shareType) {
      if (Array.isArray(filters.shareType)) {
        whereConditions.push(
          or(...filters.shareType.map((type) => eq(this.table.shareType, type))),
        );
      } else {
        whereConditions.push(eq(this.table.shareType, filters.shareType));
      }
    }
    if (filters.recipientId) {
      whereConditions.push(eq(this.table.recipientId, filters.recipientId));
    }

    // Apply date range
    if (dateRange) {
      const startTimestamp = Math.floor(dateRange.start.getTime() / 1000);
      const endTimestamp = Math.floor(dateRange.end.getTime() / 1000);
      whereConditions.push(
        and(
          sql`${this.table.periodStart} >= ${startTimestamp}`,
          sql`${this.table.periodEnd} <= ${endTimestamp}`,
        ),
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    // Get overall statistics
    const [totalStats, paidStats, unpaidStats] = await Promise.all([
      this.db
        .select({
          count: count(),
          total: sum(this.table.amount),
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
            ? and(whereClause, eq(this.table.paidOut, true))
            : eq(this.table.paidOut, true),
        ),
      this.db
        .select({
          total: sum(this.table.amount),
        })
        .from(this.table)
        .where(
          whereClause
            ? and(whereClause, eq(this.table.paidOut, false))
            : eq(this.table.paidOut, false),
        ),
    ]);

    // Get breakdown by share type
    const shareTypeStats = await this.db
      .select({
        shareType: this.table.shareType,
        count: count(),
        amount: sum(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.shareType);

    // Get breakdown by period
    const periodStats = await this.db
      .select({
        period: this.table.period,
        count: count(),
        amount: sum(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.period);

    // Get breakdown by node
    const nodeStats = await this.db
      .select({
        nodeId: this.table.nodeId,
        count: count(),
        amount: sum(this.table.amount),
      })
      .from(this.table)
      .where(whereClause)
      .groupBy(this.table.nodeId);

    return {
      totalShares: totalStats[0]?.count || 0,
      totalAmount: totalStats[0]?.total || 0,
      paidAmount: paidStats[0]?.total || 0,
      unpaidAmount: unpaidStats[0]?.total || 0,
      byShareType: shareTypeStats.reduce(
        (acc, { shareType, count, amount }) => {
          acc[shareType] = { count: count || 0, amount: amount || 0 };
          return acc;
        },
        {} as Record<string, { count: number; amount: number }>,
      ),
      byPeriod: periodStats.reduce(
        (acc, { period, count, amount }) => {
          acc[period] = { count: count || 0, amount: amount || 0 };
          return acc;
        },
        {} as Record<string, { count: number; amount: number }>,
      ),
      byNode: nodeStats.reduce(
        (acc, { nodeId, count, amount }) => {
          acc[nodeId] = { count: count || 0, amount: amount || 0 };
          return acc;
        },
        {} as Record<string, { count: number; amount: number }>,
      ),
    };
  }

  // Get pending payouts summary
  async getPendingPayouts(
    groupBy: 'shareType' | 'recipient' | 'period' = 'shareType',
  ): Promise<Array<{ group: string; count: number; totalAmount: number; currency: string }>> {
    const groupColumn = {
      shareType: this.table.shareType,
      recipient: this.table.recipientId,
      period: this.table.period,
    }[groupBy];

    const results = await this.db
      .select({
        group: groupColumn,
        count: count(),
        totalAmount: sum(this.table.amount),
        currency: this.table.currency,
      })
      .from(this.table)
      .where(eq(this.table.paidOut, false))
      .groupBy(groupColumn, this.table.currency)
      .orderBy(desc(sum(this.table.amount)));

    return results.map((result) => ({
      group: result.group || 'unknown',
      count: result.count || 0,
      totalAmount: result.totalAmount || 0,
      currency: result.currency,
    }));
  }

  // Calculate revenue share projections
  async getRevenueShareProjections(
    nodeId: string,
    shareConfigs: Array<{ shareType: string; percentage: number }>,
    projectionDays: number = 30,
  ): Promise<Array<{ shareType: string; projectedAmount: number; percentage: number }>> {
    // Get historical earnings for the node to calculate average daily earnings
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const thirtyDaysTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);

    const historicalEarnings = await this.db
      .select({ total: sum(sql`amount`) })
      .from(sql`earnings`)
      .where(and(eq(sql`node_id`, nodeId), sql`timestamp >= ${thirtyDaysTimestamp}`));

    const totalHistoricalEarnings = historicalEarnings[0]?.total || 0;
    const dailyAverageEarnings = totalHistoricalEarnings / 30;
    const projectedTotalEarnings = dailyAverageEarnings * projectionDays;

    return shareConfigs.map((config) => ({
      shareType: config.shareType,
      projectedAmount: (projectedTotalEarnings * config.percentage) / 100,
      percentage: config.percentage,
    }));
  }

  // Get revenue share history for analytics
  async getRevenueShareHistory(
    period: 'month' | 'quarter' | 'year' = 'month',
    limit: number = 12,
  ): Promise<
    Array<{
      period: string;
      totalShares: number;
      totalAmount: number;
      paidAmount: number;
      averagePercentage: number;
    }>
  > {
    const periodFormat = {
      month: sql`strftime('%Y-%m', datetime(${this.table.periodStart}, 'unixepoch'))`,
      quarter: sql`strftime('%Y-Q', datetime(${this.table.periodStart}, 'unixepoch')) || ((strftime('%m', datetime(${this.table.periodStart}, 'unixepoch')) - 1) / 3 + 1)`,
      year: sql`strftime('%Y', datetime(${this.table.periodStart}, 'unixepoch'))`,
    };

    const results = await this.db
      .select({
        period: periodFormat[period],
        totalShares: count(),
        totalAmount: sum(this.table.amount),
        paidAmount: sql<number>`SUM(CASE WHEN ${this.table.paidOut} = 1 THEN ${this.table.amount} ELSE 0 END)`,
        averagePercentage: sql<number>`AVG(${this.table.percentage})`,
      })
      .from(this.table)
      .groupBy(periodFormat[period])
      .orderBy(desc(periodFormat[period]))
      .limit(limit);

    return results.map((result) => ({
      period: result.period as string,
      totalShares: result.totalShares || 0,
      totalAmount: result.totalAmount || 0,
      paidAmount: result.paidAmount || 0,
      averagePercentage: result.averagePercentage || 0,
    }));
  }
}
