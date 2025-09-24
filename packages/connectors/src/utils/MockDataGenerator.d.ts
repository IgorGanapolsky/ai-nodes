import { NodeStatus, NodeSpecs, Earnings, Transaction, NodeMetrics, PricingStrategy, Period, ConnectorType } from '../interfaces/types';
/**
 * Mock data generator for testing and development
 */
export declare class MockDataGenerator {
    private static readonly SAMPLE_COUNTRIES;
    private static readonly SAMPLE_REGIONS;
    private static readonly GPU_MODELS;
    private static readonly CPU_MODELS;
    /**
     * Generate random number within range
     */
    private static random;
    /**
     * Generate random integer within range
     */
    private static randomInt;
    /**
     * Pick random element from array
     */
    private static randomChoice;
    /**
     * Generate realistic node ID
     */
    static generateNodeId(connectorType: ConnectorType): string;
    /**
     * Generate mock node specifications
     */
    static generateNodeSpecs(connectorType: ConnectorType): NodeSpecs;
    /**
     * Generate mock node status
     */
    static generateNodeStatus(connectorType: ConnectorType): NodeStatus;
    /**
     * Generate mock transactions
     */
    static generateTransactions(count: number): Transaction[];
    /**
     * Generate transaction description
     */
    private static generateTransactionDescription;
    /**
     * Generate mock earnings
     */
    static generateEarnings(period: Period, connectorType: ConnectorType): Earnings;
    /**
     * Get currency for connector type
     */
    private static getCurrency;
    /**
     * Generate mock node metrics
     */
    static generateNodeMetrics(connectorType: ConnectorType): NodeMetrics;
    /**
     * Check if connector type typically has GPU
     */
    private static hasGpu;
    /**
     * Generate mock pricing strategy
     */
    static generatePricingStrategy(connectorType: ConnectorType): PricingStrategy;
    /**
     * Generate multiple node statuses
     */
    static generateMultipleNodeStatuses(connectorType: ConnectorType, count: number): NodeStatus[];
    /**
     * Generate multiple node metrics
     */
    static generateMultipleNodeMetrics(connectorType: ConnectorType, count: number): NodeMetrics[];
    /**
     * Generate period for testing
     */
    static generatePeriod(type?: Period['type']): Period;
}
//# sourceMappingURL=MockDataGenerator.d.ts.map