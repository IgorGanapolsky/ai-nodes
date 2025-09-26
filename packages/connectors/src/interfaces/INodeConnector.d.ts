import {
  NodeStatus,
  Earnings,
  Period,
  NodeMetrics,
  PricingStrategy,
  OptimizationParams,
  ConnectorConfig,
  ConnectorType,
} from './types';
/**
 * Base interface for all DePIN node connectors
 * Provides standardized methods for interacting with different node networks
 * All methods are READ-ONLY for custody safety
 */
export interface INodeConnector {
  /**
   * Connector type identifier
   */
  readonly type: ConnectorType;
  /**
   * Connector configuration
   */
  readonly config: ConnectorConfig;
  /**
   * Initialize the connector with configuration
   */
  initialize(config: ConnectorConfig): Promise<void>;
  /**
   * Get current status of all nodes or a specific node
   * @param nodeId Optional specific node ID
   * @returns Promise resolving to node status or array of node statuses
   */
  getNodeStatus(nodeId?: string): Promise<NodeStatus | NodeStatus[]>;
  /**
   * Get earnings data for a specific period
   * @param period Time period for earnings calculation
   * @param nodeId Optional specific node ID
   * @returns Promise resolving to earnings data
   */
  getEarnings(period: Period, nodeId?: string): Promise<Earnings>;
  /**
   * Get comprehensive metrics for nodes
   * @param nodeId Optional specific node ID
   * @returns Promise resolving to node metrics
   */
  getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]>;
  /**
   * Get optimized pricing strategy recommendations
   * @param params Optimization parameters
   * @param nodeId Optional specific node ID
   * @returns Promise resolving to pricing strategy
   */
  optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy>;
  /**
   * Check if the connector is properly configured and authenticated
   * @returns Promise resolving to boolean indicating readiness
   */
  isReady(): Promise<boolean>;
  /**
   * Get connector health status
   * @returns Promise resolving to health information
   */
  getHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    latency: number;
    errors: string[];
  }>;
  /**
   * Validate API credentials without making destructive calls
   * @returns Promise resolving to validation result
   */
  validateCredentials(): Promise<{
    valid: boolean;
    permissions: string[];
    limitations: string[];
  }>;
  /**
   * Get available node IDs for this connector
   * @returns Promise resolving to array of node IDs
   */
  getNodeIds(): Promise<string[]>;
  /**
   * Dispose of resources and cleanup
   */
  dispose(): Promise<void>;
  /**
   * Get connector information
   */
  getInfo(): {
    type: ConnectorType;
    initialized: boolean;
    hasApiKey: boolean;
    cacheEnabled: boolean;
    scraperEnabled: boolean;
    rateLimitInfo: any;
  };
}
//# sourceMappingURL=INodeConnector.d.ts.map
