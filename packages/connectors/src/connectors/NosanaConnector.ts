import {
  ConnectorType,
  ConnectorConfig,
  NodeStatus,
  Earnings,
  Period,
  NodeMetrics,
  PricingStrategy,
  OptimizationParams
} from '../interfaces';
import { BaseConnector } from './BaseConnector';

/**
 * Nosana AI compute connector
 * Provides access to Nosana decentralized AI inference network
 */
export class NosanaConnector extends BaseConnector {
  private static readonly API_ENDPOINTS = {
    NODE_STATUS: '/api/v1/nodes',
    EARNINGS: '/api/v1/rewards',
    METRICS: '/api/v1/stats',
    JOBS: '/api/v1/jobs',
    MARKETS: '/api/v1/markets'
  };

  private static readonly SCRAPER_SELECTORS = {
    nodeStatus: '.node-card',
    earnings: '.rewards-panel',
    totalRewards: '.total-rewards .amount',
    activeJobs: '.active-jobs-count',
    stakeAmount: '.stake-amount'
  };

  constructor(config: ConnectorConfig) {
    super(ConnectorType.NOSANA, {
      baseUrl: 'https://explorer.nosana.io',
      ...config
    });
  }

  protected async doInitialize(): Promise<void> {
    console.log('Initializing Nosana connector...');

    if (this.config.apiKey) {
      try {
        await this.makeRequest('GET', '/api/v1/health');
        console.log('Nosana API connection established');
      } catch (error) {
        console.warn('Nosana API connection failed, will use mock data:', error);
      }
    }
  }

  protected requiresApiKey(): boolean {
    return false; // Nosana explorer API is mostly public
  }

  protected requiresBaseUrl(): boolean {
    return true;
  }

  async getNodeStatus(nodeId?: string): Promise<NodeStatus | NodeStatus[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockNodeStatus(nodeId);
    }

