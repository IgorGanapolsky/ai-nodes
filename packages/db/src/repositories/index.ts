// Base repository
export * from './base';

// Individual repositories
export * from './user';
export * from './node';
export * from './earnings';
export * from './metrics';
export * from './alert';
export * from './revenue-share';

// Repository instances
import { UserRepository } from './user';
import { NodeRepository } from './node';
import { EarningsRepository } from './earnings';
import { MetricsRepository } from './metrics';
import { AlertRepository } from './alert';
import { RevenueShareRepository } from './revenue-share';

// Factory function to create repository instances
export function createRepositories() {
  return {
    users: new UserRepository(),
    nodes: new NodeRepository(),
    earnings: new EarningsRepository(),
    metrics: new MetricsRepository(),
    alerts: new AlertRepository(),
    revenueShares: new RevenueShareRepository(),
  };
}

// Singleton instance
let repositories: ReturnType<typeof createRepositories> | null = null;

export function getRepositories() {
  if (!repositories) {
    repositories = createRepositories();
  }
  return repositories;
}

// Individual repository getters for convenience
export function getUserRepository() {
  return getRepositories().users;
}

export function getNodeRepository() {
  return getRepositories().nodes;
}

export function getEarningsRepository() {
  return getRepositories().earnings;
}

export function getMetricsRepository() {
  return getRepositories().metrics;
}

export function getAlertRepository() {
  return getRepositories().alerts;
}

export function getRevenueShareRepository() {
  return getRepositories().revenueShares;
}