import type { FastifyInstance } from 'fastify';
export declare class Scheduler {
    private app;
    private jobs;
    constructor(app: FastifyInstance);
    /**
     * Initialize all scheduled jobs
     */
    start(): void;
    /**
     * Stop all scheduled jobs
     */
    stop(): void;
    /**
     * Schedule hourly connector polling to check device status
     */
    private scheduleConnectorPolling;
    /**
     * Schedule alert generation based on device utilization and performance
     */
    private scheduleAlertGeneration;
    /**
     * Schedule weekly statement generation (Mondays at 9 AM UTC)
     */
    private scheduleWeeklyStatements;
    /**
     * Schedule daily cleanup tasks
     */
    private scheduleDailyCleanup;
    /**
     * Schedule performance optimization checks
     */
    private schedulePerformanceOptimization;
    /**
     * Poll connectors for device status updates
     */
    private pollConnectors;
    /**
     * Check device metrics and generate alerts for anomalies
     */
    private checkAndGenerateAlerts;
    /**
     * Generate weekly statements for all owners
     */
    private generateWeeklyStatements;
    /**
     * Perform daily cleanup tasks
     */
    private performDailyCleanup;
    /**
     * Check for performance optimization opportunities
     */
    private checkPerformanceOptimization;
    private getDevicesWithLowUtilization;
    private getOfflineDevices;
    private checkEarningsDrops;
    private cleanupOldAlerts;
    private cleanupOldJobs;
    private cleanupOldStatements;
    private updateDeviceStatistics;
    private getRepricingCandidates;
    private getMaintenanceCandidates;
    /**
     * Get status of all scheduled jobs
     */
    getJobStatus(): Array<{
        name: string;
        isRunning: boolean;
    }>;
    /**
     * Manually trigger a specific job (useful for testing)
     */
    triggerJob(jobName: string): Promise<boolean>;
}
//# sourceMappingURL=scheduler.d.ts.map