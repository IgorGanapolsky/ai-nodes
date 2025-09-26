import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { api } from '../utils/api.js';
import { createTable, formatters } from '../utils/table.js';
export const pullCommand = new Command('pull')
  .description('Poll all connectors and show summary')
  .option('-w, --watch', 'Watch mode - refresh every 30 seconds', false)
  .option('-i, --interval <seconds>', 'Refresh interval in seconds (for watch mode)', '30')
  .option('-f, --format <format>', 'Output format (table, json)', 'table')
  .action(async (options) => {
    const interval = parseInt(options.interval);
    if (options.watch && (isNaN(interval) || interval < 5)) {
      console.error(chalk.red('Error: Interval must be at least 5 seconds'));
      process.exit(1);
    }
    const pullMetrics = async () => {
      const spinner = ora('Fetching device metrics...').start();
      try {
        const summary = await api.pullMetrics();
        spinner.succeed('Metrics updated');
        if (options.format === 'json') {
          console.log(JSON.stringify(summary, null, 2));
          return;
        }
        // Clear console in watch mode
        if (options.watch) {
          console.clear();
          console.log(chalk.bold.cyan('DePIN Autopilot - Live Dashboard\n'));
          console.log(chalk.gray(`Last updated: ${new Date().toLocaleString()}`));
          console.log(chalk.gray(`Next update in ${interval} seconds\n`));
        }
        // Display summary statistics
        console.log(
          '\n' +
            createTable(
              [
                { title: 'Metric', key: 'metric' },
                { title: 'Value', key: 'value' },
              ],
              [
                { metric: 'Total Devices', value: summary.totalDevices.toString() },
                { metric: 'Online Devices', value: chalk.green(summary.onlineDevices.toString()) },
                {
                  metric: 'Offline Devices',
                  value: chalk.red((summary.totalDevices - summary.onlineDevices).toString()),
                },
                { metric: '24h Revenue', value: formatters.currency(summary.totalRevenue24h) },
                { metric: '7d Revenue', value: formatters.currency(summary.totalRevenue7d) },
                {
                  metric: 'Avg Utilization',
                  value: formatters.percentage(summary.averageUtilization),
                },
                { metric: 'Last Updated', value: formatters.date(summary.lastUpdated) },
              ],
              { title: 'Network Summary' },
            ),
        );
        // Get detailed device metrics
        const devices = await api.getDevices();
        if (devices.length > 0) {
          const deviceStats = devices.map((device) => ({
            id: device.id.substring(0, 8) + '...',
            name: device.name,
            status: device.status,
            grossRevenue24h: device.metrics?.grossRevenue24h || 0,
            grossRevenue7d: device.metrics?.grossRevenue7d || 0,
            utilization: device.metrics?.utilization || 0,
            owner: device.ownerId.substring(0, 8) + '...',
          }));
          console.log(
            '\n' +
              createTable(
                [
                  { title: 'ID', key: 'id' },
                  { title: 'Device', key: 'name' },
                  { title: 'Owner', key: 'owner' },
                  { title: 'Status', key: 'status', color: formatters.status },
                  { title: '24h Gross', key: 'grossRevenue24h', color: formatters.currency },
                  { title: '7d Gross', key: 'grossRevenue7d', color: formatters.currency },
                  { title: 'Utilization', key: 'utilization', color: formatters.percentage },
                ],
                deviceStats,
                { title: 'Device Metrics' },
              ),
          );
          // Show alerts and warnings
          const alerts = generateAlerts(devices);
          if (alerts.length > 0) {
            console.log('\n' + chalk.bold.yellow('⚠️  Alerts:'));
            alerts.forEach((alert) => {
              console.log(`  ${alert.icon} ${alert.message}`);
            });
          }
          // Show recommendations
          const recommendations = generateRecommendations(summary, devices);
          if (recommendations.length > 0) {
            console.log('\n' + chalk.bold.blue('💡 Recommendations:'));
            recommendations.forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`);
            });
          }
        }
      } catch (error) {
        spinner.fail('Failed to fetch metrics');
        console.error(chalk.red('Error:'), error instanceof Error ? error.message : error);
        if (!options.watch) {
          process.exit(1);
        }
      }
    };
    // Initial pull
    await pullMetrics();
    // Set up watch mode
    if (options.watch) {
      console.log(chalk.gray('\nPress Ctrl+C to stop watching...\n'));
      const watchInterval = setInterval(async () => {
        await pullMetrics();
      }, interval * 1000);
      // Handle graceful shutdown
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\nStopping watch mode...'));
        clearInterval(watchInterval);
        process.exit(0);
      });
      // Keep the process running
      process.stdin.resume();
    }
  });
function generateAlerts(devices) {
  const alerts = [];
  const offlineDevices = devices.filter((d) => d.status === 'offline');
  if (offlineDevices.length > 0) {
    alerts.push({
      icon: '🔴',
      message: `${offlineDevices.length} device(s) offline: ${offlineDevices.map((d) => d.name).join(', ')}`,
    });
  }
  const lowUtilizationDevices = devices.filter((d) => d.metrics && d.metrics.utilization < 30);
  if (lowUtilizationDevices.length > 0) {
    alerts.push({
      icon: '📉',
      message: `${lowUtilizationDevices.length} device(s) with low utilization (<30%)`,
    });
  }
  const maintenanceDevices = devices.filter((d) => d.status === 'maintenance');
  if (maintenanceDevices.length > 0) {
    alerts.push({
      icon: '🔧',
      message: `${maintenanceDevices.length} device(s) in maintenance mode`,
    });
  }
  const staleDevices = devices.filter((d) => {
    const lastSeen = new Date(d.lastSeen);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return lastSeen < fiveMinutesAgo && d.status === 'online';
  });
  if (staleDevices.length > 0) {
    alerts.push({
      icon: '⏰',
      message: `${staleDevices.length} device(s) haven't reported in >5 minutes`,
    });
  }
  return alerts;
}
function generateRecommendations(summary, devices) {
  const recommendations = [];
  // Overall utilization recommendations
  if (summary.averageUtilization < 50) {
    recommendations.push(
      'Consider marketing or pricing adjustments to increase overall network utilization',
    );
  } else if (summary.averageUtilization > 90) {
    recommendations.push(
      'Network is highly utilized - consider adding more devices to handle demand',
    );
  }
  // Revenue growth recommendations
  const onlineDevices = devices.filter((d) => d.status === 'online');
  if (onlineDevices.length > 0) {
    const avgRevenue = summary.totalRevenue24h / onlineDevices.length;
    if (avgRevenue < 1.0) {
      recommendations.push('Low average revenue per device - review pricing strategy');
    }
  }
  // Offline device recommendations
  const offlineCount = devices.filter((d) => d.status === 'offline').length;
  const offlineRatio = offlineCount / Math.max(devices.length, 1);
  if (offlineRatio > 0.2) {
    recommendations.push(
      'High offline rate detected - check device connectivity and maintenance schedules',
    );
  }
  // Specific device recommendations
  const underperformingDevices = devices.filter(
    (d) => d.status === 'online' && d.metrics && d.metrics.utilization < 25,
  );
  if (underperformingDevices.length > 0) {
    recommendations.push(
      `${underperformingDevices.length} online devices have very low utilization - investigate or consider reprovisioning`,
    );
  }
  return recommendations;
}
