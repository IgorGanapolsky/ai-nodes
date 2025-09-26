import cron from 'node-cron';
import type { FastifyInstance } from 'fastify';
import { LinearService, AgentCoordination } from '@depinautopilot/core';

export class Scheduler {
  private app: FastifyInstance;
  private jobs: Map<string, cron.ScheduledTask> = new Map();

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  /**
   * Initialize all scheduled jobs
   */
  public start(): void {
    this.app.log.info('Starting scheduler...');

    // Hourly connector polling
    this.scheduleConnectorPolling();

    // Alert generation and checking
    this.scheduleAlertGeneration();

    // Weekly statement generation (Mondays at 9 AM)
    this.scheduleWeeklyStatements();

    // Daily cleanup tasks
    this.scheduleDailyCleanup();

    // Performance optimization checks
    this.schedulePerformanceOptimization();

    // Revenue loop (opportunity → outreach tasks)
    this.scheduleRevenueLoop();

    this.app.log.info(`Scheduler started with ${this.jobs.size} active jobs`);
  }

  /**
   * Stop all scheduled jobs
   */
  public stop(): void {
    this.app.log.info('Stopping scheduler...');

    for (const [name, task] of this.jobs) {
      task.stop();
      this.app.log.info(`Stopped job: ${name}`);
    }

    this.jobs.clear();
    this.app.log.info('Scheduler stopped');
  }

