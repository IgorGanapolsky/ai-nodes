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
 * Grass bandwidth sharing connector
 * Provides access to Grass network for bandwidth monetization
 */
export class GrassConnector extends BaseConnector {
  private static readonly API_ENDPOINTS = {
    USER_INFO: '/api/v1/user',
    EARNINGS: '/api/v1/earnings',
    DEVICES: '/api/v1/devices',
    BANDWIDTH: '/api/v1/bandwidth-stats'
  };

  private static readonly SCRAPER_SELECTORS = {
    earnings: '.earnings-display',
    devices: '.device-list',
    bandwidth: '.bandwidth-stats',
    points: '.points-earned'
  };

  constructor(config: ConnectorConfig) {
    super(ConnectorType.GRASS, {
      baseUrl: 'https://api.grass.io',
      ...config
    });
  }

  protected async doInitialize(): Promise<void> {
    console.log('Initializing Grass connector...');

    if (this.config.apiKey) {
      try {
        await this.makeRequest('GET', GrassConnector.API_ENDPOINTS.USER_INFO);
        console.log('Grass API connection established');
      } catch (error) {
        console.warn('Grass API connection failed, will use mock data:', error);
      }
    }
  }

  protected requiresApiKey(): boolean {
    return true; // Grass requires user authentication
  }

  protected requiresBaseUrl(): boolean {
    return true;
  }

  async getNodeStatus(nodeId?: string): Promise<NodeStatus | NodeStatus[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockNodeStatus(nodeId);
    }

