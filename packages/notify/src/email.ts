import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { Owner } from '@depinautopilot/db';
import type { Alert } from '@depinautopilot/db';
import type { StatementSummary } from '@depinautopilot/core';
import { type EmailConfig, type EmailTemplateData, EmailNotificationError } from './types.js';

// Get the directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class EmailNotifier {
  private resend: Resend | null = null;
  private config: EmailConfig;

  constructor(apiKey?: string, config: EmailConfig = {}) {
    this.config = {
      resendApiKey: apiKey || config.resendApiKey || process.env.RESEND_API_KEY,
      fromEmail: config.fromEmail || process.env.FROM_EMAIL || 'noreply@depinautopilot.com',
      fromName: config.fromName || 'DePIN Autopilot',
      replyTo: config.replyTo || process.env.REPLY_TO_EMAIL,
    };

    if (this.config.resendApiKey) {
      this.resend = new Resend(this.config.resendApiKey);
    }
  }

  /**
   * Check if email notifications are configured and available
   */
  public isAvailable(): boolean {
    return this.resend !== null && !!this.config.fromEmail;
  }

  /**
   * Send a basic email
   */
  public async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      throw new EmailNotificationError('Email service not configured');
    }

    try {
      const result = await this.resend.emails.send({
        from: `${this.config.fromName} <${this.config.fromEmail}>`,
        to: [to],
        subject,
        html,
        replyTo: this.config.replyTo,
      });

      if (result.error) {
        throw new EmailNotificationError(`Resend API error: ${result.error.message}`);
      }
    } catch (error) {
      if (error instanceof EmailNotificationError) {
        throw error;
      }
      throw new EmailNotificationError('Failed to send email', error as Error);
    }
  }

  /**
   * Send a statement summary email
   */
  public async sendStatement(owner: Owner, statement: StatementSummary): Promise<void> {
    const templateData: EmailTemplateData = {
      ownerName: owner.displayName,
      subject: `Statement Summary - ${this.formatPeriod(statement.periodStart, statement.periodEnd)}`,
      preheader: `Your earnings summary: $${statement.totalOwnerCut.toFixed(2)}`,
      statement,
      totalEarnings: statement.totalOwnerCut,
      period: this.formatPeriod(statement.periodStart, statement.periodEnd),
      nodeCount: statement.totalNodes,
      topNode: statement.topPerformingNode,
    };

    const html = await this.renderTemplate('statement', templateData);
    await this.send(owner.email, templateData.subject, html);
  }

  /**
   * Send an alert email
   */
  public async sendAlert(owner: Owner, alert: Alert, nodeName?: string): Promise<void> {
    const severityLabels = {
      low: 'Low Priority',
      medium: 'Medium Priority',
      high: 'High Priority',
      critical: 'CRITICAL',
    };

    const templateData: EmailTemplateData = {
      ownerName: owner.displayName,
      subject: `[${severityLabels[alert.severity]}] ${alert.title}`,
      preheader: alert.message.substring(0, 100) + (alert.message.length > 100 ? '...' : ''),
      alert,
      nodeName: nodeName || 'Unknown Node',
      severityLabel: severityLabels[alert.severity],
      severityColor: this.getSeverityColor(alert.severity),
      timestamp: new Date(alert.timestamp).toLocaleString(),
    };

    const html = await this.renderTemplate('alert', templateData);
    await this.send(owner.email, templateData.subject, html);
  }

  /**
   * Send a welcome email
   */
  public async sendWelcome(owner: Owner, nodeCount: number = 0): Promise<void> {
    const templateData: EmailTemplateData = {
      ownerName: owner.displayName,
      subject: 'Welcome to DePIN Autopilot!',
      preheader: 'Your automated node management system is ready.',
      nodeCount,
      hasNodes: nodeCount > 0,
    };

    const html = await this.renderTemplate('welcome', templateData);
    await this.send(owner.email, templateData.subject, html);
  }

  /**
   * Send a node status change email
   */
  public async sendNodeStatusChange(
    owner: Owner,
    nodeName: string,
    nodeType: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<void> {
    const isOnline = newStatus === 'online';
    const isCritical = newStatus === 'offline' || newStatus === 'error';

    const templateData: EmailTemplateData = {
      ownerName: owner.displayName,
      subject: `Node ${isOnline ? 'Online' : 'Status Change'}: ${nodeName}`,
      preheader: `${nodeName} is now ${newStatus}`,
      nodeName,
      nodeType,
      oldStatus,
      newStatus,
      isOnline,
      isCritical,
      statusColor: isOnline ? '#27ae60' : isCritical ? '#e74c3c' : '#f39c12',
      timestamp: new Date().toLocaleString(),
    };

    const html = await this.renderTemplate('node-status', templateData);
    await this.send(owner.email, templateData.subject, html);
  }

  /**
   * Render an email template with data
   */
  private async renderTemplate(templateName: string, data: EmailTemplateData): Promise<string> {
    try {
      const templatePath = join(__dirname, 'templates', `${templateName}.html`);
      let template = readFileSync(templatePath, 'utf-8');

      // Simple template rendering - replace {{variable}} with data
      template = template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
        const value = this.getNestedValue(data, key);
        return value !== undefined ? String(value) : match;
      });

      // Handle conditional blocks {{#if condition}}...{{/if}}
      template = template.replace(
        /\{\{#if (\w+)\}\}(.*?)\{\{\/if\}\}/gs,
        (match, condition, content) => {
          const value = this.getNestedValue(data, condition);
          return value ? content : '';
        },
      );

      // Handle loops {{#each array}}...{{/each}}
      template = template.replace(
        /\{\{#each (\w+)\}\}(.*?)\{\{\/each\}\}/gs,
        (match, arrayKey, content) => {
          const array = this.getNestedValue(data, arrayKey) as any[];
          if (!Array.isArray(array)) return '';

          return array
            .map((item, index) => {
              let itemContent = content;
              // Replace {{.}} with current item
              itemContent = itemContent.replace(/\{\{\.\}\}/g, String(item));
              // Replace {{@index}} with current index
              itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
              // Replace {{item.property}} with item properties
              itemContent = itemContent.replace(
                /\{\{(\w+)\}\}/g,
                (itemMatch: string, itemKey: string) => {
                  return item[itemKey] !== undefined ? String(item[itemKey]) : itemMatch;
                },
              );
              return itemContent;
            })
            .join('');
        },
      );

      return template;
    } catch (error) {
      throw new EmailNotificationError(
        `Failed to render email template: ${templateName}`,
        error as Error,
      );
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, key: string): any {
    return key.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  /**
   * Get color for alert severity
   */
  private getSeverityColor(severity: string): string {
    const colors = {
      low: '#95a5a6', // Gray
      medium: '#f39c12', // Orange
      high: '#e74c3c', // Red
      critical: '#8b0000', // Dark red
    };
    return colors[severity as keyof typeof colors] || colors.medium;
  }

  /**
   * Format period dates
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
   * Update email configuration
   */
  public updateConfig(config: EmailConfig): void {
    this.config = { ...this.config, ...config };

    if (config.resendApiKey) {
      this.resend = new Resend(config.resendApiKey);
    }
  }

  /**
   * Test the email service
   */
  public async test(testEmail: string): Promise<boolean> {
    try {
      await this.send(
        testEmail,
        'Test Email from DePIN Autopilot',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #27ae60;">✅ Email Service Test</h2>
            <p>This is a test email to verify that your email notifications are working correctly.</p>
            <p style="color: #666; font-size: 14px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get email service status
   */
  public getStatus(): { configured: boolean; fromEmail: string | undefined; hasApiKey: boolean } {
    return {
      configured: this.isAvailable(),
      fromEmail: this.config.fromEmail,
      hasApiKey: !!this.config.resendApiKey,
    };
  }
}
