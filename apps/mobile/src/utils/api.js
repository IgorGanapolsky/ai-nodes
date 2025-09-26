const BASE_URL = 'https://api.ai-nodes.com/v1';
class ApiClient {
  apiKey = '';
  setApiKey(apiKey) {
    this.apiKey = apiKey;
  }
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
          ...options.headers,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
  async getNodes() {
    return this.request('/nodes');
  }
  async getNode(nodeId) {
    return this.request(`/nodes/${nodeId}`);
  }
  async createNode(nodeData) {
    return this.request('/nodes', {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  }
  async updateNode(nodeId, nodeData) {
    return this.request(`/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(nodeData),
    });
  }
  async deleteNode(nodeId) {
    return this.request(`/nodes/${nodeId}`, {
      method: 'DELETE',
    });
  }
  async getEarnings(nodeId, timeRange) {
    const params = new URLSearchParams();
    if (nodeId) params.append('nodeId', nodeId);
    if (timeRange) params.append('timeRange', timeRange);
    return this.request(`/earnings?${params.toString()}`);
  }
  async triggerReinvest() {
    return this.request('/reinvest', {
      method: 'POST',
    });
  }
  async getSettings() {
    return this.request('/settings');
  }
  async updateSettings(settings) {
    return this.request('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}
export const apiClient = new ApiClient();
