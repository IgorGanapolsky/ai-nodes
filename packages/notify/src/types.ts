import { z } from 'zod';
import type { Owner } from '@depinautopilot/db';
import type { Alert } from '@depinautopilot/db';
import type { StatementSummary } from '@depinautopilot/core';

// Notification channels
export const NotificationChannel = z.enum(['discord', 'email', 'sms']);
export type NotificationChannel = z.infer<typeof NotificationChannel>;

// Notification types
export const NotificationType = z.enum([
  'statement',
  'alert',
  'welcome',
  'node_offline',
  'node_online',
  'earning_drop',
  'high_utilization',
  'low_utilization',
  'maintenance_reminder',
  'custom',
]);
export type NotificationType = z.infer<typeof NotificationType>;

// Notification severity levels
export const NotificationSeverity = z.enum(['low', 'medium', 'high', 'critical']);
export type NotificationSeverity = z.infer<typeof NotificationSeverity>;

// Base notification message interface
export interface NotificationMessage {
  title: string;
  content: string;
  severity?: NotificationSeverity;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

// Discord embed field
export interface Field {
  name: string;
  value: string;
  inline?: boolean;
}

// Discord embed color mapping
export const EmbedColors = {
  low: 0x95a5a6, // Gray
  medium: 0xf39c12, // Orange
  high: 0xe74c3c, // Red
  critical: 0x8b0000, // Dark red
  success: 0x27ae60, // Green
  info: 0x3498db, // Blue
} as const;

// Notification preferences per owner
export interface NotificationPreferences {
  channels: {
    discord: boolean;
    email: boolean;
    sms: boolean;
  };
  types: {
    statement: boolean;
    alert: boolean;
    welcome: boolean;
    node_offline: boolean;
    node_online: boolean;
    earning_drop: boolean;
    high_utilization: boolean;
    low_utilization: boolean;
    maintenance_reminder: boolean;
    custom: boolean;
  };
  severity: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
  quiet_hours?: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string; // HH:mm format
    timezone: string;
  };
}

// Default notification preferences
export const DefaultNotificationPreferences: NotificationPreferences = {
  channels: {
    discord: true,
    email: true,
    sms: false,
  },
  types: {
    statement: true,
    alert: true,
    welcome: true,
    node_offline: true,
    node_online: true,
    earning_drop: true,
    high_utilization: true,
    low_utilization: false,
    maintenance_reminder: true,
    custom: true,
  },
  severity: {
    low: false,
    medium: true,
    high: true,
    critical: true,
  },
};

// Extended owner type with notification preferences
export interface OwnerWithPreferences extends Owner {
  notificationPreferences?: NotificationPreferences;
}

// Statement notification data
export interface StatementNotificationData {
  statement: StatementSummary;
  period: string;
  totalEarnings: number;
  nodeCount: number;
}

// Alert notification data
export interface AlertNotificationData {
  alert: Alert;
  nodeName: string;
  nodeType: string;
}

// Node status change notification data
export interface NodeStatusNotificationData {
  nodeId: string;
  nodeName: string;
  nodeType: string;
  oldStatus: string;
  newStatus: string;
  timestamp: Date;
}

// Welcome notification data
export interface WelcomeNotificationData {
  ownerName: string;
  nodeCount: number;
}

// Notification context data union type
export type NotificationData =
  | StatementNotificationData
  | AlertNotificationData
  | NodeStatusNotificationData
  | WelcomeNotificationData
  | Record<string, any>;

// Notification request
export interface NotificationRequest {
  owner: OwnerWithPreferences;
  type: NotificationType;
  data: NotificationData;
  channels?: NotificationChannel[];
  override?: boolean; // Override user preferences
}

// Notification result
export interface NotificationResult {
  success: boolean;
  channel: NotificationChannel;
  messageId?: string;
  error?: string;
  timestamp: Date;
}

// Notification batch result
export interface NotificationBatchResult {
  owner: Owner;
  type: NotificationType;
  results: NotificationResult[];
  totalSent: number;
  totalFailed: number;
}

// Email template data
export interface EmailTemplateData {
  ownerName: string;
  subject: string;
  preheader?: string;
  [key: string]: any;
}

// Discord webhook configuration
export interface DiscordConfig {
  webhookUrl?: string;
  username?: string;
  avatarUrl?: string;
}

// Email configuration
export interface EmailConfig {
  resendApiKey?: string;
  fromEmail?: string;
  fromName?: string;
  replyTo?: string;
  // SMTP fallback (e.g., SES SMTP creds)
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
}

// SMS configuration
export interface SmsConfig {
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  fromNumber?: string;
}

// Notification manager configuration
export interface NotificationManagerConfig {
  discord?: DiscordConfig;
  email?: EmailConfig;
  sms?: SmsConfig;
  defaultPreferences?: NotificationPreferences;
}

// Error types
export class NotificationError extends Error {
  constructor(
    message: string,
    public channel: NotificationChannel,
    public originalError?: Error,
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class DiscordNotificationError extends NotificationError {
  constructor(message: string, originalError?: Error) {
    super(message, 'discord', originalError);
    this.name = 'DiscordNotificationError';
  }
}

export class EmailNotificationError extends NotificationError {
  constructor(message: string, originalError?: Error) {
    super(message, 'email', originalError);
    this.name = 'EmailNotificationError';
  }
}

export class SmsNotificationError extends NotificationError {
  constructor(message: string, originalError?: Error) {
    super(message, 'sms', originalError);
    this.name = 'SmsNotificationError';
  }
}
