import axios, { AxiosInstance, AxiosResponse } from 'axios';
import chalk from 'chalk';
import { readConfig } from './config.js';

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  apiKey?: string;
}

export interface Owner {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Device {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
  metrics?: DeviceMetrics;
}

export interface DeviceMetrics {
  grossRevenue24h: number;
  grossRevenue7d: number;
  utilization: number;
  uptime: number;
}

export interface PullSummary {
  totalDevices: number;
  onlineDevices: number;
  totalRevenue24h: number;
  totalRevenue7d: number;
  averageUtilization: number;
  lastUpdated: string;
}

export interface UtilizationPlan {
  currentUtilization: number;
  targetUtilization: number;
  requiredDevices: number;
  estimatedRevenue: number;
  recommendations: string[];
}

export interface PricingSuggestion {
  deviceId: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  expectedImpact: string;
}

export interface Statement {
  ownerId: string;
  period: string;
  devices: Device[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  generatedAt: string;
}

export class ApiClient {
  private client: AxiosInstance;
  private config: ApiConfig;

  constructor(config?: Partial<ApiConfig>) {
    const userConfig = readConfig();

    this.config = {
      baseURL: config?.baseURL || userConfig.apiUrl || 'http://localhost:3001',
      timeout: config?.timeout || 10000,
      apiKey: config?.apiKey || userConfig.apiKey
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
      }
    });

    // Request interceptor for logging in verbose mode
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.VERBOSE === 'true') {
          console.log(chalk.gray(`[API] ${config.method?.toUpperCase()} ${config.url}`));
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          console.error(chalk.red(`API Error: ${error.response.status} - ${error.response.data?.message || error.message}`));
        } else if (error.request) {
          console.error(chalk.red('Network Error: Unable to connect to API server'));
        } else {
          console.error(chalk.red(`Error: ${error.message}`));
        }
        return Promise.reject(error);
      }
    );
  }

  // Owner management
  async createOwner(data: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Owner> {
    const response: AxiosResponse<Owner> = await this.client.post('/api/owners', data);
    return response.data;
  }

  async getOwners(): Promise<Owner[]> {
    const response: AxiosResponse<Owner[]> = await this.client.get('/api/owners');
    return response.data;
  }

  async getOwner(id: string): Promise<Owner> {
    const response: AxiosResponse<Owner> = await this.client.get(`/api/owners/${id}`);
    return response.data;
  }

  async updateOwner(id: string, data: Partial<Owner>): Promise<Owner> {
    const response: AxiosResponse<Owner> = await this.client.put(`/api/owners/${id}`, data);
    return response.data;
  }

  async deleteOwner(id: string): Promise<void> {
    await this.client.delete(`/api/owners/${id}`);
  }

  // Device management
  async createDevice(data: Omit<Device, 'id' | 'lastSeen'>): Promise<Device> {
    const response: AxiosResponse<Device> = await this.client.post('/api/devices', data);
    return response.data;
  }

  async getDevices(ownerId?: string): Promise<Device[]> {
    const params = ownerId ? { ownerId } : {};
    const response: AxiosResponse<Device[]> = await this.client.get('/api/devices', { params });
    return response.data;
  }

  async getDevice(id: string): Promise<Device> {
    const response: AxiosResponse<Device> = await this.client.get(`/api/devices/${id}`);
    return response.data;
  }

  async updateDevice(id: string, data: Partial<Device>): Promise<Device> {
    const response: AxiosResponse<Device> = await this.client.put(`/api/devices/${id}`, data);
    return response.data;
  }

  async deleteDevice(id: string): Promise<void> {
    await this.client.delete(`/api/devices/${id}`);
  }

  // Metrics and monitoring
  async pullMetrics(): Promise<PullSummary> {
    const response: AxiosResponse<PullSummary> = await this.client.post('/api/metrics/pull');
    return response.data;
  }

  async getUtilizationPlan(targetUtilization: number): Promise<UtilizationPlan> {
    const response: AxiosResponse<UtilizationPlan> = await this.client.get('/api/plan/utilization', {
      params: { target: targetUtilization }
    });
    return response.data;
  }

  async getPricingSuggestions(): Promise<PricingSuggestion[]> {
    const response: AxiosResponse<PricingSuggestion[]> = await this.client.get('/api/pricing/suggestions');
    return response.data;
  }

  async applyPricingChanges(changes: Array<{ deviceId: string; newPrice: number }>): Promise<void> {
    await this.client.post('/api/pricing/apply', { changes });
  }

  async generateStatement(ownerId: string, startDate: string, endDate: string): Promise<Statement> {
    const response: AxiosResponse<Statement> = await this.client.post('/api/statements/generate', {
      ownerId,
      startDate,
      endDate
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await this.client.get('/api/health');
    return response.data;
  }
}

// Export a default instance
export const api = new ApiClient();