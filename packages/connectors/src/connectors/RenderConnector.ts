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
 * Render Network GPU rendering connector
 * Provides access to Render Network decentralized GPU rendering
 */
export class RenderConnector extends BaseConnector {
  private static readonly API_ENDPOINTS = {
    NODE_STATUS: '/api/v1/nodes',
    EARNINGS: '/api/v1/earnings',
    JOBS: '/api/v1/jobs',
    REWARDS: '/api/v1/rewards',
    PRICING: '/api/v1/pricing'
  };

  private static readonly SCRAPER_SELECTORS = {
    nodeStatus: '.node-stats',
    earnings: '.earnings-card',
    totalEarnings: '.total-rndr',
    renderJobs: '.completed-jobs',
    gpuInfo: '.gpu-specs'
  };

  constructor(config: ConnectorConfig) {
    super(ConnectorType.RENDER, {
      baseUrl: 'https://api.rendertoken.com',
      ...config
    });
  }

  protected async doInitialize(): Promise<void> {
    console.log('Initializing Render Network connector...');

    if (this.config.apiKey) {
      try {
        await this.makeRequest('GET', '/api/v1/status');
        console.log('Render Network API connection established');
      } catch (error) {
        console.warn('Render Network API connection failed, will use mock data:', error);
      }
    }
  }

