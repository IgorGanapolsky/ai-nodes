export interface Device {
    id: string;
    name: string;
    type: string;
    status: 'online' | 'offline' | 'maintenance';
    uptime: number;
    earnings: number;
    lastSeen: string;
    location?: string;
    version?: string;
    alerts: number;
    metrics?: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
    };
}
interface DeviceTableProps {
    devices: Device[];
    isLoading?: boolean;
}
export declare function DeviceTable({ devices, isLoading }: DeviceTableProps): any;
export {};
//# sourceMappingURL=DeviceTable.d.ts.map