    try {
      const devicesResponse = await this.makeRequest<any>('GET', GrassConnector.API_ENDPOINTS.DEVICES);
      const devices = devicesResponse.devices || [];

      if (nodeId) {
        const device = devices.find((d: any) => d.id === nodeId);
        return device ? this.mapDeviceToNodeStatus(device) : this.generateMockNodeStatus(nodeId);
      } else {
        return devices.map((device: any) => this.mapDeviceToNodeStatus(device));
      }
    } catch (error) {
      console.warn('Grass devices API failed, using mock data:', error);
      return this.generateMockNodeStatus(nodeId);
    }
  }

  async getEarnings(period: Period, nodeId?: string): Promise<Earnings> {
    if (this.shouldUseMockData()) {
      return this.generateMockEarnings(period);
    }

    try {
      const params = new URLSearchParams({
        from: period.start.toISOString(),
        to: period.end.toISOString(),
        ...(nodeId && { device_id: nodeId })
      });

      const response = await this.makeRequest<any>(
        'GET',
        `${GrassConnector.API_ENDPOINTS.EARNINGS}?${params}`
      );

      return this.mapApiResponseToEarnings(response, period);
    } catch (error) {
      console.warn('Grass earnings API failed, using mock data:', error);
      return this.generateMockEarnings(period);
    }
  }

  async getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockMetrics(nodeId);
    }

    try {
      const [bandwidthResponse, devicesResponse] = await Promise.all([
        this.makeRequest<any>('GET', GrassConnector.API_ENDPOINTS.BANDWIDTH),
        this.makeRequest<any>('GET', GrassConnector.API_ENDPOINTS.DEVICES)
      ]);

      const devices = devicesResponse.devices || [];

      if (nodeId) {
        const device = devices.find((d: any) => d.id === nodeId);
        return device ? this.mapDeviceToMetrics(device, bandwidthResponse) : this.generateMockMetrics(nodeId);
      } else {
        return devices.map((device: any) => this.mapDeviceToMetrics(device, bandwidthResponse));
      }
    } catch (error) {
      console.warn('Grass metrics API failed, using mock data:', error);
      return this.generateMockMetrics(nodeId);
    }
  }

  async optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy> {
    // Grass doesn't have traditional pricing optimization as it's bandwidth sharing
    // Return strategy focused on bandwidth optimization
    return {
      recommended: {
        cpu: 0, // Not applicable for bandwidth sharing
        memory: 0,
        storage: 0,
        bandwidth: 0.001 // Small fee per GB
      },
      market: {
        average: 0.001,
        minimum: 0.0005,
        maximum: 0.002
      },
      optimization: {
        suggestion: 'Maximize uptime and bandwidth allocation to increase earnings',
        expectedIncrease: 10,
        confidenceScore: 0.85
      }
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
        limitations: ['No API key provided']
      };
    }

    try {
      await this.makeRequest('GET', GrassConnector.API_ENDPOINTS.USER_INFO);
      return {
        valid: true,
        permissions: ['read_user_data', 'read_devices', 'read_earnings'],
        limitations: ['Cannot modify device settings via API']
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
      const devices = await this.getNodeStatus() as NodeStatus[];
      return devices.map(device => device.id);
    } catch (error) {
      return [
        'GRASS-device-001',
        'GRASS-device-002',
        'GRASS-device-003'
      ];
    }
  }

  // Mapping functions

  private mapDeviceToNodeStatus(device: any): NodeStatus {
    return {
      id: device.id || device.device_id,
      name: device.name || `Grass Device ${device.id?.slice(-8)}`,
      status: this.mapStatusFromApi(device.status),
      uptime: device.uptime_seconds || 0,
      lastSeen: new Date(device.last_active || Date.now()),
      health: {
        cpu: device.cpu_usage || 10, // Low CPU for bandwidth sharing
        memory: device.memory_usage || 5, // Low memory usage
        storage: device.storage_usage || 1, // Minimal storage
        network: device.bandwidth_mbps || 0
      },
      location: {
        country: device.location?.country || 'Unknown',
        region: device.location?.region || 'Unknown',
        latitude: device.location?.lat,
        longitude: device.location?.lng
      },
      version: device.app_version || 'unknown',
      specs: {
        cpu: {
          cores: device.specs?.cpu_cores || 2,
          model: device.specs?.cpu_model || 'Unknown',
          frequency: device.specs?.cpu_frequency || 2.0
        },
        memory: {
          total: device.specs?.memory_gb || 4,
          available: device.specs?.memory_available || 3
        },
        storage: {
          total: device.specs?.storage_gb || 100,
          available: device.specs?.storage_available || 80,
          type: 'SSD'
        }
      }
    };
  }

  private mapApiResponseToEarnings(apiData: any, period: Period): Earnings {
    const earnings = apiData.earnings || [];
    const points = apiData.total_points || 0;
    // Convert points to estimated token value (this would need real conversion rate)
    const estimatedValue = points * 0.001; // Example conversion rate

    return {
      period,
      total: estimatedValue,
      currency: 'GRASS',
      breakdown: {
        bandwidth: estimatedValue * 0.9,
        rewards: estimatedValue * 0.1
      },
      transactions: earnings.map((earning: any) => ({
        id: earning.id,
        timestamp: new Date(earning.timestamp),
        amount: earning.points * 0.001, // Convert points to tokens
        type: 'earnings' as const,
        description: `Bandwidth sharing: ${earning.bandwidth_gb || 0}GB`,
        txHash: earning.transaction_hash
      })),
      projectedMonthly: estimatedValue * (30 / this.getPeriodDays(period)),
      projectedYearly: estimatedValue * (365 / this.getPeriodDays(period))
    };
  }

  private mapDeviceToMetrics(device: any, bandwidthData: any): NodeMetrics {
    const deviceBandwidth = bandwidthData.devices?.find((d: any) => d.id === device.id);

    return {
      performance: {
        tasksCompleted: device.sessions_completed || 0,
        tasksActive: device.active_sessions || 0,
        tasksFailed: device.failed_sessions || 0,
        averageTaskDuration: device.avg_session_duration || 3600, // 1 hour default
        successRate: device.success_rate || 98
      },
      resource_utilization: {
        cpu: device.cpu_usage || 5,
        memory: device.memory_usage || 3,
        storage: device.storage_usage || 1,
        bandwidth: deviceBandwidth?.current_mbps || 0
      },
      earnings: {
        hourly: device.earnings?.hourly || 0,
        daily: device.earnings?.daily || 0,
        weekly: device.earnings?.weekly || 0,
        monthly: device.earnings?.monthly || 0
      },
      network: {
        latency: device.ping_ms || 30,
        throughput: deviceBandwidth?.max_mbps || 100,
        uptime: device.uptime_percentage || 95
      },
      reputation: {
        score: device.reputation_score || 9.0,
        rank: device.rank || 1000,
        totalNodes: bandwidthData.total_devices || 50000
      }
    };
  }

  private mapStatusFromApi(apiStatus: string): 'online' | 'offline' | 'maintenance' | 'error' {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
      case 'online':
      case 'sharing':
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