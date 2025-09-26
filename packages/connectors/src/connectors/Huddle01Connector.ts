import {
  ConnectorType,
  ConnectorConfig,
  NodeStatus,
  Earnings,
  Period,
  NodeMetrics,
  PricingStrategy,
  OptimizationParams,
} from '../interfaces';
import { BaseConnector } from './BaseConnector';

/**
 * Huddle01 video infrastructure connector
 * Provides access to Huddle01 decentralized video communication network
 */
export class Huddle01Connector extends BaseConnector {
  private static readonly API_ENDPOINTS = {
    NODES: '/api/v1/nodes',
    SESSIONS: '/api/v1/sessions',
    REWARDS: '/api/v1/rewards',
    BANDWIDTH: '/api/v1/bandwidth-usage',
  };

  private static readonly SCRAPER_SELECTORS = {
    nodeStats: '.node-statistics',
    sessions: '.session-metrics',
    bandwidth: '.bandwidth-usage',
    rewards: '.huddle-rewards',
  };

  constructor(config: ConnectorConfig) {
    super(ConnectorType.HUDDLE01, {
      baseUrl: 'https://api.huddle01.com',
      ...config,
    });
  }

  protected async doInitialize(): Promise<void> {
    console.log('Initializing Huddle01 connector...');

    if (this.config.apiKey) {
      try {
        await this.makeRequest('GET', '/api/v1/health');
        console.log('Huddle01 API connection established');
      } catch (error) {
        console.warn('Huddle01 API connection failed, will use mock data:', error);
      }
    }
  }

  protected requiresApiKey(): boolean {
    return true; // Huddle01 requires node operator authentication
  }

  protected requiresBaseUrl(): boolean {
    return true;
  }

  async getNodeStatus(nodeId?: string): Promise<NodeStatus | NodeStatus[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockNodeStatus(nodeId);
    }

