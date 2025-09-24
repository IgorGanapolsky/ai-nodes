import axios from 'axios';
import { config } from '../commands/config.js';
export class ApiClient {
    client;
    constructor(baseURL) {
        const apiUrl = baseURL || config.get('apiUrl') || 'http://localhost:3001';
        this.client = axios.create({
            baseURL: `${apiUrl}/api/v1`,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'DePIN-Autopilot-CLI/1.0.0'
            }
        });
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            if (process.env.DEBUG || global.process?.argv?.includes('--verbose')) {
                console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
            }
            return config;
        }, (error) => Promise.reject(error));
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                // Server responded with error status
                const message = error.response.data?.message || error.response.statusText;
                throw new Error(`API Error (${error.response.status}): ${message}`);
            }
            else if (error.request) {
                // Request was made but no response received
                throw new Error('API Error: No response from server. Is the server running?');
            }
            else {
                // Something else happened
                throw new Error(`API Error: ${error.message}`);
            }
        });
    }
    async getNodes(params) {
        const response = await this.client.get('/nodes', { params });
        return response.data;
    }
    async getNode(nodeId) {
        const response = await this.client.get(`/nodes/${nodeId}`);
        return response.data;
    }
    async createNode(data) {
        const response = await this.client.post('/nodes', data);
        return response.data;
    }
    async updateNode(nodeId, data) {
        const response = await this.client.put(`/nodes/${nodeId}`, data);
        return response.data;
    }
    async deleteNode(nodeId) {
        await this.client.delete(`/nodes/${nodeId}`);
    }
    async getMetricsSummary(timeframe = '24h') {
        const response = await this.client.get('/metrics/summary', {
            params: { timeframe }
        });
        return response.data;
    }
    async getNodeMetrics(nodeId, timeframe = '24h') {
        const response = await this.client.get(`/metrics/nodes/${nodeId}`, {
            params: { timeframe }
        });
        return response.data;
    }
    async getAlerts(params) {
        const response = await this.client.get('/metrics/alerts', { params });
        return response.data;
    }
    async reportMetrics(nodeId, metrics) {
        const response = await this.client.post(`/metrics/nodes/${nodeId}/report`, {
            metrics,
            timestamp: new Date().toISOString()
        });
        return response.data;
    }
    async healthCheck() {
        const response = await this.client.get('/health');
        return response.data;
    }
}
