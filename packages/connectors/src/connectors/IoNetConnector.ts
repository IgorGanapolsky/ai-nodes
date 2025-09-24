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
 * IO.NET GPU node connector
 * Provides access to IO.NET decentralized GPU compute network
 */
export class IoNetConnector extends BaseConnector {
  private static readonly API_ENDPOINTS = {
    NODE_STATUS: '/api/v1/nodes',
    EARNINGS: '/api/v1/earnings',
    METRICS: '/api/v1/metrics',
    PRICING: '/api/v1/pricing'
  };

  private static readonly SCRAPER_SELECTORS = {
    nodeStatus: '.node-status-card',
    earnings: '.earnings-summary',
    totalEarnings: '.total-earnings .amount',
    activeNodes: '.active-nodes-count',
    gpuUtilization: '.gpu-utilization'
  };

  constructor(config: ConnectorConfig) {
    super(ConnectorType.IONET, {
      baseUrl: 'https://api.io.net',
      ...config
    });
  }

  protected async doInitialize(): Promise<void> {
    // IO.NET specific initialization
    console.log('Initializing IO.NET connector...');

    // Test API connectivity if API key is provided
    if (this.config.apiKey) {
      try {
        await this.makeRequest('GET', '/api/v1/health');
        console.log('IO.NET API connection established');
      } catch (error) {
        console.warn('IO.NET API connection failed, will use mock data:', error);
      }
    }
  }

