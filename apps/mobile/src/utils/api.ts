import { ApiResponse, Node, EarningsData, Settings } from '../types';

const BASE_URL = 'https://api.ai-nodes.com/v1';

class ApiClient {
  private apiKey: string = '';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
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

  async getNodes(): Promise<ApiResponse<Node[]>> {
    return this.request<Node[]>('/nodes');
  }

  async getNode(nodeId: string): Promise<ApiResponse<Node>> {
    return this.request<Node>(`/nodes/${nodeId}`);
  }

  async createNode(nodeData: Partial<Node>): Promise<ApiResponse<Node>> {
    return this.request<Node>('/nodes', {
      method: 'POST',
      body: JSON.stringify(nodeData),
    });
  }

  async updateNode(nodeId: string, nodeData: Partial<Node>): Promise<ApiResponse<Node>> {
    return this.request<Node>(`/nodes/${nodeId}`, {
      method: 'PUT',
      body: JSON.stringify(nodeData),
    });
  }

  async deleteNode(nodeId: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/nodes/${nodeId}`, {
      method: 'DELETE',
    });
  }

  async getEarnings(nodeId?: string, timeRange?: string): Promise<ApiResponse<EarningsData[]>> {
    const params = new URLSearchParams();
    if (nodeId) params.append('nodeId', nodeId);
    if (timeRange) params.append('timeRange', timeRange);

    return this.request<EarningsData[]>(`/earnings?${params.toString()}`);
  }

  async triggerReinvest(): Promise<ApiResponse<{ amount: number; status: string }>> {
    return this.request<{ amount: number; status: string }>('/reinvest', {
      method: 'POST',
    });
  }

  async getSettings(): Promise<ApiResponse<Settings>> {
    return this.request<Settings>('/settings');
  }

  async updateSettings(settings: Partial<Settings>): Promise<ApiResponse<Settings>> {
    return this.request<Settings>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export const apiClient = new ApiClient();
