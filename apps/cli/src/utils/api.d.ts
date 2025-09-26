export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  apiKey?: string;
}
export interface Owner {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  createdAt: string;
  updatedAt: string;
}
export interface Device {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  status: 'online' | 'offline' | 'maintenance';
  lastSeen: string;
  metrics?: DeviceMetrics;
}
export interface DeviceMetrics {
  grossRevenue24h: number;
  grossRevenue7d: number;
  utilization: number;
  uptime: number;
}
export interface PullSummary {
  totalDevices: number;
  onlineDevices: number;
  totalRevenue24h: number;
  totalRevenue7d: number;
  averageUtilization: number;
  lastUpdated: string;
}
export interface UtilizationPlan {
  currentUtilization: number;
  targetUtilization: number;
  requiredDevices: number;
  estimatedRevenue: number;
  recommendations: string[];
}
export interface PricingSuggestion {
  deviceId: string;
  currentPrice: number;
  suggestedPrice: number;
  reason: string;
  expectedImpact: string;
}
export interface Statement {
  ownerId: string;
  period: string;
  devices: Device[];
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  generatedAt: string;
}
export declare class ApiClient {
  private client;
  private config;
  constructor(config?: Partial<ApiConfig>);
  createOwner(data: Omit<Owner, 'id' | 'createdAt' | 'updatedAt'>): Promise<Owner>;
  getOwners(): Promise<Owner[]>;
  getOwner(id: string): Promise<Owner>;
  updateOwner(id: string, data: Partial<Owner>): Promise<Owner>;
  deleteOwner(id: string): Promise<void>;
  createDevice(data: Omit<Device, 'id' | 'lastSeen'>): Promise<Device>;
  getDevices(ownerId?: string): Promise<Device[]>;
  getDevice(id: string): Promise<Device>;
  updateDevice(id: string, data: Partial<Device>): Promise<Device>;
  deleteDevice(id: string): Promise<void>;
  pullMetrics(): Promise<PullSummary>;
  getUtilizationPlan(targetUtilization: number): Promise<UtilizationPlan>;
  getPricingSuggestions(): Promise<PricingSuggestion[]>;
  applyPricingChanges(
    changes: Array<{
      deviceId: string;
      newPrice: number;
    }>,
  ): Promise<void>;
  generateStatement(ownerId: string, startDate: string, endDate: string): Promise<Statement>;
  healthCheck(): Promise<{
    status: string;
    timestamp: string;
  }>;
}
export declare const api: ApiClient;
//# sourceMappingURL=api.d.ts.map
