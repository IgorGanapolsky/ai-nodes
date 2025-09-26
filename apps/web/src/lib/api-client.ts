import axios, { AxiosInstance } from 'axios';

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

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/v1',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const message = error.response.data?.message || error.response.statusText;
          throw new Error(`API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          throw new Error('API Error: No response from server');
        } else {
          throw new Error(`API Error: ${error.message}`);
        }
      },
    );
  }

  async getNodes(params?: {
    status?: string;
    type?: string;
    region?: string;
    limit?: number;
    offset?: number;
  }): Promise<NodesResponse> {
    const response = await this.client.get('/nodes', { params });
    return response.data;
  }

  async getNode(nodeId: string): Promise<Node> {
    const response = await this.client.get(`/nodes/${nodeId}`);
    return response.data;
  }

  async getMetricsSummary(timeframe: string = '24h'): Promise<MetricsSummary> {
    const response = await this.client.get('/metrics/summary', {
      params: { timeframe },
    });
    return response.data;
  }

  async getAlerts(params?: {
    severity?: string;
    status?: string;
    limit?: number;
  }): Promise<AlertsResponse> {
    const response = await this.client.get('/metrics/alerts', { params });
    return response.data;
  }

  async healthCheck(): Promise<{
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    environment: string;
  }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const apiClient = new ApiClient();