    try {
      const endpoint = nodeId
        ? `${Huddle01Connector.API_ENDPOINTS.NODES}/${nodeId}`
        : Huddle01Connector.API_ENDPOINTS.NODES;

      const response = await this.makeRequest<any>('GET', endpoint);

      if (nodeId) {
        return this.mapApiResponseToNodeStatus(response);
      } else {
        return response.nodes?.map((node: any) => this.mapApiResponseToNodeStatus(node)) || [];
      }
    } catch (error) {
      console.warn('Huddle01 API failed, using mock data:', error);
      return this.generateMockNodeStatus(nodeId);
    }
  }

  async getEarnings(period: Period, nodeId?: string): Promise<Earnings> {
    if (this.shouldUseMockData()) {
      return this.generateMockEarnings(period);
    }

    try {
      const params = new URLSearchParams({
        start_time: period.start.toISOString(),
        end_time: period.end.toISOString(),
        ...(nodeId && { node_id: nodeId }),
      });

      const response = await this.makeRequest<any>(
        'GET',
        `${Huddle01Connector.API_ENDPOINTS.REWARDS}?${params}`,
      );

      return this.mapApiResponseToEarnings(response, period);
    } catch (error) {
      console.warn('Huddle01 earnings API failed, using mock data:', error);
      return this.generateMockEarnings(period);
    }
  }

  async getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockMetrics(nodeId);
    }

    try {
      const [sessionsResponse, bandwidthResponse] = await Promise.all([
        this.makeRequest<any>(
          'GET',
          `${Huddle01Connector.API_ENDPOINTS.SESSIONS}${nodeId ? `?node_id=${nodeId}` : ''}`,
        ),
        this.makeRequest<any>(
          'GET',
          `${Huddle01Connector.API_ENDPOINTS.BANDWIDTH}${nodeId ? `?node_id=${nodeId}` : ''}`,
        ),
      ]);

      if (nodeId) {
        return this.combineDataToMetrics(sessionsResponse, bandwidthResponse);
      } else {
        return this.generateMockMetrics();
      }
    } catch (error) {
      console.warn('Huddle01 metrics API failed, using mock data:', error);
      return this.generateMockMetrics(nodeId);
    }
  }

  async optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy> {
    if (this.shouldUseMockData()) {
      return this.generateMockPricingStrategy();
    }

    // Huddle01 pricing is based on video session hosting and bandwidth
    return {
      recommended: {
        cpu: 0.05, // For video processing
        memory: 0.02, // For session management
        storage: 0.001, // Minimal storage
        bandwidth: 0.1, // Primary cost for video streaming
      },
      market: {
        average: 0.15,
        minimum: 0.08,
        maximum: 0.25,
      },
      optimization: {
        suggestion: 'Optimize for high-quality video sessions in peak hours',
        expectedIncrease: 20,
        confidenceScore: 0.8,
      },
    };
  }

  async validateCredentials(): Promise<{
    valid: boolean;
    permissions: string[];
    limitations: string[];
  }> {
    if (!this.config.apiKey) {
      return {
        valid: false,
        permissions: [],
        limitations: ['No API key provided'],
      };
    }

    try {
      await this.makeRequest('GET', '/api/v1/auth/validate');
      return {
        valid: true,
        permissions: ['read_node_data', 'read_sessions', 'read_rewards'],
        limitations: ['Cannot modify node configuration via API'],
      };
    } catch (error) {
      return {
        valid: false,
        permissions: [],
        limitations: ['Invalid or expired API key'],
      };
    }
  }

  async getNodeIds(): Promise<string[]> {
    try {
      const nodes = (await this.getNodeStatus()) as NodeStatus[];
      return nodes.map((node) => node.id);
    } catch (error) {
      return ['HUD01-node-001', 'HUD01-node-002', 'HUD01-node-003'];
    }
  }

  // Mapping functions

  private mapApiResponseToNodeStatus(apiData: any): NodeStatus {
    return {
      id: apiData.node_id || apiData.id,
      name: apiData.name || `Huddle01 Node ${apiData.node_id?.slice(-8)}`,
      status: this.mapStatusFromApi(apiData.status),
      uptime: apiData.uptime_seconds || 0,
      lastSeen: new Date(apiData.last_heartbeat || Date.now()),
      health: {
        cpu: apiData.cpu_usage || 0,
        memory: apiData.memory_usage || 0,
        storage: apiData.storage_usage || 0,
        network: apiData.bandwidth_mbps || 0,
      },
      location: {
        country: apiData.location?.country || 'Unknown',
        region: apiData.location?.region || 'Unknown',
        latitude: apiData.location?.latitude,
        longitude: apiData.location?.longitude,
      },
      version: apiData.client_version || 'unknown',
      specs: {
        cpu: {
          cores: apiData.specs?.cpu_cores || 4,
          model: apiData.specs?.cpu_model || 'Unknown',
          frequency: apiData.specs?.cpu_frequency || 2.5,
        },
        memory: {
          total: apiData.specs?.memory_gb || 8,
          available: apiData.specs?.memory_available || 6,
        },
        storage: {
          total: apiData.specs?.storage_gb || 256,
          available: apiData.specs?.storage_available || 200,
          type: 'SSD',
        },
      },
    };
  }

  private mapApiResponseToEarnings(apiData: any, period: Period): Earnings {
    const rewards = apiData.rewards || [];
    const total = rewards.reduce((sum: number, reward: any) => sum + (reward.amount || 0), 0);

    return {
      period,
      total,
      currency: 'HUD01',
      breakdown: {
        bandwidth: total * 0.6, // Video streaming bandwidth
        compute: total * 0.3, // Video processing
        rewards: total * 0.1, // Network participation
      },
      transactions: rewards.map((reward: any) => ({
        id: reward.id,
        timestamp: new Date(reward.timestamp),
        amount: reward.amount || 0,
        type: 'earnings' as const,
        description: `Video session hosting: ${reward.session_duration || 0}min`,
        txHash: reward.transaction_hash,
      })),
      projectedMonthly: total * (30 / this.getPeriodDays(period)),
      projectedYearly: total * (365 / this.getPeriodDays(period)),
    };
  }

  private combineDataToMetrics(sessionsData: any, bandwidthData: any): NodeMetrics {
    const sessions = sessionsData.sessions || [];
    const completedSessions = sessions.filter((s: any) => s.status === 'completed');
    const failedSessions = sessions.filter((s: any) => s.status === 'failed');
    const activeSessions = sessions.filter((s: any) => s.status === 'active');

    return {
      performance: {
        tasksCompleted: completedSessions.length,
        tasksActive: activeSessions.length,
        tasksFailed: failedSessions.length,
        averageTaskDuration: this.calculateAverageSessionDuration(completedSessions),
        successRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
      },
      resource_utilization: {
        cpu: sessionsData.avg_cpu_usage || 0,
        memory: sessionsData.avg_memory_usage || 0,
        storage: sessionsData.avg_storage_usage || 0,
        bandwidth: bandwidthData.current_usage_mbps || 0,
      },
      earnings: {
        hourly: sessionsData.earnings?.hourly || 0,
        daily: sessionsData.earnings?.daily || 0,
        weekly: sessionsData.earnings?.weekly || 0,
        monthly: sessionsData.earnings?.monthly || 0,
      },
      network: {
        latency: bandwidthData.avg_latency || 50,
        throughput: bandwidthData.max_throughput || 100,
        uptime: sessionsData.uptime_percentage || 98,
      },
      reputation: {
        score: sessionsData.quality_score || 8.5,
        rank: sessionsData.node_rank || 500,
        totalNodes: sessionsData.total_nodes || 3000,
      },
    };
  }

  private mapStatusFromApi(apiStatus: string): 'online' | 'offline' | 'maintenance' | 'error' {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'hosting':
        return 'online';
      case 'maintenance':
      case 'updating':
        return 'maintenance';
      case 'error':
      case 'failed':
        return 'error';
      default:
        return 'offline';
    }
  }

  private calculateAverageSessionDuration(sessions: any[]): number {
    if (sessions.length === 0) {
      return 0;
    }

    const totalDuration = sessions.reduce((sum, session) => {
      return sum + (session.duration_seconds || 0);
    }, 0);

    return totalDuration / sessions.length;
  }

  private getPeriodDays(period: Period): number {
    return Math.max(
      1,
      Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }
}
