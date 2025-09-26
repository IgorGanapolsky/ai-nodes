import axios, { AxiosInstance } from 'axios';
import { config } from '../commands/config.js';

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
  uptime: Array<{ timestamp: string; value: number }>;
  cpu: Array<{ timestamp: string; value: number }>;
  memory: Array<{ timestamp: string; value: number }>;
  storage: Array<{ timestamp: string; value: number }>;
  earnings: Array<{ timestamp: string; value: number }>;
  networkLatency: Array<{ timestamp: string; value: number }>;
}

export class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL?: string) {
    const apiUrl = baseURL || config.get('apiUrl') || 'http://localhost:3001';

    this.client = axios.create({
      baseURL: `${apiUrl}/api/v1`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'DePIN-Autopilot-CLI/1.0.0',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.DEBUG || global.process?.argv?.includes('--verbose')) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          // Server responded with error status
          const message = error.response.data?.message || error.response.statusText;
          throw new Error(`API Error (${error.response.status}): ${message}`);
        } else if (error.request) {
          // Request was made but no response received
          throw new Error('API Error: No response from server. Is the server running?');
        } else {
          // Something else happened
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

  async createNode(data: CreateNodeRequest): Promise<Node> {
    const response = await this.client.post('/nodes', data);
    return response.data;
  }

  async updateNode(nodeId: string, data: Partial<CreateNodeRequest>): Promise<Node> {
    const response = await this.client.put(`/nodes/${nodeId}`, data);
    return response.data;
  }

  async deleteNode(nodeId: string): Promise<void> {
    await this.client.delete(`/nodes/${nodeId}`);
  }

  async getMetricsSummary(timeframe: string = '24h'): Promise<MetricsSummary> {
    const response = await this.client.get('/metrics/summary', {
      params: { timeframe },
    });
    return response.data;
  }

  async getNodeMetrics(nodeId: string, timeframe: string = '24h'): Promise<NodeMetrics> {
    const response = await this.client.get(`/metrics/nodes/${nodeId}`, {
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

  async reportMetrics(
    nodeId: string,
    metrics: {
      cpu?: number;
      memory?: number;
      storage?: number;
      networkLatency?: number;
      uptime?: number;
      earnings?: number;
    },
  ): Promise<{ success: boolean; message: string }> {
    const response = await this.client.post(`/metrics/nodes/${nodeId}/report`, {
      metrics,
      timestamp: new Date().toISOString(),
    });
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
