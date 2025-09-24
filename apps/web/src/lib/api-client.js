import axios from 'axios';
class ApiClient {
    client;
    constructor() {
        this.client = axios.create({
            baseURL: '/api/v1',
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response) {
                const message = error.response.data?.message || error.response.statusText;
                throw new Error(`API Error (${error.response.status}): ${message}`);
            }
            else if (error.request) {
                throw new Error('API Error: No response from server');
            }
            else {
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
    async getMetricsSummary(timeframe = '24h') {
        const response = await this.client.get('/metrics/summary', {
            params: { timeframe }
        });
        return response.data;
    }
    async getAlerts(params) {
        const response = await this.client.get('/metrics/alerts', { params });
        return response.data;
    }
    async healthCheck() {
        const response = await this.client.get('/health');
        return response.data;
    }
}
export const apiClient = new ApiClient();
