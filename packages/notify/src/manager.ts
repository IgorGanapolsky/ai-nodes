import { DiscordNotifier } from './discord.js';
import { EmailNotifier } from './email.js';
import type { Owner } from '@depinautopilot/db';
import type { Alert } from '@depinautopilot/db';
import type { StatementSummary } from '@depinautopilot/core';
import {
  type NotificationChannel,
  type NotificationType,
  type NotificationData,
  type NotificationRequest,
  type NotificationResult,
  type NotificationBatchResult,
  type NotificationPreferences,
  type NotificationManagerConfig,
  type OwnerWithPreferences,
  type StatementNotificationData,
  type AlertNotificationData,
  type NodeStatusNotificationData,
  type WelcomeNotificationData,
  DefaultNotificationPreferences,
  NotificationError,
} from './types.js';

export class NotificationManager {
  private discord: DiscordNotifier;
  private email: EmailNotifier;
  private config: NotificationManagerConfig;

  constructor(config: NotificationManagerConfig = {}) {
    this.config = {
      defaultPreferences: { ...DefaultNotificationPreferences, ...config.defaultPreferences },
      ...config,
    };

    // Initialize notification services
    this.discord = new DiscordNotifier(config.discord?.webhookUrl, config.discord || {});

    this.email = new EmailNotifier(config.email?.resendApiKey, config.email || {});
  }

  /**
   * Send notification to owner based on their preferences
   */
  public async notify(
    owner: Owner,
    type: NotificationType,
    data: NotificationData,
    options: {
      channels?: NotificationChannel[];
      override?: boolean;
      severity?: 'low' | 'medium' | 'high' | 'critical';
    } = {},
  ): Promise<NotificationBatchResult> {
    const ownerWithPrefs = this.ensureOwnerPreferences(owner);
    const request: NotificationRequest = {
      owner: ownerWithPrefs,
      type,
      data,
      channels: options.channels,
      override: options.override || false,
    };

    return await this.processNotificationRequest(request);
  }

  /**
   * Check if a specific channel is enabled for an owner
   */
  public isChannelEnabled(owner: Owner, channel: NotificationChannel): boolean {
    const ownerWithPrefs = this.ensureOwnerPreferences(owner);
    const prefs = ownerWithPrefs.notificationPreferences!;

    return prefs.channels[channel];
  }

  /**
   * Check if a notification type is enabled for an owner
   */
  public isTypeEnabled(owner: Owner, type: NotificationType): boolean {
    const ownerWithPrefs = this.ensureOwnerPreferences(owner);
    const prefs = ownerWithPrefs.notificationPreferences!;

    return prefs.types[type];
  }

  /**
   * Check if notifications are allowed based on quiet hours
   */
  public isWithinQuietHours(owner: Owner): boolean {
    const ownerWithPrefs = this.ensureOwnerPreferences(owner);
    const quietHours = ownerWithPrefs.notificationPreferences?.quiet_hours;

    if (!quietHours?.enabled) {
      return false;
    }

    const now = new Date();
    const timezone = quietHours.timezone || 'UTC';

    // Convert current time to owner's timezone
    const ownerTime = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    const currentHour = ownerTime.getHours();
    const currentMinute = ownerTime.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    // Parse start and end times
    const [startHour, startMinute] = quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = quietHours.end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    // Handle overnight quiet hours (e.g., 22:00 to 06:00)
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime;
    }

