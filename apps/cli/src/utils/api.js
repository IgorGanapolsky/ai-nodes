import axios from 'axios';
import chalk from 'chalk';
import { readConfig } from './config.js';
export class ApiClient {
  client;
  config;
  constructor(config) {
    const userConfig = readConfig();
    this.config = {
      baseURL: config?.baseURL || userConfig.apiUrl || 'http://localhost:3001',
      timeout: config?.timeout || 10000,
      apiKey: config?.apiKey || userConfig.apiKey,
    };
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...(this.config.apiKey && { Authorization: `Bearer ${this.config.apiKey}` }),
      },
    });
    // Request interceptor for logging in verbose mode
    this.client.interceptors.request.use(
      (config) => {
        if (process.env.VERBOSE === 'true') {
          console.log(chalk.gray(`[API] ${config.method?.toUpperCase()} ${config.url}`));
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
          console.error(
            chalk.red(
              `API Error: ${error.response.status} - ${error.response.data?.message || error.message}`,
            ),
          );
        } else if (error.request) {
          console.error(chalk.red('Network Error: Unable to connect to API server'));
        } else {
          console.error(chalk.red(`Error: ${error.message}`));
        }
        return Promise.reject(error);
      },
    );
  }
  // Owner management
  async createOwner(data) {
    const response = await this.client.post('/api/owners', data);
    return response.data;
  }
  async getOwners() {
    const response = await this.client.get('/api/owners');
    return response.data;
  }
  async getOwner(id) {
    const response = await this.client.get(`/api/owners/${id}`);
    return response.data;
  }
  async updateOwner(id, data) {
    const response = await this.client.put(`/api/owners/${id}`, data);
    return response.data;
  }
  async deleteOwner(id) {
    await this.client.delete(`/api/owners/${id}`);
  }
  // Device management
  async createDevice(data) {
    const response = await this.client.post('/api/devices', data);
    return response.data;
  }
  async getDevices(ownerId) {
    const params = ownerId ? { ownerId } : {};
    const response = await this.client.get('/api/devices', { params });
    return response.data;
  }
  async getDevice(id) {
    const response = await this.client.get(`/api/devices/${id}`);
    return response.data;
  }
  async updateDevice(id, data) {
    const response = await this.client.put(`/api/devices/${id}`, data);
    return response.data;
  }
  async deleteDevice(id) {
    await this.client.delete(`/api/devices/${id}`);
  }
  // Metrics and monitoring
  async pullMetrics() {
    const response = await this.client.post('/api/metrics/pull');
    return response.data;
  }
  async getUtilizationPlan(targetUtilization) {
    const response = await this.client.get('/api/plan/utilization', {
      params: { target: targetUtilization },
    });
    return response.data;
  }
  async getPricingSuggestions() {
    const response = await this.client.get('/api/pricing/suggestions');
    return response.data;
  }
  async applyPricingChanges(changes) {
    await this.client.post('/api/pricing/apply', { changes });
  }
  async generateStatement(ownerId, startDate, endDate) {
    const response = await this.client.post('/api/statements/generate', {
      ownerId,
      startDate,
      endDate,
    });
    return response.data;
  }
  // Health check
  async healthCheck() {
    const response = await this.client.get('/api/health');
    return response.data;
  }
}
// Export a default instance
export const api = new ApiClient();
