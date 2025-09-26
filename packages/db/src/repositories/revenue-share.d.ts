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
  byShareType: Record<
    string,
    {
      count: number;
      amount: number;
    }
  >;
  byPeriod: Record<
    string,
    {
      count: number;
      amount: number;
    }
  >;
  byNode: Record<
    string,
    {
      count: number;
      amount: number;
    }
  >;
}
export declare class RevenueShareRepository extends BaseRepository<
  typeof revenueShares,
  RevenueShare,
  NewRevenueShare
> {
  protected table: any;
  findByNode(
    nodeId: string | string[],
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<RevenueShareFilters, 'nodeId'>;
      dateRange?: {
        start: Date;
        end: Date;
      };
    },
  ): Promise<QueryResult<RevenueShare>>;
  findByPeriod(
    period: string,
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<RevenueShareFilters, 'period'>;
    },
  ): Promise<QueryResult<RevenueShare>>;
  findUnpaid(options?: {
    pagination?: PaginationOptions;
    filters?: Omit<RevenueShareFilters, 'paidOut'>;
  }): Promise<QueryResult<RevenueShare>>;
  findByRecipient(
    recipientId: string,
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<RevenueShareFilters, 'recipientId'>;
    },
  ): Promise<QueryResult<RevenueShare>>;
  createRevenueShare(
    shareData: Omit<NewRevenueShare, 'id' | 'amount' | 'timestamp' | 'createdAt' | 'updatedAt'>,
  ): Promise<RevenueShare>;
  markAsPaid(shareIds: string[], transactionHash?: string): Promise<number>;
  generateRevenueShares(
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
  ): Promise<RevenueShare[]>;
  getRevenueShareReport(
    filters?: RevenueShareFilters,
    dateRange?: {
      start: Date;
      end: Date;
    },
  ): Promise<RevenueShareReport>;
  getPendingPayouts(groupBy?: 'shareType' | 'recipient' | 'period'): Promise<
    Array<{
      group: string;
      count: number;
      totalAmount: number;
      currency: string;
    }>
  >;
  getRevenueShareProjections(
    nodeId: string,
    shareConfigs: Array<{
      shareType: string;
      percentage: number;
    }>,
    projectionDays?: number,
  ): Promise<
    Array<{
      shareType: string;
      projectedAmount: number;
      percentage: number;
    }>
  >;
  getRevenueShareHistory(
    period?: 'month' | 'quarter' | 'year',
    limit?: number,
  ): Promise<
    Array<{
      period: string;
      totalShares: number;
      totalAmount: number;
      paidAmount: number;
      averagePercentage: number;
    }>
  >;
}
//# sourceMappingURL=revenue-share.d.ts.map