    // Handle same-day quiet hours (e.g., 13:00 to 14:00)
    return currentTime >= startTime && currentTime <= endTime;
  }

  /**
   * Send statement notification
   */
  public async sendStatement(
    owner: Owner,
    statement: StatementSummary,
    options: { override?: boolean } = {},
  ): Promise<NotificationBatchResult> {
    const data: StatementNotificationData = {
      statement,
      period: this.formatPeriod(statement.periodStart, statement.periodEnd),
      totalEarnings: statement.totalOwnerCut,
      nodeCount: statement.totalNodes,
    };

    return await this.notify(owner, 'statement', data, options);
  }

  /**
   * Send alert notification
   */
  public async sendAlert(
    owner: Owner,
    alert: Alert,
    nodeName: string,
    nodeType: string,
    options: { override?: boolean } = {},
  ): Promise<NotificationBatchResult> {
    const data: AlertNotificationData = {
      alert,
      nodeName,
      nodeType,
    };

    return await this.notify(owner, 'alert', data, {
      ...options,
      severity: alert.severity as any,
    });
  }

  /**
   * Send node status change notification
   */
  public async sendNodeStatus(
    owner: Owner,
    nodeId: string,
    nodeName: string,
    nodeType: string,
    oldStatus: string,
    newStatus: string,
    options: { override?: boolean } = {},
  ): Promise<NotificationBatchResult> {
    const data: NodeStatusNotificationData = {
      nodeId,
      nodeName,
      nodeType,
      oldStatus,
      newStatus,
      timestamp: new Date(),
    };

    const notificationType: NotificationType =
      newStatus === 'online' ? 'node_online' : 'node_offline';

    return await this.notify(owner, notificationType, data, options);
  }

  /**
   * Send welcome notification
   */
  public async sendWelcome(
    owner: Owner,
    nodeCount: number = 0,
    options: { override?: boolean } = {},
  ): Promise<NotificationBatchResult> {
    const data: WelcomeNotificationData = {
      ownerName: owner.displayName,
      nodeCount,
    };

    return await this.notify(owner, 'welcome', data, options);
  }

  /**
   * Update notification preferences for an owner
   */
  public updateOwnerPreferences(
    owner: Owner,
    preferences: Partial<NotificationPreferences>,
  ): OwnerWithPreferences {
    const ownerWithPrefs = this.ensureOwnerPreferences(owner);
    ownerWithPrefs.notificationPreferences = {
      ...ownerWithPrefs.notificationPreferences!,
      ...preferences,
    };

    return ownerWithPrefs;
  }

  /**
   * Get notification statistics for an owner
   */
  public async getNotificationStats(owner: Owner): Promise<{
    totalSent: number;
    byChannel: Record<NotificationChannel, number>;
    byType: Record<NotificationType, number>;
    recentFailures: number;
  }> {
    // This would typically query a database or cache
    // For now, return mock data structure
    return {
      totalSent: 0,
      byChannel: {
        discord: 0,
        email: 0,
        sms: 0,
      },
      byType: {
        statement: 0,
        alert: 0,
        welcome: 0,
        node_offline: 0,
        node_online: 0,
        earning_drop: 0,
        high_utilization: 0,
        low_utilization: 0,
        maintenance_reminder: 0,
        custom: 0,
      },
      recentFailures: 0,
    };
  }

  /**
   * Test all notification channels for an owner
   */
  public async testNotifications(owner: Owner): Promise<{
    discord: { success: boolean; error?: string };
    email: { success: boolean; error?: string };
  }> {
    const results = {
      discord: { success: false, error: undefined as string | undefined },
      email: { success: false, error: undefined as string | undefined },
    };

    // Test Discord
    try {
      if (this.discord.isAvailable() && owner.discordWebhook) {
        const discordNotifier = new DiscordNotifier(owner.discordWebhook);
        results.discord.success = await discordNotifier.test();
      } else {
        results.discord.error = 'Discord webhook not configured';
      }
    } catch (error) {
      results.discord.error = (error as Error).message;
    }

    // Test Email
    try {
      if (this.email.isAvailable()) {
        results.email.success = await this.email.test(owner.email);
      } else {
        results.email.error = 'Email service not configured';
      }
    } catch (error) {
      results.email.error = (error as Error).message;
    }

    return results;
  }

  /**
   * Process a notification request
   */
  private async processNotificationRequest(
    request: NotificationRequest,
  ): Promise<NotificationBatchResult> {
    const results: NotificationResult[] = [];
    const { owner, type, data, channels, override } = request;

    // Check if type is enabled (unless override is true)
    if (!override && !this.isTypeEnabled(owner, type)) {
      return {
        owner,
        type,
        results,
        totalSent: 0,
        totalFailed: 0,
      };
    }

    // Check quiet hours for non-critical notifications
    const severity = this.getSeverityFromData(data);
    if (!override && severity !== 'critical' && this.isWithinQuietHours(owner)) {
      return {
        owner,
        type,
        results,
        totalSent: 0,
        totalFailed: 0,
      };
    }

    // Determine channels to use
    const targetChannels = channels || this.getEnabledChannels(owner);

    // Send to each channel
    for (const channel of targetChannels) {
      const result = await this.sendToChannel(owner, type, data, channel);
      results.push(result);
    }

    const totalSent = results.filter((r) => r.success).length;
    const totalFailed = results.filter((r) => !r.success).length;

    return {
      owner,
      type,
      results,
      totalSent,
      totalFailed,
    };
  }

  /**
   * Send notification to a specific channel
   */
  private async sendToChannel(
    owner: Owner,
    type: NotificationType,
    data: NotificationData,
    channel: NotificationChannel,
  ): Promise<NotificationResult> {
    const timestamp = new Date();

    try {
      switch (channel) {
        case 'discord':
          await this.sendDiscordNotification(owner, type, data);
          break;

        case 'email':
          await this.sendEmailNotification(owner, type, data);
          break;

        case 'sms':
          // SMS not implemented in this example
          throw new NotificationError('SMS notifications not implemented', channel);

        default:
          throw new NotificationError(`Unknown channel: ${channel}`, channel);
      }

      return {
        success: true,
        channel,
        timestamp,
      };
    } catch (error) {
      return {
        success: false,
        channel,
        error: (error as Error).message,
        timestamp,
      };
    }
  }

  /**
   * Send Discord notification
   */
  private async sendDiscordNotification(
    owner: Owner,
    type: NotificationType,
    data: NotificationData,
  ): Promise<void> {
    const webhook = owner.discordWebhook;
    if (!webhook) {
      throw new NotificationError('Discord webhook not configured', 'discord');
    }

    const discordNotifier = new DiscordNotifier(webhook, this.config.discord);

    switch (type) {
      case 'statement': {
        const statementData = data as StatementNotificationData;
        await discordNotifier.sendStatement(
          owner,
          statementData.period,
          statementData.totalEarnings,
          statementData.nodeCount,
        );
        break;
      }

      case 'alert': {
        const alertData = data as AlertNotificationData;
        await discordNotifier.sendAlert(
          owner,
          alertData.alert.title,
          alertData.alert.message,
          alertData.alert.severity as any,
          alertData.nodeName,
          alertData.nodeType,
        );
        break;
      }

      case 'node_online':
      case 'node_offline': {
        const statusData = data as NodeStatusNotificationData;
        await discordNotifier.sendNodeStatus(
          owner,
          statusData.nodeName,
          statusData.nodeType,
          statusData.oldStatus,
          statusData.newStatus,
        );
        break;
      }

      case 'welcome': {
        const welcomeData = data as WelcomeNotificationData;
        await discordNotifier.sendWelcome(owner, welcomeData.nodeCount);
        break;
      }

      default:
        await discordNotifier.send({
          title: `${type} Notification`,
          content: JSON.stringify(data, null, 2),
        });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    owner: Owner,
    type: NotificationType,
    data: NotificationData,
  ): Promise<void> {
    if (!this.email.isAvailable()) {
      throw new NotificationError('Email service not configured', 'email');
    }

    switch (type) {
      case 'statement': {
        const statementData = data as StatementNotificationData;
        await this.email.sendStatement(owner, statementData.statement);
        break;
      }

      case 'alert': {
        const alertData = data as AlertNotificationData;
        await this.email.sendAlert(owner, alertData.alert, alertData.nodeName);
        break;
      }

      case 'node_online':
      case 'node_offline': {
        const statusData = data as NodeStatusNotificationData;
        await this.email.sendNodeStatusChange(
          owner,
          statusData.nodeName,
          statusData.nodeType,
          statusData.oldStatus,
          statusData.newStatus,
        );
        break;
      }

      case 'welcome': {
        const welcomeData = data as WelcomeNotificationData;
        await this.email.sendWelcome(owner, welcomeData.nodeCount);
        break;
      }

      default:
        await this.email.send(
          owner.email,
          `${type} Notification`,
          `<p>Notification data:</p><pre>${JSON.stringify(data, null, 2)}</pre>`,
        );
    }
  }

  /**
   * Get enabled channels for an owner
   */
  private getEnabledChannels(owner: Owner): NotificationChannel[] {
    const ownerWithPrefs = this.ensureOwnerPreferences(owner);
    const prefs = ownerWithPrefs.notificationPreferences!;
    const channels: NotificationChannel[] = [];

    if (prefs.channels.discord && owner.discordWebhook) {
      channels.push('discord');
    }

    if (prefs.channels.email) {
      channels.push('email');
    }

    if (prefs.channels.sms) {
      channels.push('sms');
    }

    return channels;
  }

  /**
   * Extract severity from notification data
   */
  private getSeverityFromData(data: NotificationData): 'low' | 'medium' | 'high' | 'critical' {
    if ('alert' in data && data.alert) {
      return data.alert.severity as any;
    }

    if ('newStatus' in data && data.newStatus === 'offline') {
      return 'critical';
    }

    return 'medium';
  }

  /**
   * Ensure owner has notification preferences
   */
  private ensureOwnerPreferences(owner: Owner): OwnerWithPreferences {
    const ownerWithPrefs = owner as OwnerWithPreferences;

    if (!ownerWithPrefs.notificationPreferences) {
      ownerWithPrefs.notificationPreferences = { ...this.config.defaultPreferences! };
    }

    return ownerWithPrefs;
  }

  /**
   * Format period string for display
   */
  private formatPeriod(start: Date, end: Date): string {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };

    const startStr = start.toLocaleDateString('en-US', options);
    const endStr = end.toLocaleDateString('en-US', options);

    // If same month and year, format as "December 1-31, 2024"
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const monthYear = start.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      return `${monthYear} ${start.getDate()}-${end.getDate()}`;
    }

    return `${startStr} - ${endStr}`;
  }

  /**
   * Get service status
   */
  public getServiceStatus(): {
    discord: boolean;
    email: boolean;
    config: NotificationManagerConfig;
  } {
    return {
      discord: this.discord.isAvailable(),
      email: this.email.isAvailable(),
      config: this.config,
    };
  }

  /**
   * Update service configuration
   */
  public updateConfig(config: Partial<NotificationManagerConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.discord) {
      this.discord.updateConfig(config.discord);
    }

    if (config.email) {
      this.email.updateConfig(config.email);
    }
  }
}
