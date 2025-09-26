import { Command } from 'commander';
import chalk from 'chalk';
import { table } from 'table';
import boxen from 'boxen';
import ora from 'ora';
import { ApiClient } from '../utils/api-client.js';
export const dashboardCommand = new Command('dashboard')
  .alias('dash')
  .description('Display a real-time dashboard overview')
  .option('-r, --refresh <seconds>', 'Auto-refresh interval in seconds', '30')
  .option('--no-colors', 'Disable colored output')
  .action(async (options) => {
    const refreshInterval = parseInt(options.refresh);
    let running = true;
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      running = false;
      console.log(chalk.yellow('\n👋 Dashboard stopped'));
      process.exit(0);
    });
    const showDashboard = async () => {
      const spinner = ora('Loading dashboard data...').start();
      try {
        const apiClient = new ApiClient();
        const [summary, nodes, alerts] = await Promise.all([
          apiClient.getMetricsSummary('24h'),
          apiClient.getNodes({ limit: 10 }),
          apiClient.getAlerts({ status: 'active', limit: 5 }),
        ]);
        spinner.stop();
        // Clear screen
        console.clear();
        // Header
        const header = boxen(
          chalk.cyan.bold('🚀 DePIN Autopilot Dashboard') +
            '\n' +
            chalk.gray(`Last updated: ${new Date().toLocaleTimeString()}`),
          {
            padding: 1,
            margin: { bottom: 1 },
            borderStyle: 'round',
            borderColor: 'cyan',
          },
        );
        console.log(header);
        // Summary metrics
        const summaryBox = boxen(createSummaryDisplay(summary), {
          title: '📊 Overview (24h)',
          padding: 1,
          margin: { bottom: 1 },
          borderStyle: 'round',
        });
        console.log(summaryBox);
        // Node status
        if (nodes.nodes.length > 0) {
          const nodeStatusTable = [['Node', 'Type', 'Status', 'Uptime', 'Earnings']];
          nodes.nodes.slice(0, 5).forEach((node) => {
            const statusIcon = getStatusIcon(node.status);
            const statusColor = getStatusColor(node.status);
            nodeStatusTable.push([
              node.name.length > 15 ? node.name.substring(0, 12) + '...' : node.name,
              node.type,
              statusColor(`${statusIcon} ${node.status}`),
              `${node.metrics.uptime.toFixed(1)}%`,
              `${node.metrics.earnings.toFixed(4)}`,
            ]);
          });
          const nodesBox = boxen(table(nodeStatusTable, { border: { horizontal: '─' } }), {
            title: '📡 Node Status',
            padding: 1,
            margin: { bottom: 1 },
            borderStyle: 'round',
          });
          console.log(nodesBox);
        }
        // Active alerts
        if (alerts.alerts.length > 0) {
          const alertsDisplay = alerts.alerts
            .map((alert) => {
              const severityColor = getSeverityColor(alert.severity);
              const timeAgo = getTimeAgo(new Date(alert.timestamp));
              return `${severityColor(alert.severity.toUpperCase())} ${alert.nodeId}: ${alert.message} (${timeAgo})`;
            })
            .join('\n');
          const alertsBox = boxen(alertsDisplay, {
            title: '🚨 Active Alerts',
            padding: 1,
            margin: { bottom: 1 },
            borderStyle: 'round',
            borderColor: 'red',
          });
          console.log(alertsBox);
        } else {
          const noAlertsBox = boxen(chalk.green('✅ No active alerts'), {
            title: '🚨 Active Alerts',
            padding: 1,
            margin: { bottom: 1 },
            borderStyle: 'round',
            borderColor: 'green',
          });
          console.log(noAlertsBox);
        }
        // Footer
        console.log(chalk.gray(`Press Ctrl+C to exit • Refreshing every ${refreshInterval}s`));
      } catch (error) {
        spinner.fail('Failed to load dashboard data');
        console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
      }
    };
    // Initial load
    await showDashboard();
    // Auto-refresh
    const interval = setInterval(async () => {
      if (running) {
        await showDashboard();
      } else {
        clearInterval(interval);
      }
    }, refreshInterval * 1000);
  });
function createSummaryDisplay(summary) {
  const metrics = [
    ['Total Nodes', summary.totalNodes.toString()],
    ['Online', chalk.green(summary.onlineNodes.toString())],
    [
      'Offline',
      summary.offlineNodes > 0 ? chalk.red(summary.offlineNodes.toString()) : chalk.green('0'),
    ],
    ['Total Earnings', chalk.yellow(`${summary.totalEarnings.toFixed(4)} tokens`)],
    ['Avg Uptime', `${summary.averageUptime.toFixed(1)}%`],
    [
      'Performance Score',
      getPerformanceColor(summary.performanceScore)(`${summary.performanceScore.toFixed(1)}/100`),
    ],
  ];
  return metrics.map(([label, value]) => `${label.padEnd(18)}: ${value}`).join('\n');
}
function getStatusIcon(status) {
  switch (status) {
    case 'online':
      return '🟢';
    case 'offline':
      return '🔴';
    case 'maintenance':
      return '🟡';
    case 'error':
      return '🔴';
    default:
      return '⚪';
  }
}
function getStatusColor(status) {
  switch (status) {
    case 'online':
      return chalk.green;
    case 'offline':
      return chalk.red;
    case 'maintenance':
      return chalk.yellow;
    case 'error':
      return chalk.red;
    default:
      return chalk.gray;
  }
}
function getSeverityColor(severity) {
  switch (severity) {
    case 'critical':
      return chalk.red.bold;
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.blue;
    default:
      return chalk.gray;
  }
}
function getPerformanceColor(score) {
  if (score >= 90) {return chalk.green;}
  if (score >= 70) {return chalk.yellow;}
  return chalk.red;
}
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) {return `${diffDays}d ago`;}
  if (diffHours > 0) {return `${diffHours}h ago`;}
  if (diffMins > 0) {return `${diffMins}m ago`;}
  return 'Just now';
}
