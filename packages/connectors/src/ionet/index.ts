import type { Connector, Device, Metric, DeviceSpecifications } from '../types';
import axios from 'axios';
import * as playwright from 'playwright';

export interface IoNetConfig {
  apiKey?: string;
  email?: string;
  password?: string;
  useHeadless?: boolean;
}

export class IoNetConnector implements Connector {
  readonly name = 'ionet';
  readonly displayName = 'io.net';
  readonly supportedDeviceTypes = ['gpu', 'cpu'] as const;
  readonly requiresAuth = true;
  readonly pollInterval = 300000; // 5 minutes

  private config: IoNetConfig;
  private browser?: playwright.Browser;
  private authToken?: string;

  constructor(config: IoNetConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      if (this.config.apiKey) {
        // Use API key if provided
        this.authToken = this.config.apiKey;
        return await this.validateAuth();
      } else if (this.config.email && this.config.password) {
        // Use headless browser for dashboard login
        return await this.loginViaPlaywright();
      }
      throw new Error('No authentication method provided');
    } catch (error) {
      console.error('IoNet connection failed:', error);
      return false;
    }
  }

  private async validateAuth(): Promise<boolean> {
    try {
      const response = await axios.get('https://api.io.net/v1/workers', {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private async loginViaPlaywright(): Promise<boolean> {
    try {
      this.browser = await playwright.chromium.launch({
        headless: this.config.useHeadless !== false
      });
      const page = await this.browser.newPage();

      // Navigate to io.net login
      await page.goto('https://cloud.io.net/login');
      await page.fill('input[name="email"]', this.config.email!);
      await page.fill('input[name="password"]', this.config.password!);
      await page.click('button[type="submit"]');

      // Wait for dashboard load
      await page.waitForURL('**/dashboard/**', { timeout: 10000 });

      // Extract auth token from localStorage or cookies
      this.authToken = await page.evaluate(() => {
        return localStorage.getItem('auth_token') || '';
      });

      return !!this.authToken;
    } catch (error) {
      console.error('Playwright login failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async fetchDevices(ownerId: string): Promise<Device[]> {
    try {
      const response = await axios.get('https://api.io.net/v1/workers', {
        headers: { 'Authorization': `Bearer ${this.authToken}` }
      });

      return response.data.workers.map((worker: any) => ({
        id: worker.id,
        ownerId,
        marketplace: 'ionet',
        externalId: worker.id,
        name: worker.name || `Worker ${worker.id}`,
        type: worker.gpu_model ? 'gpu' : 'cpu',
        status: worker.is_online ? 'online' : 'offline',
        location: {
          country: worker.country || 'Unknown',
          city: worker.city || 'Unknown',
          region: worker.region || 'Unknown',
        },
        specifications: this.mapSpecifications(worker),
        currentPrice: worker.price_per_hour || 0,
        currentUtilization: worker.utilization || 0,
        totalEarnings: worker.total_earnings || 0,
        lastSeen: new Date(worker.last_seen || Date.now()),
        metadata: {
          gpu_model: worker.gpu_model,
          gpu_count: worker.gpu_count,
          block_rewards: worker.block_rewards,
        }
      }));
    } catch (error) {
      console.error('Failed to fetch io.net devices:', error);
      return [];
    }
  }

  private mapSpecifications(worker: any): DeviceSpecifications {
    return {
      cpu: {
        model: worker.cpu_model || 'Unknown',
        cores: worker.cpu_cores || 0,
        threads: worker.cpu_threads || 0,
        frequency: worker.cpu_freq || 0,
      },
      gpu: worker.gpu_model ? {
        model: worker.gpu_model,
        memory: worker.gpu_vram || 0,
        count: worker.gpu_count || 1,
      } : undefined,
      memory: {
        total: worker.ram || 0,
        type: 'DDR4',
        frequency: 0,
      },
      storage: {
        total: worker.disk || 0,
        type: worker.disk_type || 'SSD',
        nvme: worker.disk_type === 'NVMe',
      },
      network: {
        upload: worker.bandwidth_up || 0,
        download: worker.bandwidth_down || 0,
        latency: worker.latency || 0,
      },
    };
  }

  async fetchMetrics(deviceId: string, since?: Date): Promise<Metric[]> {
    try {
      const params = since ? `?since=${since.toISOString()}` : '?period=24h';
      const response = await axios.get(
        `https://api.io.net/v1/workers/${deviceId}/metrics${params}`,
        { headers: { 'Authorization': `Bearer ${this.authToken}` } }
      );

      return response.data.metrics.map((m: any) => ({
        deviceId,
        timestamp: new Date(m.timestamp),
        utilization: m.utilization || 0,
        earnings: {
          gross: m.earnings || 0,
          net: m.earnings * 0.9975, // 0.25% platform fee
          currency: 'IO',
        },
        performance: {
          hashrate: m.hashrate,
          temperature: m.temperature,
          power: m.power_consumption,
          memory_usage: m.memory_usage,
          gpu_usage: m.gpu_usage,
        },
        jobs: {
          completed: m.jobs_completed || 0,
          failed: m.jobs_failed || 0,
          active: m.jobs_active || 0,
        },
      }));
    } catch (error) {
      console.error('Failed to fetch io.net metrics:', error);
      return [];
    }
  }

  async getEarnings(deviceId: string, period: 'today' | 'week' | 'month'): Promise<number> {
    try {
      const response = await axios.get(
        `https://api.io.net/v1/workers/${deviceId}/earnings?period=${period}`,
        { headers: { 'Authorization': `Bearer ${this.authToken}` } }
      );

      // Returns IO tokens earned
      const ioTokens = response.data.total_earnings || 0;

      // Convert IO to USD (you'd fetch real price)
      const ioPrice = await this.getIoPrice();
      return ioTokens * ioPrice;
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
      return 0;
    }
  }

  private async getIoPrice(): Promise<number> {
    try {
      // In production, use CoinGecko or similar API
      const response = await axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=io-net&vs_currencies=usd'
      );
      return response.data['io-net']?.usd || 1.5; // Fallback price
    } catch {
      return 1.5; // Default fallback
    }
  }

  async applyPricing(deviceId: string, newPrice: number): Promise<boolean> {
    // io.net doesn't have public API for pricing changes
    // Return suggested price for manual application
    console.log(`Suggested price for ${deviceId}: $${newPrice}/hour`);
    console.log('Please apply manually at: https://cloud.io.net/workers/' + deviceId);
    return false; // Indicate manual action needed
  }

  async executeAction(deviceId: string, action: string, params?: any): Promise<any> {
    switch (action) {
      case 'restart':
        // Would need dashboard automation
        return { success: false, message: 'Manual restart required via dashboard' };
      case 'check_health':
        return this.fetchDevices('').then(devices =>
          devices.find(d => d.externalId === deviceId)?.status === 'online'
        );
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
  }

  async health(): Promise<boolean> {
    return this.validateAuth();
  }
}

export default IoNetConnector;