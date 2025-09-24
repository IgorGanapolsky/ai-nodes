import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Owner } from '@/app/components/OwnerCard';
import { Device } from '@/app/components/DeviceTable';
import { Alert } from '@/app/components/AlertsList';
import { SummaryData } from '@/app/components/MetricsSummary';
import { Statement } from '@/app/components/StatementDownload';

// API Response Types
export interface PaginatedResponse<T> {
  data?: T[];
  items?: T[];
  owners?: T[];
  devices?: T[];
  alerts?: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
  activeCount?: number;
}

export interface OwnerMetrics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  totalEarnings: number;
  targetEarnings: number;
  actualEarnings: number;
  averageUptime: number;
  alertsCount: number;
}

export interface ChartDataResponse {
  data: Array<{
    timestamp: string;
    date: string;
    uptime: number;
    earnings: number;
    targetEarnings: number;
    devices: number;
    onlineDevices: number;
    networkLatency: number;
    cpuUsage: number;
    memoryUsage: number;
  }>;
}

// Query Parameters
export interface OwnersQuery {
  search?: string;
  status?: 'active' | 'inactive';
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DevicesQuery {
  ownerId?: string;
  status?: 'online' | 'offline' | 'maintenance';
  type?: string;
  limit?: number;
  offset?: number;
}

export interface AlertsQuery {
  ownerId?: string;
  status?: 'active' | 'acknowledged' | 'resolved';
  type?: 'critical' | 'warning' | 'info';
  category?: 'uptime' | 'performance' | 'earnings' | 'security' | 'system';
  limit?: number;
  offset?: number;
}

export interface GenerateStatementRequest {
  ownerId: string;
  period: string;
  format: 'pdf' | 'csv' | 'json';
  startDate?: string;
  endDate?: string;
}

export interface GenerateStatementResponse {
  id: string;
  status: 'generated' | 'processing' | 'error';
  downloadUrl?: string;
  message?: string;
}

class APIClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api/proxy',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add correlation ID for tracking
        config.headers['X-Correlation-ID'] = this.generateCorrelationId();

        // Add timestamp
        config.metadata = { startTime: Date.now() };

        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        const duration = Date.now() - (response.config.metadata?.startTime || Date.now());
        console.log(`[API] ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
        return response;
      },
      (error) => {
        const duration = Date.now() - (error.config?.metadata?.startTime || Date.now());
        console.error(`[API] ${error.response?.status || 'ERROR'} ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, error.message);

        // Transform error for better handling
        const transformedError = {
          message: error.response?.data?.message || error.message || 'An unknown error occurred',
          status: error.response?.status,
          data: error.response?.data,
        };

        return Promise.reject(transformedError);
      }
    );
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Owners API
  async getOwners(params?: OwnersQuery): Promise<PaginatedResponse<Owner>> {
    const response: AxiosResponse<PaginatedResponse<Owner>> = await this.client.get('/v1/owners', { params });
    return response.data;
  }

  async getOwner(id: string): Promise<Owner> {
    const response: AxiosResponse<Owner> = await this.client.get(`/v1/owners/${id}`);
    return response.data;
  }

  async getOwnersSummary(): Promise<SummaryData> {
    const response: AxiosResponse<SummaryData> = await this.client.get('/v1/owners/summary');
    return response.data;
  }

  async getOwnerMetrics(id: string, timeframe?: string): Promise<OwnerMetrics> {
    const response: AxiosResponse<OwnerMetrics> = await this.client.get(`/v1/owners/${id}/metrics`, {
      params: { timeframe }
    });
    return response.data;
  }

  async getOwnerChartData(id: string, timeframe: string): Promise<ChartDataResponse> {
    const response: AxiosResponse<ChartDataResponse> = await this.client.get(`/v1/owners/${id}/chart`, {
      params: { timeframe }
    });
    return response.data;
  }

  // Devices API
  async getDevices(params?: DevicesQuery): Promise<PaginatedResponse<Device>> {
    const response: AxiosResponse<PaginatedResponse<Device>> = await this.client.get('/v1/devices', { params });
    return response.data;
  }

  async getOwnerDevices(ownerId: string, params?: Omit<DevicesQuery, 'ownerId'>): Promise<PaginatedResponse<Device>> {
    const response: AxiosResponse<PaginatedResponse<Device>> = await this.client.get(`/v1/owners/${ownerId}/devices`, { params });
    return response.data;
  }

  async getDevice(id: string): Promise<Device> {
    const response: AxiosResponse<Device> = await this.client.get(`/v1/devices/${id}`);
    return response.data;
  }

  // Alerts API
  async getAlerts(params?: AlertsQuery): Promise<PaginatedResponse<Alert>> {
    const response: AxiosResponse<PaginatedResponse<Alert>> = await this.client.get('/v1/alerts', { params });
    return response.data;
  }

  async getOwnerAlerts(ownerId: string, params?: Omit<AlertsQuery, 'ownerId'>): Promise<PaginatedResponse<Alert>> {
    const response: AxiosResponse<PaginatedResponse<Alert>> = await this.client.get(`/v1/owners/${ownerId}/alerts`, { params });
    return response.data;
  }

  async acknowledgeAlert(alertId: string): Promise<void> {
    await this.client.post(`/v1/alerts/${alertId}/acknowledge`);
  }

  async resolveAlert(alertId: string): Promise<void> {
    await this.client.post(`/v1/alerts/${alertId}/resolve`);
  }

  // Statements API
  async getOwnerStatements(ownerId: string): Promise<Statement[]> {
    const response: AxiosResponse<Statement[]> = await this.client.get(`/v1/owners/${ownerId}/statements`);
    return response.data;
  }

  async generateStatement(request: GenerateStatementRequest): Promise<GenerateStatementResponse> {
    const response: AxiosResponse<GenerateStatementResponse> = await this.client.post('/v1/statements/generate', request);
    return response.data;
  }

  // Generic methods for custom API calls
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(endpoint, { params });
    return response.data;
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(endpoint, data);
    return response.data;
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(endpoint, data);
    return response.data;
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(endpoint);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiClient = new APIClient();

// Export types for external use
export type {
  Owner,
  Device,
  Alert,
  SummaryData,
  Statement,
  OwnerMetrics,
  ChartDataResponse,
  OwnersQuery,
  DevicesQuery,
  AlertsQuery,
  GenerateStatementRequest,
  GenerateStatementResponse,
  PaginatedResponse,
};