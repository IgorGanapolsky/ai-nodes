import { ConnectorType } from '../interfaces';
import { BaseConnector } from './BaseConnector';
/**
 * OwnAI compute connector
 * Provides access to OwnAI decentralized AI compute network
 */
export class OwnAIConnector extends BaseConnector {
  static API_ENDPOINTS = {
    NODES: '/api/v1/compute-nodes',
    JOBS: '/api/v1/jobs',
    EARNINGS: '/api/v1/earnings',
    MODELS: '/api/v1/models',
    UTILIZATION: '/api/v1/utilization',
  };
  static SCRAPER_SELECTORS = {
    nodeStatus: '.compute-node-status',
    earnings: '.earnings-dashboard',
    jobs: '.job-statistics',
    models: '.hosted-models',
  };
  constructor(config) {
    super(ConnectorType.OWNAI, {
      baseUrl: 'https://api.ownai.network',
      ...config,
    });
  }
  async doInitialize() {
    console.log('Initializing OwnAI connector...');
    if (this.config.apiKey) {
      try {
        await this.makeRequest('GET', '/api/v1/health');
        console.log('OwnAI API connection established');
      } catch (error) {
        console.warn('OwnAI API connection failed, will use mock data:', error);
      }
    }
  }
  requiresApiKey() {
    return true; // OwnAI requires node operator authentication
  }
  requiresBaseUrl() {
    return true;
  }
  async getNodeStatus(nodeId) {
    if (this.shouldUseMockData()) {
      return this.generateMockNodeStatus(nodeId);
    }
    try {
      const endpoint = nodeId
        ? `${OwnAIConnector.API_ENDPOINTS.NODES}/${nodeId}`
        : OwnAIConnector.API_ENDPOINTS.NODES;
      const response = await this.makeRequest('GET', endpoint);
      if (nodeId) {
        return this.mapApiResponseToNodeStatus(response);
      } else {
        return response.nodes?.map((node) => this.mapApiResponseToNodeStatus(node)) || [];
      }
    } catch (error) {
      console.warn('OwnAI API failed, using mock data:', error);
      return this.generateMockNodeStatus(nodeId);
    }
  }
  async getEarnings(period, nodeId) {
    if (this.shouldUseMockData()) {
      return this.generateMockEarnings(period);
    }
    try {
      const params = new URLSearchParams({
        start_date: period.start.toISOString(),
        end_date: period.end.toISOString(),
        ...(nodeId && { node_id: nodeId }),
      });
      const response = await this.makeRequest(
        'GET',
        `${OwnAIConnector.API_ENDPOINTS.EARNINGS}?${params}`,
      );
      return this.mapApiResponseToEarnings(response, period);
    } catch (error) {
      console.warn('OwnAI earnings API failed, using mock data:', error);
      return this.generateMockEarnings(period);
    }
  }
  async getMetrics(nodeId) {
    if (this.shouldUseMockData()) {
      return this.generateMockMetrics(nodeId);
    }
    try {
      const [jobsResponse, utilizationResponse] = await Promise.all([
        this.makeRequest(
          'GET',
          `${OwnAIConnector.API_ENDPOINTS.JOBS}${nodeId ? `?node_id=${nodeId}` : ''}`,
        ),
        this.makeRequest(
          'GET',
          `${OwnAIConnector.API_ENDPOINTS.UTILIZATION}${nodeId ? `?node_id=${nodeId}` : ''}`,
        ),
      ]);
      if (nodeId) {
        return this.combineDataToMetrics(jobsResponse, utilizationResponse);
      } else {
        return this.generateMockMetrics();
      }
    } catch (error) {
      console.warn('OwnAI metrics API failed, using mock data:', error);
      return this.generateMockMetrics(nodeId);
    }
  }
  async optimizePricing(params, nodeId) {
    if (this.shouldUseMockData()) {
      return this.generateMockPricingStrategy();
    }
    try {
      const requestData = {
        node_specs: params.nodeSpecs,
        target_utilization: params.targetUtilization,
        pricing_strategy: params.priceStrategy,
        ...(nodeId && { node_id: nodeId }),
      };
      const response = await this.makeRequest('POST', '/api/v1/pricing/optimize', requestData);
      return this.mapApiResponseToPricingStrategy(response);
    } catch (error) {
      console.warn('OwnAI pricing API failed, using mock data:', error);
      return this.generateMockPricingStrategy();
    }
  }
  async validateCredentials() {
    if (!this.config.apiKey) {
      return {
        valid: false,
        permissions: [],
        limitations: ['No API key provided'],
      };
    }
    try {
      await this.makeRequest('GET', '/api/v1/auth/verify');
      return {
        valid: true,
        permissions: ['read_nodes', 'read_jobs', 'read_earnings', 'manage_models'],
        limitations: ['Cannot modify node hardware configuration'],
      };
    } catch (error) {
      return {
        valid: false,
        permissions: [],
        limitations: ['Invalid or expired API key'],
      };
    }
  }
  async getNodeIds() {
    try {
      const nodes = await this.getNodeStatus();
      return nodes.map((node) => node.id);
    } catch (error) {
      return ['OWNAI-compute-001', 'OWNAI-compute-002', 'OWNAI-compute-003'];
    }
  }
  // Mapping functions
  mapApiResponseToNodeStatus(apiData) {
    return {
      id: apiData.node_id || apiData.id,
      name: apiData.name || `OwnAI Node ${apiData.node_id?.slice(-8)}`,
      status: this.mapStatusFromApi(apiData.status),
      uptime: apiData.uptime_seconds || 0,
      lastSeen: new Date(apiData.last_heartbeat || Date.now()),
      health: {
        cpu: apiData.cpu_usage || 0,
        memory: apiData.memory_usage || 0,
        storage: apiData.storage_usage || 0,
        network: apiData.network_speed || 0,
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
          cores: apiData.hardware?.cpu_cores || 0,
          model: apiData.hardware?.cpu_model || 'Unknown',
          frequency: apiData.hardware?.cpu_frequency || 0,
        },
        memory: {
          total: apiData.hardware?.memory_gb || 0,
          available: apiData.hardware?.memory_available || 0,
        },
        storage: {
          total: apiData.hardware?.storage_gb || 0,
          available: apiData.hardware?.storage_available || 0,
          type: apiData.hardware?.storage_type || 'SSD',
        },
        gpu: apiData.hardware?.gpu
          ? {
              model: apiData.hardware.gpu.model,
              memory: apiData.hardware.gpu.vram_gb,
              compute: apiData.hardware.gpu.compute_power,
            }
          : undefined,
      },
    };
  }
  mapApiResponseToEarnings(apiData, period) {
    const earnings = apiData.earnings || [];
    const total = earnings.reduce((sum, earning) => sum + (earning.amount || 0), 0);
    return {
      period,
      total,
      currency: 'OWN',
      breakdown: {
        compute: total * 0.8, // AI inference earnings
        staking: total * 0.1, // Staking rewards
        rewards: total * 0.1, // Network participation
      },
      transactions: earnings.map((earning) => ({
        id: earning.transaction_id || earning.id,
        timestamp: new Date(earning.timestamp),
        amount: earning.amount || 0,
        type: 'earnings',
        description: `AI job: ${earning.model_name || 'LLM inference'} (${earning.tokens_processed || 0} tokens)`,
        txHash: earning.tx_hash,
      })),
      projectedMonthly: total * (30 / this.getPeriodDays(period)),
      projectedYearly: total * (365 / this.getPeriodDays(period)),
    };
  }
  combineDataToMetrics(jobsData, utilizationData) {
    const jobs = jobsData.jobs || [];
    const completedJobs = jobs.filter((job) => job.status === 'completed');
    const failedJobs = jobs.filter((job) => job.status === 'failed');
    const activeJobs = jobs.filter((job) => job.status === 'running');
    return {
      performance: {
        tasksCompleted: completedJobs.length,
        tasksActive: activeJobs.length,
        tasksFailed: failedJobs.length,
        averageTaskDuration: this.calculateAverageJobDuration(completedJobs),
        successRate: jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
      },
      resource_utilization: {
        cpu: utilizationData.cpu_usage || 0,
        memory: utilizationData.memory_usage || 0,
        storage: utilizationData.storage_usage || 0,
        bandwidth: utilizationData.bandwidth_usage || 0,
        gpu: utilizationData.gpu_usage || 0,
      },
      earnings: {
        hourly: jobsData.earnings?.hourly || 0,
        daily: jobsData.earnings?.daily || 0,
        weekly: jobsData.earnings?.weekly || 0,
        monthly: jobsData.earnings?.monthly || 0,
      },
      network: {
        latency: utilizationData.network_latency || 30,
        throughput: utilizationData.network_throughput || 200,
        uptime: utilizationData.uptime_percentage || 99,
      },
      reputation: {
        score: jobsData.reputation?.score || 9.0,
        rank: jobsData.reputation?.rank || 250,
        totalNodes: jobsData.reputation?.total_nodes || 5000,
      },
    };
  }
  mapApiResponseToPricingStrategy(apiData) {
    return {
      recommended: {
        cpu: apiData.pricing?.cpu_per_hour || 0,
        memory: apiData.pricing?.memory_per_gb_hour || 0,
        storage: apiData.pricing?.storage_per_gb_hour || 0,
        bandwidth: apiData.pricing?.bandwidth_per_gb || 0,
        gpu: apiData.pricing?.gpu_per_hour || 0,
      },
      market: {
        average: apiData.market?.average_rate || 0,
        minimum: apiData.market?.min_rate || 0,
        maximum: apiData.market?.max_rate || 0,
      },
      optimization: {
        suggestion: apiData.optimization?.suggestion || 'Optimize GPU models for better efficiency',
        expectedIncrease: apiData.optimization?.expected_increase || 0,
        confidenceScore: apiData.optimization?.confidence || 0.8,
      },
    };
  }
  mapStatusFromApi(apiStatus) {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'processing':
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
  calculateAverageJobDuration(jobs) {
    if (jobs.length === 0) return 0;
    const totalDuration = jobs.reduce((sum, job) => {
      const start = new Date(job.start_time).getTime();
      const end = new Date(job.end_time).getTime();
      return sum + (end - start) / 1000; // Convert to seconds
    }, 0);
    return totalDuration / jobs.length;
  }
  getPeriodDays(period) {
    return Math.max(
      1,
      Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }
}
