/**
 * @depinautopilot/notify
 *
 * Comprehensive notification system for DePIN Autopilot
 * Supports Discord, Email, and SMS notifications with rich templates
 * and intelligent routing based on user preferences.
 */

// Core notification manager
export { NotificationManager } from './manager.js';

// Individual notification services
export { DiscordNotifier } from './discord.js';
export { EmailNotifier } from './email.js';

// Type definitions and interfaces
export type {
  // Core types
  NotificationChannel,
  NotificationType,
  NotificationSeverity,
  NotificationMessage,
  Field,

  // Configuration types
  NotificationPreferences,
  OwnerWithPreferences,
  DiscordConfig,
  EmailConfig,
  SmsConfig,
  NotificationManagerConfig,

  // Data types for different notification contexts
  NotificationData,
  StatementNotificationData,
  AlertNotificationData,
  NodeStatusNotificationData,
  WelcomeNotificationData,

  // Request and response types
  NotificationRequest,
  NotificationResult,
  NotificationBatchResult,

  // Email template types
  EmailTemplateData,

  // Error types
  NotificationError,
  DiscordNotificationError,
  EmailNotificationError,
  SmsNotificationError,
} from './types.js';

// Export enums and constants
export { EmbedColors, DefaultNotificationPreferences } from './types.js';

// Utility functions and helpers
export const NotificationUtils = {
  /**
   * Create a notification manager with default configuration
   */
  createManager(
    config: {
      discordWebhookUrl?: string;
      resendApiKey?: string;
      fromEmail?: string;
    } = {},
  ) {
    return new NotificationManager({
      discord: {
        webhookUrl: config.discordWebhookUrl,
      },
      email: {
        resendApiKey: config.resendApiKey,
        fromEmail: config.fromEmail,
      },
    });
  },

  /**
   * Validate notification preferences
   */
  validatePreferences(preferences: any): boolean {
    try {
      // Basic validation - could be enhanced with Zod schemas
      if (!preferences || typeof preferences !== 'object') return false;
      if (!preferences.channels || !preferences.types) return false;
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get severity color for UI components
   */
  getSeverityColor(severity: NotificationSeverity): string {
    const colors = {
      low: '#95a5a6', // Gray
      medium: '#f39c12', // Orange
      high: '#e74c3c', // Red
      critical: '#8b0000', // Dark red
    };
    return colors[severity];
  },

  /**
   * Format notification type for display
   */
  formatNotificationType(type: NotificationType): string {
    const labels = {
      statement: 'Statement Summary',
      alert: 'Alert',
      welcome: 'Welcome Message',
      node_offline: 'Node Offline',
      node_online: 'Node Online',
      earning_drop: 'Earning Drop',
      high_utilization: 'High Utilization',
      low_utilization: 'Low Utilization',
      maintenance_reminder: 'Maintenance Reminder',
      custom: 'Custom Notification',
    };
    return labels[type] || type;
  },

  /**
   * Check if a channel is available in the current environment
   */
  isChannelAvailable(channel: NotificationChannel): boolean {
    switch (channel) {
      case 'discord':
        return !!(process.env.DISCORD_WEBHOOK_URL || process.env.DISCORD_BOT_TOKEN);
      case 'email':
        return !!(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
      case 'sms':
        return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN);
      default:
        return false;
    }
  },

  /**
   * Get recommended channels based on notification type and severity
   */
  getRecommendedChannels(
    type: NotificationType,
    severity?: NotificationSeverity,
  ): NotificationChannel[] {
    // Critical alerts should go to all available channels
    if (severity === 'critical') {
      return ['discord', 'email', 'sms'];
    }

    // Statements typically go to email
    if (type === 'statement') {
      return ['email', 'discord'];
    }

    // High priority alerts
    if (severity === 'high') {
      return ['discord', 'email'];
    }

    // Regular notifications
    return ['discord', 'email'];
  },
};

// Re-export types from dependencies for convenience
export type { Owner, Alert } from '@depinautopilot/db';
export type { StatementSummary } from '@depinautopilot/core';

// Package version and metadata
export const VERSION = '1.0.0';
export const PACKAGE_NAME = '@depinautopilot/notify';

/**
 * Default export - NotificationManager for convenience
 */
export default NotificationManager;
