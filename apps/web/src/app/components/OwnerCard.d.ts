export interface Owner {
  id: string;
  name: string;
  email: string;
  walletAddress?: string;
  status: 'active' | 'inactive';
  joinedAt: string;
  lastSeen?: string;
  metrics?: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    totalEarnings: number;
    targetEarnings: number;
    averageUptime: number;
    alertsCount: number;
  };
  avatar?: string;
}
interface OwnerCardProps {
  owner: Owner;
}
export declare function OwnerCard({ owner }: OwnerCardProps): any;
export {};
//# sourceMappingURL=OwnerCard.d.ts.map
