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
export interface CreateNodeRequest {
    name: string;
    type: string;
    endpoint: string;
    region: string;
    credentials?: Record<string, any>;
}
export interface NodeMetrics {
    nodeId: string;
    uptime: Array<{
        timestamp: string;
        value: number;
    }>;
    cpu: Array<{
        timestamp: string;
        value: number;
    }>;
    memory: Array<{
        timestamp: string;
        value: number;
    }>;
    storage: Array<{
        timestamp: string;
        value: number;
    }>;
    earnings: Array<{
        timestamp: string;
        value: number;
    }>;
    networkLatency: Array<{
        timestamp: string;
        value: number;
    }>;
}
export declare class ApiClient {
    private client;
    constructor(baseURL?: string);
    getNodes(params?: {
        status?: string;
        type?: string;
        region?: string;
        limit?: number;
        offset?: number;
    }): Promise<NodesResponse>;
    getNode(nodeId: string): Promise<Node>;
    createNode(data: CreateNodeRequest): Promise<Node>;
    updateNode(nodeId: string, data: Partial<CreateNodeRequest>): Promise<Node>;
    deleteNode(nodeId: string): Promise<void>;
    getMetricsSummary(timeframe?: string): Promise<MetricsSummary>;
    getNodeMetrics(nodeId: string, timeframe?: string): Promise<NodeMetrics>;
    getAlerts(params?: {
        severity?: string;
        status?: string;
        limit?: number;
    }): Promise<AlertsResponse>;
    reportMetrics(nodeId: string, metrics: {
        cpu?: number;
        memory?: number;
        storage?: number;
        networkLatency?: number;
        uptime?: number;
        earnings?: number;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    healthCheck(): Promise<{
        status: string;
        timestamp: string;
        uptime: number;
        version: string;
        environment: string;
    }>;
}
//# sourceMappingURL=api-client.d.ts.map