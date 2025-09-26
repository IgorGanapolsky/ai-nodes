import {
  ConnectorConfig,
  NodeStatus,
  Earnings,
  Period,
  NodeMetrics,
  PricingStrategy,
  OptimizationParams,
} from '../interfaces';
import { BaseConnector } from './BaseConnector';
/**
 * OwnAI compute connector
 * Provides access to OwnAI decentralized AI compute network
 */
export declare class OwnAIConnector extends BaseConnector {
  private static readonly API_ENDPOINTS;
  private static readonly SCRAPER_SELECTORS;
  constructor(config: ConnectorConfig);
  protected doInitialize(): Promise<void>;
  protected requiresApiKey(): boolean;
  protected requiresBaseUrl(): boolean;
  getNodeStatus(nodeId?: string): Promise<NodeStatus | NodeStatus[]>;
  getEarnings(period: Period, nodeId?: string): Promise<Earnings>;
  getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]>;
  optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy>;
  validateCredentials(): Promise<{
    valid: boolean;
    permissions: string[];
    limitations: string[];
  }>;
  getNodeIds(): Promise<string[]>;
  private mapApiResponseToNodeStatus;
  private mapApiResponseToEarnings;
  private combineDataToMetrics;
  private mapApiResponseToPricingStrategy;
  private mapStatusFromApi;
  private calculateAverageJobDuration;
  private getPeriodDays;
}
//# sourceMappingURL=OwnAIConnector.d.ts.map