    try {
      const endpoint = nodeId ?
        `${NosanaConnector.API_ENDPOINTS.NODE_STATUS}/${nodeId}` :
        NosanaConnector.API_ENDPOINTS.NODE_STATUS;

      const response = await this.makeRequest<any>('GET', endpoint);

      if (nodeId) {
        return this.mapApiResponseToNodeStatus(response);
      } else {
        return response.nodes?.map((node: any) => this.mapApiResponseToNodeStatus(node)) || [];
      }
    } catch (error) {
      console.warn('Nosana API failed, using mock data:', error);
      return this.generateMockNodeStatus(nodeId);
    }
  }

  async getEarnings(period: Period, nodeId?: string): Promise<Earnings> {
    if (this.shouldUseMockData()) {
      return this.generateMockEarnings(period);
    }

    try {
      const params = new URLSearchParams({
        start: period.start.toISOString(),
        end: period.end.toISOString(),
        ...(nodeId && { nodeId })
      });

      const response = await this.makeRequest<any>(
        'GET',
        `${NosanaConnector.API_ENDPOINTS.EARNINGS}?${params}`
      );

      return this.mapApiResponseToEarnings(response, period);
    } catch (error) {
      console.warn('Nosana earnings API failed, using mock data:', error);
      return this.generateMockEarnings(period);
    }
  }

  async getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockMetrics(nodeId);
    }

    try {
      const endpoint = nodeId ?
        `${NosanaConnector.API_ENDPOINTS.METRICS}/${nodeId}` :
        NosanaConnector.API_ENDPOINTS.METRICS;

      const response = await this.makeRequest<any>('GET', endpoint);

      if (nodeId) {
        return this.mapApiResponseToMetrics(response);
      } else {
        return response.stats?.map((stat: any) => this.mapApiResponseToMetrics(stat)) || [];
      }
    } catch (error) {
      console.warn('Nosana metrics API failed, using mock data:', error);
      return this.generateMockMetrics(nodeId);
    }
  }

  async optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy> {
    if (this.shouldUseMockData()) {
      return this.generateMockPricingStrategy();
    }

    try {
      // Nosana uses market-based pricing through jobs
      const marketsResponse = await this.makeRequest<any>('GET', NosanaConnector.API_ENDPOINTS.MARKETS);
      return this.mapMarketsResponseToPricingStrategy(marketsResponse, params);
    } catch (error) {
      console.warn('Nosana pricing API failed, using mock data:', error);
      return this.generateMockPricingStrategy();
    }
  }

  async validateCredentials(): Promise<{
    valid: boolean;
    permissions: string[];
    limitations: string[];
  }> {
    // Nosana explorer API is mostly public, so we just check connectivity
    try {
      await this.makeRequest('GET', '/api/v1/health');
      return {
        valid: true,
        permissions: ['read_public_data'],
        limitations: ['No private node data without wallet connection']
      };
    } catch (error) {
      return {
        valid: false,
        permissions: [],
        limitations: ['Cannot connect to Nosana API']
      };
    }
  }

  async getNodeIds(): Promise<string[]> {
    try {
      const nodes = await this.getNodeStatus() as NodeStatus[];
      return nodes.map(node => node.id);
    } catch (error) {
      return [
        'NOSANA-node-001',
        'NOSANA-node-002',
        'NOSANA-node-003'
      ];
    }
  }

  // Mapping functions

  private mapApiResponseToNodeStatus(apiData: any): NodeStatus {
    return {
      id: apiData.address || apiData.id,
      name: apiData.name || `Nosana Node ${apiData.address?.slice(-8)}`,
      status: this.mapStatusFromApi(apiData.status || apiData.state),
      uptime: apiData.uptime || 0,
      lastSeen: new Date(apiData.last_seen || apiData.updated_at || Date.now()),
      health: {
        cpu: apiData.cpu_usage || 0,
        memory: apiData.memory_usage || 0,
        storage: apiData.disk_usage || 0,
        network: apiData.bandwidth || 0
      },
      location: {
        country: apiData.location?.country || 'Unknown',
        region: apiData.location?.region || 'Unknown'
      },
      version: apiData.version || 'unknown',
      specs: {
        cpu: {
          cores: apiData.specs?.cpu_cores || 4,
          model: apiData.specs?.cpu_model || 'Unknown CPU',
          frequency: apiData.specs?.cpu_frequency || 2.5
        },
        memory: {
          total: apiData.specs?.memory_total || 16,
          available: apiData.specs?.memory_available || 8
        },
        storage: {
          total: apiData.specs?.storage_total || 512,
          available: apiData.specs?.storage_available || 256,
          type: 'SSD'
        }
      }
    };
  }

  private mapApiResponseToEarnings(apiData: any, period: Period): Earnings {
    const rewards = apiData.rewards || [];
    const total = rewards.reduce((sum: number, reward: any) => sum + (reward.amount || 0), 0);

    return {
      period,
      total,
      currency: 'NOS',
      breakdown: {
        compute: total * 0.7,
        staking: total * 0.3
      },
      transactions: rewards.map((reward: any) => ({
        id: reward.id || reward.signature,
        timestamp: new Date(reward.timestamp || reward.created_at),
        amount: reward.amount || 0,
        type: 'earnings' as const,
        description: `Job completion: ${reward.job_type || 'AI inference'}`,
        txHash: reward.signature
      })),
      projectedMonthly: total * (30 / this.getPeriodDays(period)),
      projectedYearly: total * (365 / this.getPeriodDays(period))
    };
  }

  private mapApiResponseToMetrics(apiData: any): NodeMetrics {
    return {
      performance: {
        tasksCompleted: apiData.jobs_completed || 0,
        tasksActive: apiData.jobs_active || 0,
        tasksFailed: apiData.jobs_failed || 0,
        averageTaskDuration: apiData.avg_job_duration || 0,
        successRate: apiData.success_rate || 95
      },
      resource_utilization: {
        cpu: apiData.cpu_usage || 0,
        memory: apiData.memory_usage || 0,
        storage: apiData.storage_usage || 0,
        bandwidth: apiData.network_usage || 0
      },
      earnings: {
        hourly: apiData.earnings?.hourly || 0,
        daily: apiData.earnings?.daily || 0,
        weekly: apiData.earnings?.weekly || 0,
        monthly: apiData.earnings?.monthly || 0
      },
      network: {
        latency: apiData.latency || 50,
        throughput: apiData.throughput || 100,
        uptime: apiData.uptime_percentage || 99
      },
      reputation: {
        score: apiData.reputation_score || 8.5,
        rank: apiData.rank || 1000,
        totalNodes: apiData.total_nodes || 5000
      }
    };
  }

  private mapMarketsResponseToPricingStrategy(apiData: any, params: OptimizationParams): PricingStrategy {
    const markets = apiData.markets || [];
    const avgPrice = markets.reduce((sum: number, market: any) => sum + (market.price || 0), 0) / markets.length;

    return {
      recommended: {
        cpu: avgPrice * 0.8,
        memory: avgPrice * 0.1,
        storage: avgPrice * 0.05,
        bandwidth: avgPrice * 0.05
      },
      market: {
        average: avgPrice,
        minimum: Math.min(...markets.map((m: any) => m.price || 0)),
        maximum: Math.max(...markets.map((m: any) => m.price || 0))
      },
      optimization: {
        suggestion: 'Consider staking more NOS tokens to increase job priority',
        expectedIncrease: 15,
        confidenceScore: 0.8
      }
    };
  }

  private mapStatusFromApi(apiStatus: string): 'online' | 'offline' | 'maintenance' | 'error' {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'running':
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

  private getPeriodDays(period: Period): number {
    return Math.max(1, Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)));
  }
}