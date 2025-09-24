export interface SummaryData {
    totalOwners: number;
    activeOwners: number;
    inactiveOwners: number;
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    totalEarnings: number;
    targetEarnings: number;
    averageUptime: number;
    totalAlerts: number;
    criticalAlerts: number;
    performanceScore: number;
    earningsGrowth: number;
    uptimeGrowth: number;
    onPaceOwners: number;
}
interface MetricsSummaryProps {
    data: SummaryData;
}
export declare function MetricsSummary({ data }: MetricsSummaryProps): any;
export {};
//# sourceMappingURL=MetricsSummary.d.ts.map