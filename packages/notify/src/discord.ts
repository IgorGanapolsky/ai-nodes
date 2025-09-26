import { WebhookClient, EmbedBuilder } from 'discord.js';
import type { Owner } from '@depinautopilot/db';
import {
  type NotificationMessage,
  type Field,
  type DiscordConfig,
  EmbedColors,
  DiscordNotificationError,
} from './types.js';

export class DiscordNotifier {
  private webhook: WebhookClient | null = null;
  private config: DiscordConfig;

  constructor(webhookUrl?: string, config: DiscordConfig = {}) {
    this.config = {
      webhookUrl: webhookUrl || config.webhookUrl || process.env.DISCORD_WEBHOOK_URL,
      username: config.username || 'DePIN Autopilot',
      avatarUrl: config.avatarUrl || undefined,
    };

    if (this.config.webhookUrl) {
      try {
        this.webhook = new WebhookClient({ url: this.config.webhookUrl });
      } catch (error) {
        throw new DiscordNotificationError('Invalid Discord webhook URL', error as Error);
      }
    }
  }

  /**
   * Check if Discord notifications are configured and available
   */
  public isAvailable(): boolean {
    return this.webhook !== null;
  }

  /**
   * Send a simple notification message to Discord
   */
  public async send(message: NotificationMessage): Promise<void> {
    if (!this.webhook) {
      throw new DiscordNotificationError('Discord webhook not configured');
    }

    try {
      const embed = new EmbedBuilder()
        .setTitle(message.title)
        .setDescription(message.content)
        .setTimestamp(message.timestamp || new Date());

      // Set color based on severity
      if (message.severity) {
        embed.setColor(EmbedColors[message.severity]);
      } else {
        embed.setColor(EmbedColors.info);
      }

      // Add metadata as fields if provided
      if (message.metadata) {
        for (const [key, value] of Object.entries(message.metadata)) {
          if (value !== null && value !== undefined) {
            embed.addFields({
              name: this.formatFieldName(key),
              value: String(value),
              inline: true,
            });
          }
        }
      }

      await this.webhook.send({
        embeds: [embed],
        username: this.config.username,
        avatarURL: this.config.avatarUrl,
      });
    } catch (error) {
      throw new DiscordNotificationError('Failed to send Discord notification', error as Error);
    }
  }

  /**
   * Send a rich embed notification to Discord
   */
  public async sendEmbed(
    owner: Owner,
    title: string,
    fields: Field[],
    options: {
      description?: string;
      color?: keyof typeof EmbedColors;
      footer?: string;
      thumbnail?: string;
      image?: string;
      url?: string;
    } = {},
  ): Promise<void> {
    if (!this.webhook) {
      throw new DiscordNotificationError('Discord webhook not configured');
    }

    try {
      const embed = new EmbedBuilder().setTitle(title).setTimestamp(new Date());

      // Set description if provided
      if (options.description) {
        embed.setDescription(options.description);
      }

      // Set color
      const color = options.color || 'info';
      embed.setColor(EmbedColors[color]);

      // Add fields
      for (const field of fields) {
        embed.addFields({
          name: field.name,
          value: field.value,
          inline: field.inline || false,
        });
      }

      // Add owner info in footer
      const footerText = options.footer
        ? `${options.footer} • ${owner.displayName}`
        : `${owner.displayName}`;
      embed.setFooter({ text: footerText });

      // Optional thumbnail
      if (options.thumbnail) {
        embed.setThumbnail(options.thumbnail);
      }

      // Optional image
      if (options.image) {
        embed.setImage(options.image);
      }

      // Optional URL
      if (options.url) {
        embed.setURL(options.url);
      }

      await this.webhook.send({
        embeds: [embed],
        username: this.config.username,
        avatarURL: this.config.avatarUrl,
      });
    } catch (error) {
      throw new DiscordNotificationError('Failed to send Discord embed', error as Error);
    }
  }

  /**
   * Send a statement summary notification
   */
  public async sendStatement(
    owner: Owner,
    period: string,
    totalEarnings: number,
    nodeCount: number,
    topNode?: string,
  ): Promise<void> {
    const fields: Field[] = [
      {
        name: '📊 Period',
        value: period,
        inline: true,
      },
      {
        name: '💰 Total Earnings',
        value: `$${totalEarnings.toFixed(2)}`,
        inline: true,
      },
      {
        name: '🖥️ Active Nodes',
        value: nodeCount.toString(),
        inline: true,
      },
    ];

    if (topNode) {
      fields.push({
        name: '🏆 Top Performer',
        value: topNode,
        inline: false,
      });
    }

    await this.sendEmbed(owner, '📈 Statement Summary', fields, {
      description: `Here's your earnings summary for ${period}`,
      color: 'success',
      footer: 'Statement Generated',
    });
  }

