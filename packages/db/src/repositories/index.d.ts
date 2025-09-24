export * from './base';
export * from './user';
export * from './node';
export * from './earnings';
export * from './metrics';
export * from './alert';
export * from './revenue-share';
import { UserRepository } from './user';
import { NodeRepository } from './node';
import { EarningsRepository } from './earnings';
import { MetricsRepository } from './metrics';
import { AlertRepository } from './alert';
import { RevenueShareRepository } from './revenue-share';
export declare function createRepositories(): {
    users: UserRepository;
    nodes: NodeRepository;
    earnings: EarningsRepository;
    metrics: MetricsRepository;
    alerts: AlertRepository;
    revenueShares: RevenueShareRepository;
};
export declare function getRepositories(): {
    users: UserRepository;
    nodes: NodeRepository;
    earnings: EarningsRepository;
    metrics: MetricsRepository;
    alerts: AlertRepository;
    revenueShares: RevenueShareRepository;
};
export declare function getUserRepository(): UserRepository;
export declare function getNodeRepository(): NodeRepository;
export declare function getEarningsRepository(): EarningsRepository;
export declare function getMetricsRepository(): MetricsRepository;
export declare function getAlertRepository(): AlertRepository;
export declare function getRevenueShareRepository(): RevenueShareRepository;
//# sourceMappingURL=index.d.ts.map