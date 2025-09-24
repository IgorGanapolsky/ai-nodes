export interface Node {
    id: string;
    name: string;
    type: 'GPU' | 'CPU' | 'STORAGE';
    status: 'online' | 'offline' | 'maintenance';
    location: string;
    earnings: {
        daily: number;
        weekly: number;
        monthly: number;
        total: number;
    };
    metrics: {
        uptime: number;
        performance: number;
        temperature?: number;
        hashRate?: number;
        utilization: number;
    };
    createdAt: string;
    lastUpdated: string;
}
export interface EarningsData {
    timestamp: string;
    amount: number;
    nodeId: string;
    type: 'compute' | 'storage' | 'bandwidth';
}
export interface ChartData {
    labels: string[];
    datasets: {
        data: number[];
        color?: (opacity: number) => string;
        strokeWidth?: number;
    }[];
}
export interface WebSocketMessage {
    type: 'node_update' | 'earnings_update' | 'alert' | 'reinvest_complete';
    data: any;
    timestamp: string;
}
export interface Settings {
    apiKey: string;
    autoReinvest: boolean;
    reinvestThreshold: number;
    notifications: {
        enabled: boolean;
        nodeOffline: boolean;
        earningsTarget: boolean;
        lowPerformance: boolean;
    };
    refreshInterval: number;
}
export interface Alert {
    id: string;
    type: 'warning' | 'error' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: string;
    dismissed: boolean;
    nodeId?: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}
export interface LoadingState {
    isLoading: boolean;
    error: string | null;
}
export interface RootStackParamList {
    MainTabs: undefined;
    NodeDetails: {
        nodeId: string;
    };
    [key: string]: any;
}
export interface TabParamList {
    Dashboard: undefined;
    Earnings: undefined;
    Nodes: undefined;
    Settings: undefined;
    [key: string]: any;
}
//# sourceMappingURL=index.d.ts.map