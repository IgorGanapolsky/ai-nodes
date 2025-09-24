import { AxiosInstance } from 'axios';
import { INodeConnector, ConnectorConfig, ConnectorType, NodeStatus, Earnings, Period, NodeMetrics, PricingStrategy, OptimizationParams } from '../interfaces';
import { RateLimiter } from '../utils';
import { CacheManager } from '../cache';
import { PlaywrightScraper, ScrapingOptions } from '../scrapers';
/**
 * Base connector class implementing common functionality
 * All specific connectors extend this class
 */
export declare abstract class BaseConnector implements INodeConnector {
    readonly type: ConnectorType;
    readonly config: ConnectorConfig;
    protected axiosInstance: AxiosInstance;
    protected rateLimiter: RateLimiter;
    protected cacheManager: CacheManager;
    protected scraper?: PlaywrightScraper;
    protected initialized: boolean;
    constructor(type: ConnectorType, config: ConnectorConfig);
    /**
     * Setup axios interceptors for error handling and rate limiting
     */
    private setupInterceptors;
    /**
     * Initialize the connector
     */
    initialize(config: ConnectorConfig): Promise<void>;
    /**
     * Validate connector configuration
     */
    protected validateConfig(): Promise<void>;
    /**
     * Connector-specific initialization
     */
    protected abstract doInitialize(): Promise<void>;
    /**
     * Check if this connector requires an API key
     */
    protected abstract requiresApiKey(): boolean;
    /**
     * Check if this connector requires a base URL
     */
    protected abstract requiresBaseUrl(): boolean;
    /**
     * Make a cached API request
     */
    protected makeRequest<T>(method: string, url: string, data?: any, cacheTtl?: number): Promise<T>;
    /**
     * Fallback to scraping when API is not available
     */
    protected scrapeData(url: string, selectors: Record<string, string>, options?: Partial<ScrapingOptions>): Promise<Record<string, string | null>>;
    /**
     * Get node status - must be implemented by each connector
     */
    abstract getNodeStatus(nodeId?: string): Promise<NodeStatus | NodeStatus[]>;
    /**
     * Get earnings - must be implemented by each connector
     */
    abstract getEarnings(period: Period, nodeId?: string): Promise<Earnings>;
    /**
     * Get metrics - must be implemented by each connector
     */
    abstract getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]>;
    /**
     * Optimize pricing - must be implemented by each connector
     */
    abstract optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy>;
    /**
     * Check if connector is ready
     */
    isReady(): Promise<boolean>;
    /**
     * Get connector health
     */
    getHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        lastCheck: Date;
        latency: number;
        errors: string[];
    }>;
    /**
     * Validate credentials - must be implemented by each connector
     */
    abstract validateCredentials(): Promise<{
        valid: boolean;
        permissions: string[];
        limitations: string[];
    }>;
    /**
     * Get available node IDs - must be implemented by each connector
     */
    abstract getNodeIds(): Promise<string[]>;
    /**
     * Generate mock data when API is not available
     */
    protected generateMockNodeStatus(nodeId?: string): NodeStatus | NodeStatus[];
    /**
     * Generate mock earnings data
     */
    protected generateMockEarnings(period: Period): Earnings;
    /**
     * Generate mock metrics data
     */
    protected generateMockMetrics(nodeId?: string): NodeMetrics | NodeMetrics[];
    /**
     * Generate mock pricing strategy
     */
    protected generateMockPricingStrategy(): PricingStrategy;
    /**
     * Check if connector should use mock data
     */
    protected shouldUseMockData(): boolean;
    /**
     * Dispose of resources
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
//# sourceMappingURL=BaseConnector.d.ts.map