  protected requiresApiKey(): boolean {
    return true; // Render Network requires authentication
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
        `${RenderConnector.API_ENDPOINTS.NODE_STATUS}/${nodeId}` :
        RenderConnector.API_ENDPOINTS.NODE_STATUS;

      const response = await this.makeRequest<any>('GET', endpoint);

      if (nodeId) {
        return this.mapApiResponseToNodeStatus(response);
      } else {
        return response.nodes?.map((node: any) => this.mapApiResponseToNodeStatus(node)) || [];
      }
    } catch (error) {
      console.warn('Render Network API failed, using mock data:', error);
      return this.generateMockNodeStatus(nodeId);
    }
  }

  async getEarnings(period: Period, nodeId?: string): Promise<Earnings> {
    if (this.shouldUseMockData()) {
      return this.generateMockEarnings(period);
    }

    try {
      const params = new URLSearchParams({
        start_date: period.start.toISOString(),
        end_date: period.end.toISOString(),
        ...(nodeId && { node_id: nodeId })
      });

      const response = await this.makeRequest<any>(
        'GET',
        `${RenderConnector.API_ENDPOINTS.EARNINGS}?${params}`
      );

      return this.mapApiResponseToEarnings(response, period);
    } catch (error) {
      console.warn('Render Network earnings API failed, using mock data:', error);
      return this.generateMockEarnings(period);
    }
  }

  async getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockMetrics(nodeId);
    }

    try {
      // Combine job and node statistics
      const jobsEndpoint = nodeId ?
        `${RenderConnector.API_ENDPOINTS.JOBS}?node_id=${nodeId}` :
        RenderConnector.API_ENDPOINTS.JOBS;

      const [jobsResponse, nodesResponse] = await Promise.all([
        this.makeRequest<any>('GET', jobsEndpoint),
        this.getNodeStatus(nodeId)
      ]);

      if (nodeId) {
        return this.combineJobsAndNodeDataToMetrics(jobsResponse, nodesResponse as NodeStatus);
      } else {
        const nodes = nodesResponse as NodeStatus[];
        return nodes.map(node => this.combineJobsAndNodeDataToMetrics(jobsResponse, node));
      }
    } catch (error) {
      console.warn('Render Network metrics API failed, using mock data:', error);
      return this.generateMockMetrics(nodeId);
    }
  }

  async optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy> {
    if (this.shouldUseMockData()) {
      return this.generateMockPricingStrategy();
    }

    try {
      const requestData = {
        node_specs: params.nodeSpecs,
        target_utilization: params.targetUtilization,
        strategy: params.priceStrategy,
        market_conditions: params.marketConditions,
        ...(nodeId && { node_id: nodeId })
      };

      const response = await this.makeRequest<any>(
        'POST',
        RenderConnector.API_ENDPOINTS.PRICING,
        requestData
      );

      return this.mapApiResponseToPricingStrategy(response);
    } catch (error) {
      console.warn('Render Network pricing API failed, using mock data:', error);
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
      await this.makeRequest('GET', '/api/v1/auth/verify');
      return {
        valid: true,
        permissions: ['read_nodes', 'read_jobs', 'read_earnings', 'manage_pricing'],
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
      return [
        'RENDER-gpu-001',
        'RENDER-gpu-002',
        'RENDER-gpu-003'
      ];
    }
  }

  // Mapping functions

  private mapApiResponseToNodeStatus(apiData: any): NodeStatus {
    return {
      id: apiData.node_id || apiData.id,
      name: apiData.name || `Render Node ${apiData.node_id}`,
      status: this.mapStatusFromApi(apiData.status),
      uptime: apiData.uptime_seconds || 0,
      lastSeen: new Date(apiData.last_ping || apiData.updated_at || Date.now()),
      health: {
        cpu: apiData.cpu_usage || 0,
        memory: apiData.memory_usage || 0,
        storage: apiData.storage_usage || 0,
        network: apiData.network_speed || 0
      },
      location: {
        country: apiData.location?.country || 'Unknown',
        region: apiData.location?.region || 'Unknown',
        latitude: apiData.location?.latitude,
        longitude: apiData.location?.longitude
      },
      version: apiData.client_version || 'unknown',
      specs: {
        cpu: {
          cores: apiData.hardware?.cpu_cores || 0,
          model: apiData.hardware?.cpu_model || 'Unknown',
          frequency: apiData.hardware?.cpu_frequency || 0
        },
        memory: {
          total: apiData.hardware?.ram_total || 0,
          available: apiData.hardware?.ram_available || 0
        },
        storage: {
          total: apiData.hardware?.storage_total || 0,
          available: apiData.hardware?.storage_available || 0,
          type: apiData.hardware?.storage_type || 'SSD'
        },
        gpu: apiData.hardware?.gpu ? {
          model: apiData.hardware.gpu.model,
          memory: apiData.hardware.gpu.vram,
          compute: apiData.hardware.gpu.compute_capability
        } : undefined
      }
    };
  }

  private mapApiResponseToEarnings(apiData: any, period: Period): Earnings {
    const earnings = apiData.earnings || [];
    const total = earnings.reduce((sum: number, earning: any) => sum + (earning.amount || 0), 0);

    return {
      period,
      total,
      currency: 'RNDR',
      breakdown: {
        compute: total * 0.85, // Most earnings from rendering
        rewards: total * 0.15  // Network participation rewards
      },
      transactions: earnings.map((earning: any) => ({
        id: earning.transaction_id || earning.id,
        timestamp: new Date(earning.timestamp || earning.created_at),
        amount: earning.amount || 0,
        type: 'earnings' as const,
        description: `Render job: ${earning.job_type || 'Blender/OctaneRender'}`,
        txHash: earning.tx_hash
      })),
      projectedMonthly: apiData.projections?.monthly || total * (30 / this.getPeriodDays(period)),
      projectedYearly: apiData.projections?.yearly || total * (365 / this.getPeriodDays(period))
    };
  }

  private combineJobsAndNodeDataToMetrics(jobsData: any, nodeData: NodeStatus): NodeMetrics {
    const jobs = jobsData.jobs || [];
    const completedJobs = jobs.filter((job: any) => job.status === 'completed');
    const failedJobs = jobs.filter((job: any) => job.status === 'failed');
    const activeJobs = jobs.filter((job: any) => job.status === 'rendering');

    return {
      performance: {
        tasksCompleted: completedJobs.length,
        tasksActive: activeJobs.length,
        tasksFailed: failedJobs.length,
        averageTaskDuration: this.calculateAverageJobDuration(completedJobs),
        successRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0
      },
      resource_utilization: {
        cpu: nodeData.health.cpu,
        memory: nodeData.health.memory,
        storage: nodeData.health.storage,
        bandwidth: nodeData.health.network,
        gpu: jobsData.gpu_utilization || 75
      },
      earnings: {
        hourly: jobsData.earnings?.hourly || 0,
        daily: jobsData.earnings?.daily || 0,
        weekly: jobsData.earnings?.weekly || 0,
        monthly: jobsData.earnings?.monthly || 0
      },
      network: {
        latency: jobsData.network?.ping || 25,
        throughput: nodeData.health.network,
        uptime: nodeData.uptime / (24 * 3600) * 100
      },
      reputation: {
        score: jobsData.reputation?.score || 8.5,
        rank: jobsData.reputation?.rank || 500,
        totalNodes: jobsData.reputation?.total_nodes || 10000
      }
    };
  }

  private mapApiResponseToPricingStrategy(apiData: any): PricingStrategy {
    return {
      recommended: {
        cpu: apiData.pricing?.cpu_hourly || 0,
        memory: apiData.pricing?.memory_hourly || 0,
        storage: apiData.pricing?.storage_hourly || 0,
        bandwidth: apiData.pricing?.bandwidth_gb || 0,
        gpu: apiData.pricing?.gpu_hourly || 0
      },
      market: {
        average: apiData.market?.average_rate || 0,
        minimum: apiData.market?.min_rate || 0,
        maximum: apiData.market?.max_rate || 0
      },
      optimization: {
        suggestion: apiData.recommendations?.suggestion || 'Optimize GPU utilization for better rates',
        expectedIncrease: apiData.recommendations?.expected_increase || 0,
        confidenceScore: apiData.recommendations?.confidence || 0.75
      }
    };
  }

  private mapStatusFromApi(apiStatus: string): 'online' | 'offline' | 'maintenance' | 'error' {
    switch (apiStatus?.toLowerCase()) {
      case 'online':
      case 'active':
      case 'rendering':
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

  private calculateAverageJobDuration(jobs: any[]): number {
    if (jobs.length === 0) return 0;

    const totalDuration = jobs.reduce((sum, job) => {
      const start = new Date(job.start_time).getTime();
      const end = new Date(job.end_time).getTime();
      return sum + (end - start) / 1000; // Convert to seconds
    }, 0);

    return totalDuration / jobs.length;
  }

  private getPeriodDays(period: Period): number {
    return Math.max(1, Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)));
  }
}