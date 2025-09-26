import { ApiResponse, Node, EarningsData, Settings } from '../types';
declare class ApiClient {
  private apiKey;
  setApiKey(apiKey: string): void;
  private request;
  getNodes(): Promise<ApiResponse<Node[]>>;
  getNode(nodeId: string): Promise<ApiResponse<Node>>;
  createNode(nodeData: Partial<Node>): Promise<ApiResponse<Node>>;
  updateNode(nodeId: string, nodeData: Partial<Node>): Promise<ApiResponse<Node>>;
  deleteNode(nodeId: string): Promise<ApiResponse<void>>;
  getEarnings(nodeId?: string, timeRange?: string): Promise<ApiResponse<EarningsData[]>>;
  triggerReinvest(): Promise<
    ApiResponse<{
      amount: number;
      status: string;
    }>
  >;
  getSettings(): Promise<ApiResponse<Settings>>;
  updateSettings(settings: Partial<Settings>): Promise<ApiResponse<Settings>>;
}
export declare const apiClient: ApiClient;
export {};
//# sourceMappingURL=api.d.ts.map