  protected requiresApiKey(): boolean {
    return true; // IO.NET typically requires API authentication
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
        `${IoNetConnector.API_ENDPOINTS.NODE_STATUS}/${nodeId}` :
        IoNetConnector.API_ENDPOINTS.NODE_STATUS;

      const response = await this.makeRequest<any>('GET', endpoint);

      if (nodeId) {
        return this.mapApiResponseToNodeStatus(response);
      } else {
        return response.nodes?.map((node: any) => this.mapApiResponseToNodeStatus(node)) || [];
      }
    } catch (error) {
      console.warn('IO.NET API failed, attempting scraper fallback:', error);
      return await this.getNodeStatusViaScraper(nodeId);
    }
  }

  private async getNodeStatusViaScraper(nodeId?: string): Promise<NodeStatus | NodeStatus[]> {
    if (!this.scraper) {
      return this.generateMockNodeStatus(nodeId);
    }

    try {
      const dashboardUrl = 'https://cloud.io.net/dashboard';
      const scrapedData = await this.scrapeData(dashboardUrl, IoNetConnector.SCRAPER_SELECTORS);

      // Parse scraped data and convert to NodeStatus format
      // This would require real implementation based on actual IO.NET dashboard structure
      console.log('Scraped IO.NET data:', scrapedData);

      // For now, return mock data as scraper implementation needs actual dashboard structure
      return this.generateMockNodeStatus(nodeId);
    } catch (error) {
      console.warn('IO.NET scraper failed, using mock data:', error);
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
        `${IoNetConnector.API_ENDPOINTS.EARNINGS}?${params}`
      );

      return this.mapApiResponseToEarnings(response, period);
    } catch (error) {
      console.warn('IO.NET earnings API failed, using mock data:', error);
      return this.generateMockEarnings(period);
    }
  }

  async getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockMetrics(nodeId);
    }

    try {
      const endpoint = nodeId ?
        `${IoNetConnector.API_ENDPOINTS.METRICS}/${nodeId}` :
        IoNetConnector.API_ENDPOINTS.METRICS;

      const response = await this.makeRequest<any>('GET', endpoint);

      if (nodeId) {
        return this.mapApiResponseToMetrics(response);
      } else {
        return response.metrics?.map((metric: any) => this.mapApiResponseToMetrics(metric)) || [];
      }
    } catch (error) {
      console.warn('IO.NET metrics API failed, using mock data:', error);
      return this.generateMockMetrics(nodeId);
    }
  }

  async optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy> {
    if (this.shouldUseMockData()) {
      return this.generateMockPricingStrategy();
    }

    try {
      const requestData = {
        ...params,
        ...(nodeId && { nodeId })
      };

      const response = await this.makeRequest<any>(
        'POST',
        IoNetConnector.API_ENDPOINTS.PRICING,
        requestData
      );

      return this.mapApiResponseToPricingStrategy(response);
    } catch (error) {
      console.warn('IO.NET pricing optimization API failed, using mock data:', error);
      return this.generateMockPricingStrategy();
    }
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
        limitations: ['No API key provided']
      };
    }

    try {
      await this.makeRequest('GET', '/api/v1/auth/validate');
      return {
        valid: true,
        permissions: ['read_nodes', 'read_earnings', 'read_metrics'],
        limitations: []
      };
    } catch (error) {
      return {
        valid: false,
        permissions: [],
        limitations: ['Invalid or expired API key']
      };
    }
  }

  async getNodeIds(): Promise<string[]> {
    try {
      const nodes = await this.getNodeStatus() as NodeStatus[];
      return nodes.map(node => node.id);
    } catch (error) {
      // Return mock node IDs
      return [
        'IO-gpu-node-001',
        'IO-gpu-node-002',
        'IO-gpu-node-003'
      ];
    }
  }

  // Mapping functions to convert API responses to standard format

  private mapApiResponseToNodeStatus(apiData: any): NodeStatus {
    return {
      id: apiData.node_id || apiData.id,
      name: apiData.name || `IO.NET Node ${apiData.node_id}`,
      status: this.mapStatusFromApi(apiData.status),
      uptime: apiData.uptime_seconds || 0,
      lastSeen: new Date(apiData.last_seen || Date.now()),
      health: {
        cpu: apiData.cpu_usage || 0,
        memory: apiData.memory_usage || 0,
        storage: apiData.storage_usage || 0,
        network: apiData.network_speed || 0
      },
      location: {
        country: apiData.location?.country || 'Unknown',
        region: apiData.location?.region || 'Unknown',
        latitude: apiData.location?.lat,
        longitude: apiData.location?.lng
      },
      version: apiData.version,
      specs: {
        cpu: {
          cores: apiData.specs?.cpu_cores || 0,
          model: apiData.specs?.cpu_model || 'Unknown',
          frequency: apiData.specs?.cpu_frequency || 0
        },
        memory: {
          total: apiData.specs?.memory_total || 0,
          available: apiData.specs?.memory_available || 0
        },
        storage: {
          total: apiData.specs?.storage_total || 0,
          available: apiData.specs?.storage_available || 0,
          type: apiData.specs?.storage_type || 'SSD'
        },
        gpu: apiData.specs?.gpu ? {
          model: apiData.specs.gpu.model,
          memory: apiData.specs.gpu.memory,
          compute: apiData.specs.gpu.compute_power
        } : undefined
      }
    };
  }

  private mapApiResponseToEarnings(apiData: any, period: Period): Earnings {
    return {
      period,
      total: apiData.total_earnings || 0,
      currency: 'IO',
      breakdown: {
        compute: apiData.compute_earnings || 0,
        rewards: apiData.rewards || 0
      },
      transactions: apiData.transactions?.map((tx: any) => ({
        id: tx.id,
        timestamp: new Date(tx.timestamp),
        amount: tx.amount,
        type: tx.type,
        description: tx.description,
        txHash: tx.tx_hash
      })) || [],
      projectedMonthly: apiData.projected_monthly,
      projectedYearly: apiData.projected_yearly
    };
  }

  private mapApiResponseToMetrics(apiData: any): NodeMetrics {
    return {
      performance: {
        tasksCompleted: apiData.tasks_completed || 0,
        tasksActive: apiData.tasks_active || 0,
        tasksFailed: apiData.tasks_failed || 0,
        averageTaskDuration: apiData.avg_task_duration || 0,
        successRate: apiData.success_rate || 0
      },
      resource_utilization: {
        cpu: apiData.cpu_utilization || 0,
        memory: apiData.memory_utilization || 0,
        storage: apiData.storage_utilization || 0,
        bandwidth: apiData.bandwidth_utilization || 0,
        gpu: apiData.gpu_utilization
      },
      earnings: {
        hourly: apiData.earnings?.hourly || 0,
        daily: apiData.earnings?.daily || 0,
        weekly: apiData.earnings?.weekly || 0,
        monthly: apiData.earnings?.monthly || 0
      },
      network: {
        latency: apiData.network?.latency || 0,
        throughput: apiData.network?.throughput || 0,
        uptime: apiData.network?.uptime || 0
      },
      reputation: apiData.reputation ? {
        score: apiData.reputation.score,
        rank: apiData.reputation.rank,
        totalNodes: apiData.reputation.total_nodes
      } : undefined
    };
  }

  private mapApiResponseToPricingStrategy(apiData: any): PricingStrategy {
    return {
      recommended: {
        cpu: apiData.recommended?.cpu_price || 0,
        memory: apiData.recommended?.memory_price || 0,
        storage: apiData.recommended?.storage_price || 0,
        bandwidth: apiData.recommended?.bandwidth_price || 0,
        gpu: apiData.recommended?.gpu_price
      },
      market: {
        average: apiData.market?.average || 0,
        minimum: apiData.market?.minimum || 0,
        maximum: apiData.market?.maximum || 0
      },
      optimization: {
        suggestion: apiData.optimization?.suggestion || 'No optimization available',
        expectedIncrease: apiData.optimization?.expected_increase || 0,
        confidenceScore: apiData.optimization?.confidence || 0
      }
    };
  }

  private mapStatusFromApi(apiStatus: string): 'online' | 'offline' | 'maintenance' | 'error' {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
      case 'running':
      case 'online':
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
}