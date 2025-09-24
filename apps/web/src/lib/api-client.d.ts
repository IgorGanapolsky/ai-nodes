export interface Node {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'maintenance' | 'error';
    endpoint: string;
    region: string;
    version: string;
    lastSeen: string;
    metrics: {
        uptime: number;
        cpu: number;
        memory: number;
        storage: number;
        earnings: number;
    };
}
export interface NodesResponse {
    nodes: Node[];
    total: number;
    limit: number;
    offset: number;
}
export interface MetricsSummary {
    totalNodes: number;
    onlineNodes: number;
    offlineNodes: number;
    totalEarnings: number;
    averageUptime: number;
    averageCpu: number;
    averageMemory: number;
    totalStorage: number;
    alertsCount: number;
    performanceScore: number;
}
export interface Alert {
    id: string;
    nodeId: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    status: 'active' | 'resolved' | 'acknowledged';
    message: string;
    timestamp: string;
    details: Record<string, any>;
}
export interface AlertsResponse {
    alerts: Alert[];
    total: number;
}
declare class ApiClient {
    private client;
    constructor();
    getNodes(params?: {
        status?: string;
        type?: string;
        region?: string;
        limit?: number;
        offset?: number;
    }): Promise<NodesResponse>;
    getNode(nodeId: string): Promise<Node>;
    getMetricsSummary(timeframe?: string): Promise<MetricsSummary>;
    getAlerts(params?: {
        severity?: string;
        status?: string;
        limit?: number;
    }): Promise<AlertsResponse>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        version: string;
        environment: string;
    }>;
}
export declare const apiClient: ApiClient;
export {};
//# sourceMappingURL=api-client.d.ts.map