  /**
   * Send an alert notification
   */
  public async sendAlert(
    owner: Owner,
    alertTitle: string,
    alertMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    nodeName?: string,
    nodeType?: string,
  ): Promise<void> {
    const fields: Field[] = [];

    if (nodeName) {
      fields.push({
        name: '🖥️ Node',
        value: nodeName,
        inline: true,
      });
    }

    if (nodeType) {
      fields.push({
        name: '🔧 Type',
        value: nodeType,
        inline: true,
      });
    }

    fields.push({
      name: '⚠️ Severity',
      value: severity.toUpperCase(),
      inline: true,
    });

    const severityEmoji = {
      low: '🟡',
      medium: '🟠',
      high: '🔴',
      critical: '🚨',
    };

    await this.sendEmbed(owner, `${severityEmoji[severity]} ${alertTitle}`, fields, {
      description: alertMessage,
      color: severity,
      footer: 'Alert Generated',
    });
  }

  /**
   * Send a node status change notification
   */
  public async sendNodeStatus(
    owner: Owner,
    nodeName: string,
    nodeType: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    const statusEmoji = {
      online: '🟢',
      offline: '🔴',
      maintenance: '🟡',
      error: '🔴',
    };

    const getStatusEmoji = (status: string) =>
      statusEmoji[status as keyof typeof statusEmoji] || '⚪';

    const fields: Field[] = [
      {
        name: '🖥️ Node',
        value: nodeName,
        inline: true,
      },
      {
        name: '🔧 Type',
        value: nodeType,
        inline: true,
      },
      {
        name: '📊 Status Change',
        value: `${getStatusEmoji(oldStatus)} ${oldStatus} → ${getStatusEmoji(newStatus)} ${newStatus}`,
        inline: false,
      },
    ];

    const color =
      newStatus === 'online' ? 'success' : newStatus === 'offline' ? 'critical' : 'medium';

    await this.sendEmbed(owner, '🔄 Node Status Changed', fields, {
      color,
      footer: 'Status Update',
    });
  }

  /**
   * Send a welcome notification
   */
  public async sendWelcome(owner: Owner, nodeCount: number = 0): Promise<void> {
    const fields: Field[] = [
      {
        name: '👋 Welcome',
        value: `Hello ${owner.displayName}! Welcome to DePIN Autopilot.`,
        inline: false,
      },
    ];

    if (nodeCount > 0) {
      fields.push({
        name: '🖥️ Your Nodes',
        value: `You currently have ${nodeCount} node${nodeCount === 1 ? '' : 's'} registered.`,
        inline: false,
      });
    }

    fields.push({
      name: '🚀 Getting Started',
      value:
        "Your notification system is now active. You'll receive updates about your nodes here.",
      inline: false,
    });

    await this.sendEmbed(owner, '🎉 Welcome to DePIN Autopilot!', fields, {
      color: 'success',
      footer: 'Welcome Message',
    });
  }

  /**
   * Update webhook configuration
   */
  public updateConfig(config: DiscordConfig): void {
    this.config = { ...this.config, ...config };

    if (config.webhookUrl) {
      try {
        this.webhook = new WebhookClient({ url: config.webhookUrl });
      } catch (error) {
        throw new DiscordNotificationError('Invalid Discord webhook URL', error as Error);
      }
    }
  }

  /**
   * Format field names for better display
   */
  private formatFieldName(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase())
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  /**
   * Get webhook info (for testing purposes)
   */
  public async getWebhookInfo(): Promise<any> {
    if (!this.webhook) {
      throw new DiscordNotificationError('Discord webhook not configured');
    }

    try {
      return await this.webhook.fetch();
    } catch (error) {
      throw new DiscordNotificationError('Failed to fetch webhook info', error as Error);
    }
  }

  /**
   * Test the Discord connection
   */
  public async test(): Promise<boolean> {
    try {
      await this.send({
        title: '✅ Test Notification',
        content: 'Discord notifications are working correctly!',
        severity: 'low',
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
