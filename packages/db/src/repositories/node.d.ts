import { BaseRepository, QueryResult, FilterOptions, PaginationOptions } from './base';
import { nodes, type Node, type NewNode } from '../schema/nodes';
export interface NodeFilters extends FilterOptions {
  ownerId?: string;
  type?: string | string[];
  status?: string | string[];
  isOnline?: boolean;
  location?: string;
}
export interface NodeStats {
  total: number;
  online: number;
  offline: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}
export declare class NodeRepository extends BaseRepository<typeof nodes, Node, NewNode> {
  protected table: any;
  findByOwner(
    ownerId: string,
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<NodeFilters, 'ownerId'>;
    },
  ): Promise<QueryResult<Node>>;
  findByType(
    type: string | string[],
    options?: {
      pagination?: PaginationOptions;
      filters?: Omit<NodeFilters, 'type'>;
    },
  ): Promise<QueryResult<Node>>;
  findOnlineNodes(options?: {
    pagination?: PaginationOptions;
    filters?: Omit<NodeFilters, 'isOnline'>;
  }): Promise<QueryResult<Node>>;
  findOfflineNodes(options?: {
    pagination?: PaginationOptions;
    filters?: Omit<NodeFilters, 'isOnline'>;
  }): Promise<QueryResult<Node>>;
  findStaleNodes(
    minutesThreshold?: number,
    options?: {
      pagination?: PaginationOptions;
      filters?: NodeFilters;
    },
  ): Promise<QueryResult<Node>>;
  updateStatus(nodeId: string, status: string): Promise<Node | null>;
  updateOnlineStatus(nodeId: string, isOnline: boolean): Promise<Node | null>;
  batchUpdateOnlineStatus(
    updates: Array<{
      nodeId: string;
      isOnline: boolean;
    }>,
  ): Promise<void>;
  getStats(filters?: NodeFilters): Promise<NodeStats>;
  search(
    query: string,
    options?: {
      pagination?: PaginationOptions;
      filters?: NodeFilters;
    },
  ): Promise<QueryResult<Node>>;
  getNodesWithActivity(options?: {
    pagination?: PaginationOptions;
    filters?: NodeFilters;
  }): Promise<
    QueryResult<
      Node & {
        daysSinceLastSeen: number | null;
      }
    >
  >;
}
//# sourceMappingURL=node.d.ts.map
