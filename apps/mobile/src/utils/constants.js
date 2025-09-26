// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api.ai-nodes.com/v1',
  WS_URL: process.env.EXPO_PUBLIC_WS_URL || 'wss://api.ai-nodes.com/ws',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
};
// App Configuration
export const APP_CONFIG = {
  NAME: 'AI Nodes Dashboard',
  VERSION: '1.0.0',
  MIN_REFRESH_INTERVAL: 10, // seconds
  DEFAULT_REFRESH_INTERVAL: 30, // seconds
  MAX_RECONNECT_ATTEMPTS: 5,
  RECONNECT_INTERVAL: 5000, // milliseconds
};
// Notification Channels
export const NOTIFICATION_CHANNELS = {
  DEFAULT: 'default',
  ALERTS: 'alerts',
  EARNINGS: 'earnings',
};
// Storage Keys
export const STORAGE_KEYS = {
  API_KEY: 'ai_nodes_api_key',
  SETTINGS: 'ai_nodes_settings',
  USER_PREFERENCES: 'ai_nodes_user_preferences',
  LAST_SYNC: 'ai_nodes_last_sync',
};
// Chart Colors
export const CHART_COLORS = {
  PRIMARY: '#10B981',
  SECONDARY: '#3B82F6',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#6366F1',
  BACKGROUND: '#1a1a2e',
  GRADIENT_FROM: '#1a1a2e',
  GRADIENT_TO: '#16213e',
};
// Status Colors
export const STATUS_COLORS = {
  ONLINE: '#10B981',
  OFFLINE: '#EF4444',
  MAINTENANCE: '#F59E0B',
  UNKNOWN: '#6B7280',
};
// Performance Thresholds
export const PERFORMANCE_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 70,
  POOR: 50,
};
// Time Ranges
export const TIME_RANGES = {
  '24h': { label: '24 Hours', hours: 24 },
  '7d': { label: '7 Days', hours: 24 * 7 },
  '30d': { label: '30 Days', hours: 24 * 30 },
  '3m': { label: '3 Months', hours: 24 * 90 },
};
// Node Types
export const NODE_TYPES = {
  GPU: 'GPU',
  CPU: 'CPU',
  STORAGE: 'STORAGE',
};
// Default Settings
export const DEFAULT_SETTINGS = {
  autoReinvest: false,
  reinvestThreshold: 100,
  notifications: {
    enabled: true,
    nodeOffline: true,
    earningsTarget: true,
    lowPerformance: true,
  },
  refreshInterval: 30,
};
// Animation Durations
export const ANIMATION_DURATION = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
};
// Screen Dimensions
export const SCREEN_PADDING = 16;
export const CARD_MARGIN = 8;
export const BORDER_RADIUS = 8;