  /**
   * Schedule hourly connector polling to check device status
   */
  private scheduleConnectorPolling(): void {
    const jobName = 'connector-polling';

    // Run every hour at minute 0 (e.g., 1:00, 2:00, 3:00)
    const task = cron.schedule(
      '0 * * * *',
      async () => {
        try {
          this.app.log.info('Starting hourly connector polling...');

          // TODO: Replace with actual connector polling logic
          await this.pollConnectors();

          this.app.log.info('Connector polling completed successfully');
        } catch (error) {
          this.app.log.error(`Error during connector polling: ${(error as Error).message || String(error)}`);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      },
    );

    this.jobs.set(jobName, task);
    this.app.log.info(`Scheduled ${jobName}: every hour at minute 0`);
  }

  /**
   * Schedule alert generation based on device utilization and performance
   */
  private scheduleAlertGeneration(): void {
    const jobName = 'alert-generation';

    // Run every 15 minutes
    const task = cron.schedule(
      '*/15 * * * *',
      async () => {
        try {
          this.app.log.info('Starting alert generation check...');

          await this.checkAndGenerateAlerts();

          this.app.log.info('Alert generation check completed');
        } catch (error) {
          this.app.log.error(`Error during alert generation: ${(error as Error).message || String(error)}`);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      },
    );

    this.jobs.set(jobName, task);
    this.app.log.info(`Scheduled ${jobName}: every 15 minutes`);
  }

  /**
   * Schedule weekly statement generation (Mondays at 9 AM UTC)
   */
  private scheduleWeeklyStatements(): void {
    const jobName = 'weekly-statements';

    // Run every Monday at 9:00 AM UTC
    const task = cron.schedule(
      '0 9 * * 1',
      async () => {
        try {
          this.app.log.info('Starting weekly statement generation...');

          await this.generateWeeklyStatements();

          this.app.log.info('Weekly statement generation completed');
        } catch (error) {
          this.app.log.error(`Error during weekly statement generation: ${(error as Error).message || String(error)}`);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      },
    );

    this.jobs.set(jobName, task);
    this.app.log.info(`Scheduled ${jobName}: Mondays at 9:00 AM UTC`);
  }

  /**
   * Schedule daily cleanup tasks
   */
  private scheduleDailyCleanup(): void {
    const jobName = 'daily-cleanup';

    // Run every day at 2:00 AM UTC
    const task = cron.schedule(
      '0 2 * * *',
      async () => {
        try {
          this.app.log.info('Starting daily cleanup tasks...');

          await this.performDailyCleanup();

          this.app.log.info('Daily cleanup completed');
        } catch (error) {
          this.app.log.error(`Error during daily cleanup: ${(error as Error).message || String(error)}`);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      },
    );

    this.jobs.set(jobName, task);
    this.app.log.info(`Scheduled ${jobName}: daily at 2:00 AM UTC`);
  }

  /**
   * Schedule performance optimization checks
   */
  private schedulePerformanceOptimization(): void {
    const jobName = 'performance-optimization';

    // Run every 6 hours
    const task = cron.schedule(
      '0 */6 * * *',
      async () => {
        try {
          this.app.log.info('Starting performance optimization check...');

          await this.checkPerformanceOptimization();

          this.app.log.info('Performance optimization check completed');
        } catch (error) {
          this.app.log.error(`Error during performance optimization check: ${(error as Error).message || String(error)}`);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      },
    );

    this.jobs.set(jobName, task);
    this.app.log.info(`Scheduled ${jobName}: every 6 hours`);
  }

  /**
   * Schedule revenue loop: create outreach tasks from 'opportunity' issues
   */
  private scheduleRevenueLoop(): void {
    const jobName = 'revenue-loop';

    // Every 10 minutes with a bit of jitter inside the handler
    const task = cron.schedule(
      '*/10 * * * *',
      async () => {
        const jitterMs = Math.floor(Math.random() * 60_000); // up to 60s
        await new Promise((r) => setTimeout(r, jitterMs));
        try {
          this.app.log.info('Running revenue loop...');
          const { created, total } = await this.runRevenueLoop();
          this.app.log.info(`Revenue loop processed ${total} opportunities; created ${created} tasks.`);
        } catch (error) {
          this.app.log.error(`Error during revenue loop: ${(error as Error).message || String(error)}`);
        }
      },
      {
        scheduled: true,
        timezone: 'UTC',
      },
    );

    this.jobs.set(jobName, task);
    this.app.log.info(`Scheduled ${jobName}: every 10 minutes`);
  }

  /**
   * Execute revenue loop once
   */
  private async runRevenueLoop(): Promise<{ created: number; total: number }> {
    const apiKey = process.env.LINEAR_API_KEY || '';
    const teamId = process.env.LINEAR_TEAM_ID;
    if (!apiKey) {
      this.app.log.warn('Skipping revenue loop: LINEAR_API_KEY is not set');
      return { created: 0, total: 0 };
    }

    const linear = new LinearService({ apiKey, teamId });
    const coord = new AgentCoordination(linear);

    // Fetch recent issues and filter by label name 'opportunity'
    const issues = await linear.listIssues({ limit: 50 });
    const opportunities = (issues || []).filter((iss) =>
      Array.isArray(iss.labels) && iss.labels.some((l) => l.name?.toLowerCase() === 'opportunity')
    );

    if (opportunities.length === 0) {
      return { created: 0, total: 0 };
    }

    // Sort by priority desc, recency desc
    opportunities.sort((a, b) => (b.priority || 0) - (a.priority || 0) || b.updatedAt.getTime() - a.updatedAt.getTime());

    // Simple least-busy selection using in-memory counts (resets on restart)
    const defaultAgents = [
      'Frontend Agent',
      'Backend Agent',
      'DevOps Agent',
      'QA Agent',
    ];
    const activity: Record<string, number> = Object.fromEntries(defaultAgents.map((n) => [n, 0]));

    let created = 0;
    for (const opp of opportunities) {
      // Choose agent with smallest activity count
      const chosen = Object.entries(activity).sort((a, b) => a[1] - b[1])[0]?.[0] || defaultAgents[0];
      const title = `Outreach: ${opp.title}`;
      const description = `Source Opportunity: ${opp.url}\n\nFollow up and attempt to convert to revenue.\n\nAuto-generated by revenue loop.`;
      try {
        await coord.createAgentTask(chosen, title, description, Math.min(3, Math.max(1, opp.priority || 1)), ['agent-task', 'outreach']);
        activity[chosen] += 1;
        created += 1;
      } catch (e) {
        this.app.log.warn(`Failed to create outreach task for ${chosen}: ${(e as Error).message}`);
      }
    }

    return { created, total: opportunities.length };
  }

  /**
   * Poll connectors for device status updates
   */
  private async pollConnectors(): Promise<void> {
    // TODO: Implement actual connector polling logic

    // Mock implementation
    const devices = [
      { id: '1', name: 'GPU Rig Alpha' },
      { id: '2', name: 'Storage Node Beta' },
      { id: '3', name: 'CPU Farm Gamma' },
    ];

    for (const device of devices) {
      try {
        // Simulate polling each device
        const isOnline = Math.random() > 0.1; // 90% chance of being online
        const utilization = Math.random() * 100;

        this.app.log.debug(
          `Polled device ${device.id}: online=${isOnline}, utilization=${utilization.toFixed(1)}%`,
        );

        // TODO: Update device status in database
        // TODO: Trigger alerts if device goes offline or utilization is abnormal

        if (!isOnline) {
          this.app.log.warn(`Device ${device.id} (${device.name}) appears to be offline`);
        }

        if (utilization < 20) {
          this.app.log.warn(
            `Device ${device.id} (${device.name}) has low utilization: ${utilization.toFixed(1)}%`,
          );
        }
      } catch (error) {
        this.app.log.error(`Error polling device ${device.id}: ${(error as Error).message || String(error)}`);
      }
    }
  }

  /**
   * Check device metrics and generate alerts for anomalies
   */
  private async checkAndGenerateAlerts(): Promise<void> {
    // TODO: Implement actual alert generation logic

    try {
      // Mock alert generation based on device metrics
      const alertsGenerated = [];

      // Check for low utilization
      const lowUtilizationDevices = await this.getDevicesWithLowUtilization();
      for (const device of lowUtilizationDevices) {
        // TODO: Create alert in database
        alertsGenerated.push({
          type: 'utilization_low',
          deviceId: device.id,
          severity: 'medium',
        });
      }

      // Check for offline devices
      const offlineDevices = await this.getOfflineDevices();
      for (const device of offlineDevices) {
        // TODO: Create alert in database
        alertsGenerated.push({
          type: 'device_offline',
          deviceId: device.id,
          severity: 'high',
        });
      }

      // Check for earnings drops
      const earningsDrops = await this.checkEarningsDrops();
      for (const drop of earningsDrops) {
        // TODO: Create alert in database
        alertsGenerated.push({
          type: 'earnings_drop',
          ownerId: drop.ownerId,
          severity: 'medium',
        });
      }

      if (alertsGenerated.length > 0) {
        this.app.log.info(`Generated ${alertsGenerated.length} new alerts`);
      }
    } catch (error) {
      this.app.log.error(`Error in alert generation: ${(error as Error).message || String(error)}`);
    }
  }

  /**
   * Generate weekly statements for all owners
   */
  private async generateWeeklyStatements(): Promise<void> {
    // TODO: Implement actual weekly statement generation

    try {
      // Calculate previous week's date range
      const now = new Date();
      const lastMonday = new Date(now);
      lastMonday.setDate(now.getDate() - now.getDay() - 6); // Previous Monday
      lastMonday.setHours(0, 0, 0, 0);

      const lastSunday = new Date(lastMonday);
      lastSunday.setDate(lastMonday.getDate() + 6);
      lastSunday.setHours(23, 59, 59, 999);

      // TODO: Get all owners from database
      const owners = [
        { id: '1', email: 'john@example.com' },
        { id: '2', email: 'jane@example.com' },
      ];

      const statementsGenerated = [];

      for (const owner of owners) {
        try {
          // TODO: Generate statement using statement service
          const statement = {
            ownerId: owner.id,
            type: 'comprehensive',
            period: {
              startDate: lastMonday.toISOString(),
              endDate: lastSunday.toISOString(),
            },
            format: 'pdf',
            sendEmail: true,
            emailAddress: owner.email,
          };

          // TODO: Call statement generation service
          statementsGenerated.push(statement);

          this.app.log.info(`Queued weekly statement for owner ${owner.id}`);
        } catch (error) {
          this.app.log.error(`Error generating statement for owner ${owner.id}: ${(error as Error).message || String(error)}`);
        }
      }

      this.app.log.info(`Generated ${statementsGenerated.length} weekly statements`);
    } catch (error) {
      this.app.log.error(`Error in weekly statement generation: ${(error as Error).message || String(error)}`);
    }
  }

  /**
   * Perform daily cleanup tasks
   */
  private async performDailyCleanup(): Promise<void> {
    try {
      const tasks = [];

      // Clean up old resolved alerts (older than 30 days)
      tasks.push(this.cleanupOldAlerts());

      // Clean up old job records (older than 7 days)
      tasks.push(this.cleanupOldJobs());

      // Clean up temporary statement files (older than 7 days)
      tasks.push(this.cleanupOldStatements());

      // Update device statistics
      tasks.push(this.updateDeviceStatistics());

      await Promise.all(tasks);

      this.app.log.info('Daily cleanup tasks completed');
    } catch (error) {
      this.app.log.error(`Error during daily cleanup: ${(error as Error).message || String(error)}`);
    }
  }

  /**
   * Check for performance optimization opportunities
   */
  private async checkPerformanceOptimization(): Promise<void> {
    try {
      // TODO: Implement performance optimization checks

      // Check for devices that could benefit from repricing
      const repricingCandidates = await this.getRepricingCandidates();

      // Check for devices that need maintenance
      const maintenanceCandidates = await this.getMaintenanceCandidates();

      if (repricingCandidates.length > 0) {
        this.app.log.info(
          `Found ${repricingCandidates.length} devices that may benefit from repricing`,
        );
      }

      if (maintenanceCandidates.length > 0) {
        this.app.log.info(
          `Found ${maintenanceCandidates.length} devices that may need maintenance`,
        );
      }
    } catch (error) {
      this.app.log.error(`Error during performance optimization check: ${(error as Error).message || String(error)}`);
    }
  }

  // Helper methods (mock implementations)

  private async getDevicesWithLowUtilization(): Promise<Array<{ id: string; name: string }>> {
    // TODO: Query database for devices with utilization < threshold
    return Math.random() > 0.8 ? [{ id: '1', name: 'GPU Rig Alpha' }] : [];
  }

  private async getOfflineDevices(): Promise<Array<{ id: string; name: string }>> {
    // TODO: Query database for offline devices
    return Math.random() > 0.9 ? [{ id: '2', name: 'Storage Node Beta' }] : [];
  }

  private async checkEarningsDrops(): Promise<Array<{ ownerId: string; dropPercentage: number }>> {
    // TODO: Check for significant earnings drops
    return Math.random() > 0.85 ? [{ ownerId: '1', dropPercentage: 25 }] : [];
  }

  private async cleanupOldAlerts(): Promise<void> {
    // TODO: Delete resolved alerts older than 30 days
    this.app.log.debug('Cleaned up old alerts');
  }

  private async cleanupOldJobs(): Promise<void> {
    // TODO: Delete job records older than 7 days
    this.app.log.debug('Cleaned up old job records');
  }

  private async cleanupOldStatements(): Promise<void> {
    // TODO: Delete temporary statement files older than 7 days
    this.app.log.debug('Cleaned up old statement files');
  }

  private async updateDeviceStatistics(): Promise<void> {
    // TODO: Update daily device statistics
    this.app.log.debug('Updated device statistics');
  }

  private async getRepricingCandidates(): Promise<Array<{ id: string; reason: string }>> {
    // TODO: Find devices that could benefit from repricing
    return [];
  }

  private async getMaintenanceCandidates(): Promise<Array<{ id: string; reason: string }>> {
    // TODO: Find devices that may need maintenance
    return [];
  }

  /**
   * Get status of all scheduled jobs
   */
  public getJobStatus(): Array<{ name: string; isRunning: boolean }> {
    return Array.from(this.jobs.entries()).map(([name]) => ({
      name,
      isRunning: false,
    }));
  }

  /**
   * Manually trigger a specific job (useful for testing)
   */
  public async triggerJob(jobName: string): Promise<boolean> {
    switch (jobName) {
      case 'connector-polling':
        await this.pollConnectors();
        return true;
      case 'alert-generation':
        await this.checkAndGenerateAlerts();
        return true;
      case 'weekly-statements':
        await this.generateWeeklyStatements();
        return true;
      case 'daily-cleanup':
        await this.performDailyCleanup();
        return true;
      case 'performance-optimization':
        await this.checkPerformanceOptimization();
        return true;
      case 'revenue-loop':
        await this.runRevenueLoop();
        return true;
      default:
        return false;
    }
  }
}
