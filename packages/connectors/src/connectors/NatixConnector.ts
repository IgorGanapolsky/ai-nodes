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
 * Natix mapping network connector
 * Provides access to Natix decentralized mapping and location data network
 */
export class NatixConnector extends BaseConnector {
  private static readonly API_ENDPOINTS = {
    DRIVERS: '/api/v1/drivers',
    EARNINGS: '/api/v1/rewards',
    TRIPS: '/api/v1/trips',
    MAPPING_DATA: '/api/v1/mapping-contributions'
  };

  private static readonly SCRAPER_SELECTORS = {
    earnings: '.driver-earnings',
    trips: '.completed-trips',
    mapData: '.mapping-contributions',
    rewards: '.natix-rewards'
  };

  constructor(config: ConnectorConfig) {
    super(ConnectorType.NATIX, {
      baseUrl: 'https://api.natix.network',
      ...config
    });
  }

  protected async doInitialize(): Promise<void> {
    console.log('Initializing Natix connector...');

    if (this.config.apiKey) {
      try {
        await this.makeRequest('GET', '/api/v1/status');
        console.log('Natix API connection established');
      } catch (error) {
        console.warn('Natix API connection failed, will use mock data:', error);
      }
    }
  }

  protected requiresApiKey(): boolean {
    return true; // Natix requires driver authentication
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
        `${NatixConnector.API_ENDPOINTS.DRIVERS}/${nodeId}` :
        NatixConnector.API_ENDPOINTS.DRIVERS;

      const response = await this.makeRequest<any>('GET', endpoint);

      if (nodeId) {
        return this.mapDriverToNodeStatus(response);
      } else {
        return response.drivers?.map((driver: any) => this.mapDriverToNodeStatus(driver)) || [];
      }
    } catch (error) {
      console.warn('Natix API failed, using mock data:', error);
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
        ...(nodeId && { driver_id: nodeId })
      });

      const response = await this.makeRequest<any>(
        'GET',
        `${NatixConnector.API_ENDPOINTS.EARNINGS}?${params}`
      );

      return this.mapApiResponseToEarnings(response, period);
    } catch (error) {
      console.warn('Natix earnings API failed, using mock data:', error);
      return this.generateMockEarnings(period);
    }
  }

  async getMetrics(nodeId?: string): Promise<NodeMetrics | NodeMetrics[]> {
    if (this.shouldUseMockData()) {
      return this.generateMockMetrics(nodeId);
    }

    try {
      const [tripsResponse, mappingResponse] = await Promise.all([
        this.makeRequest<any>('GET', `${NatixConnector.API_ENDPOINTS.TRIPS}${nodeId ? `?driver_id=${nodeId}` : ''}`),
        this.makeRequest<any>('GET', `${NatixConnector.API_ENDPOINTS.MAPPING_DATA}${nodeId ? `?driver_id=${nodeId}` : ''}`)
      ]);

      if (nodeId) {
        return this.combineDataToMetrics(tripsResponse, mappingResponse);
      } else {
        // For multiple drivers, we'd need to group the data
        return this.generateMockMetrics();
      }
    } catch (error) {
      console.warn('Natix metrics API failed, using mock data:', error);
      return this.generateMockMetrics(nodeId);
    }
  }

  async optimizePricing(params: OptimizationParams, nodeId?: string): Promise<PricingStrategy> {
    // Natix uses contribution-based rewards rather than traditional pricing
    return {
      recommended: {
        cpu: 0, // Not applicable for driving/mapping
        memory: 0,
        storage: 0.01, // Small amount for storing mapping data
        bandwidth: 0.005 // For uploading mapping data
      },
      market: {
        average: 0.015,
        minimum: 0.01,
        maximum: 0.02
      },
      optimization: {
        suggestion: 'Drive in areas with low mapping coverage to maximize rewards',
        expectedIncrease: 25,
        confidenceScore: 0.7
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
      await this.makeRequest('GET', '/api/v1/auth/verify');
      return {
        valid: true,
        permissions: ['read_driver_data', 'read_trips', 'read_rewards'],
        limitations: ['Cannot modify driver profile via API']
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
      const drivers = await this.getNodeStatus() as NodeStatus[];
      return drivers.map(driver => driver.id);
    } catch (error) {
      return [
        'NATIX-driver-001',
        'NATIX-driver-002',
        'NATIX-driver-003'
      ];
    }
  }

  // Mapping functions

  private mapDriverToNodeStatus(driver: any): NodeStatus {
    return {
      id: driver.driver_id || driver.id,
      name: driver.name || `Natix Driver ${driver.driver_id?.slice(-8)}`,
      status: this.mapStatusFromApi(driver.status),
      uptime: driver.active_time_seconds || 0,
      lastSeen: new Date(driver.last_trip || driver.last_active || Date.now()),
      health: {
        cpu: 20, // Mobile device CPU usage
        memory: 30, // Mobile app memory usage
        storage: driver.storage_usage || 5,
        network: driver.data_upload_speed || 10
      },
      location: {
        country: driver.location?.country || 'Unknown',
        region: driver.location?.region || 'Unknown',
        latitude: driver.last_location?.lat,
        longitude: driver.last_location?.lng
      },
      version: driver.app_version || 'unknown',
      specs: {
        cpu: {
          cores: 4, // Typical mobile device
          model: driver.device?.model || 'Mobile Device',
          frequency: 2.5
        },
        memory: {
          total: 6, // Typical mobile RAM
          available: 4
        },
        storage: {
          total: 128, // Typical mobile storage
          available: 100,
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
      currency: 'NATIX',
      breakdown: {
        bandwidth: total * 0.4, // Data upload rewards
        rewards: total * 0.6    // Mapping contribution rewards
      },
      transactions: rewards.map((reward: any) => ({
        id: reward.id,
        timestamp: new Date(reward.timestamp),
        amount: reward.amount || 0,
        type: 'earnings' as const,
        description: `Mapping contribution: ${reward.contribution_type || 'road data'}`,
        txHash: reward.transaction_hash
      })),
      projectedMonthly: total * (30 / this.getPeriodDays(period)),
      projectedYearly: total * (365 / this.getPeriodDays(period))
    };
  }

  private combineDataToMetrics(tripsData: any, mappingData: any): NodeMetrics {
    const trips = tripsData.trips || [];
    const mappingContributions = mappingData.contributions || [];

    return {
      performance: {
        tasksCompleted: trips.length + mappingContributions.length,
        tasksActive: tripsData.active_trips || 0,
        tasksFailed: tripsData.failed_uploads || 0,
        averageTaskDuration: tripsData.avg_trip_duration || 1800, // 30 minutes
        successRate: tripsData.upload_success_rate || 95
      },
      resource_utilization: {
        cpu: 20, // Mobile app usage
        memory: 25,
        storage: mappingData.storage_used_mb / 1024 || 5,
        bandwidth: mappingData.data_uploaded_mb || 10
      },
      earnings: {
        hourly: tripsData.earnings?.hourly || 0,
        daily: tripsData.earnings?.daily || 0,
        weekly: tripsData.earnings?.weekly || 0,
        monthly: tripsData.earnings?.monthly || 0
      },
      network: {
        latency: tripsData.avg_upload_latency || 100,
        throughput: tripsData.avg_upload_speed || 5,
        uptime: tripsData.connection_uptime || 90
      },
      reputation: {
        score: mappingData.quality_score || 8.0,
        rank: mappingData.driver_rank || 2000,
        totalNodes: mappingData.total_drivers || 15000
      }
    };
  }

  private mapStatusFromApi(apiStatus: string): 'online' | 'offline' | 'maintenance' | 'error' {
    switch (apiStatus?.toLowerCase()) {
      case 'active':
      case 'driving':
      case 'online':
        return 'online';
      case 'maintenance':
      case 'updating':
        return 'maintenance';
      case 'error':
      case 'suspended':
        return 'error';
      default:
        return 'offline';
    }
  }

  private getPeriodDays(period: Period): number {
    return Math.max(1, Math.ceil((period.end.getTime() - period.start.getTime()) / (1000 * 60 * 60 * 24)));
  }
}