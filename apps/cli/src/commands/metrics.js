import { Command } from 'commander';
import chalk from 'chalk';
import { table } from 'table';
import ora from 'ora';
import { ApiClient } from '../utils/api-client.js';
export const metricsCommand = new Command('metrics')
  .description('View performance metrics and analytics')
  .addCommand(
    new Command('summary')
      .description('Show aggregated metrics summary')
      .option('-t, --timeframe <timeframe>', 'Time frame (1h, 24h, 7d, 30d)', '24h')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        const spinner = ora('Fetching metrics summary...').start();
        try {
          const apiClient = new ApiClient();
          const summary = await apiClient.getMetricsSummary(options.timeframe);
          spinner.stop();
          if (options.json) {
            console.log(JSON.stringify(summary, null, 2));
            return;
          }
          console.log(chalk.cyan(`\n📊 Metrics Summary (${options.timeframe})`));
          console.log(chalk.gray('─'.repeat(50)));
          const metricsTable = [
            ['Metric', 'Value'],
            ['Total Nodes', summary.totalNodes.toString()],
            ['Online Nodes', chalk.green(summary.onlineNodes.toString())],
            ['Offline Nodes', chalk.red(summary.offlineNodes.toString())],
            ['Total Earnings', chalk.yellow(`${summary.totalEarnings.toFixed(4)} tokens`)],
            ['Average Uptime', `${summary.averageUptime.toFixed(1)}%`],
            ['Average CPU Usage', `${summary.averageCpu.toFixed(1)}%`],
            ['Average Memory Usage', `${summary.averageMemory.toFixed(1)}%`],
            ['Total Storage', `${summary.totalStorage.toFixed(1)} TB`],
            [
              'Active Alerts',
              summary.alertsCount > 0
                ? chalk.red(summary.alertsCount.toString())
                : chalk.green('0'),
            ],
            [
              'Performance Score',
              getPerformanceColor(summary.performanceScore)(
                `${summary.performanceScore.toFixed(1)}/100`,
              ),
            ],
          ];
          console.log(table(metricsTable));
        } catch (error) {
          spinner.fail('Failed to fetch metrics summary');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }
      }),
  )
  .addCommand(
    new Command('node')
      .description('Show detailed metrics for a specific node')
      .argument('<nodeId>', 'Node ID')
      .option('-t, --timeframe <timeframe>', 'Time frame (1h, 24h, 7d, 30d)', '24h')
      .option(
        '-m, --metrics <metrics>',
        'Specific metrics to show (cpu,memory,storage,earnings)',
        'all',
      )
      .option('--json', 'Output as JSON')
      .action(async (nodeId, options) => {
        const spinner = ora(`Fetching metrics for node ${nodeId}...`).start();
        try {
          const apiClient = new ApiClient();
          const metrics = await apiClient.getNodeMetrics(nodeId, options.timeframe);
          spinner.stop();
          if (options.json) {
            console.log(JSON.stringify(metrics, null, 2));
            return;
          }
          console.log(chalk.cyan(`\n📈 Node Metrics: ${nodeId} (${options.timeframe})`));
          console.log(chalk.gray('─'.repeat(50)));
          // Show latest values
          const latestMetrics = {
            uptime: metrics.uptime[metrics.uptime.length - 1]?.value || 0,
            cpu: metrics.cpu[metrics.cpu.length - 1]?.value || 0,
            memory: metrics.memory[metrics.memory.length - 1]?.value || 0,
            storage: metrics.storage[metrics.storage.length - 1]?.value || 0,
            earnings: metrics.earnings[metrics.earnings.length - 1]?.value || 0,
            networkLatency: metrics.networkLatency[metrics.networkLatency.length - 1]?.value || 0,
          };
          const currentTable = [
            ['Metric', 'Current Value', 'Status'],
            [
              'Uptime',
              `${latestMetrics.uptime.toFixed(1)}%`,
              getUptimeStatus(latestMetrics.uptime),
            ],
            ['CPU Usage', `${latestMetrics.cpu.toFixed(1)}%`, getCpuStatus(latestMetrics.cpu)],
            [
              'Memory Usage',
              `${latestMetrics.memory.toFixed(1)}%`,
              getMemoryStatus(latestMetrics.memory),
            ],
            [
              'Storage Used',
              `${latestMetrics.storage.toFixed(1)}%`,
              getStorageStatus(latestMetrics.storage),
            ],
            ['Total Earnings', `${latestMetrics.earnings.toFixed(4)} tokens`, '💰'],
            [
              'Network Latency',
              `${latestMetrics.networkLatency.toFixed(0)}ms`,
              getLatencyStatus(latestMetrics.networkLatency),
            ],
          ];
          console.log(table(currentTable));
          // Show trend indicators
          console.log(chalk.cyan('\n📊 Trends:'));
          showTrendIndicator('Uptime', metrics.uptime);
          showTrendIndicator('CPU', metrics.cpu);
          showTrendIndicator('Memory', metrics.memory);
          showTrendIndicator('Earnings', metrics.earnings);
        } catch (error) {
          spinner.fail(`Failed to fetch metrics for node ${nodeId}`);
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }
      }),
  )
  .addCommand(
    new Command('alerts')
      .description('Show active alerts and anomalies')
      .option('-s, --severity <severity>', 'Filter by severity (low, medium, high, critical)')
      .option('--status <status>', 'Filter by status (active, resolved, acknowledged)')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        const spinner = ora('Fetching alerts...').start();
        try {
          const apiClient = new ApiClient();
          const response = await apiClient.getAlerts({
            severity: options.severity,
            status: options.status,
          });
          spinner.stop();
          if (options.json) {
            console.log(JSON.stringify(response, null, 2));
            return;
          }
          if (response.alerts.length === 0) {
            console.log(chalk.green('✅ No active alerts found.'));
            return;
          }
          console.log(chalk.cyan(`\n🚨 Active Alerts (${response.total})`));
          console.log(chalk.gray('─'.repeat(70)));
          const alertsTable = [['Severity', 'Node', 'Type', 'Message', 'Time']];
          response.alerts.forEach((alert) => {
            const severityColor = getSeverityColor(alert.severity);
            const timeAgo = getTimeAgo(new Date(alert.timestamp));
            alertsTable.push([
              severityColor(alert.severity.toUpperCase()),
              alert.nodeId,
              alert.type,
              alert.message.length > 40 ? alert.message.substring(0, 37) + '...' : alert.message,
              timeAgo,
            ]);
          });
          console.log(table(alertsTable));
        } catch (error) {
          spinner.fail('Failed to fetch alerts');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }
      }),
  );
function getPerformanceColor(score) {
  if (score >= 90) {return chalk.green;}
  if (score >= 70) {return chalk.yellow;}
  return chalk.red;
}
function getUptimeStatus(uptime) {
  if (uptime >= 99) {return chalk.green('🟢 Excellent');}
  if (uptime >= 95) {return chalk.yellow('🟡 Good');}
  return chalk.red('🔴 Poor');
}
function getCpuStatus(cpu) {
  if (cpu < 50) {return chalk.green('🟢 Normal');}
  if (cpu < 80) {return chalk.yellow('🟡 High');}
  return chalk.red('🔴 Critical');
}
function getMemoryStatus(memory) {
  if (memory < 70) {return chalk.green('🟢 Normal');}
  if (memory < 90) {return chalk.yellow('🟡 High');}
  return chalk.red('🔴 Critical');
}
function getStorageStatus(storage) {
  if (storage < 80) {return chalk.green('🟢 Normal');}
  if (storage < 95) {return chalk.yellow('🟡 High');}
  return chalk.red('🔴 Critical');
}
function getLatencyStatus(latency) {
  if (latency < 100) {return chalk.green('🟢 Excellent');}
  if (latency < 300) {return chalk.yellow('🟡 Good');}
  return chalk.red('🔴 Poor');
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
function showTrendIndicator(name, data) {
  if (data.length < 2) {return;}
  const recent = data.slice(-5);
  const trend = recent[recent.length - 1].value - recent[0].value;
  const trendIcon = trend > 0 ? '📈' : trend < 0 ? '📉' : '➡️';
  const trendColor = trend > 0 ? chalk.green : trend < 0 ? chalk.red : chalk.gray;
  console.log(
    `  ${trendIcon} ${name}: ${trendColor(trend > 0 ? '+' : '')}${trendColor(trend.toFixed(2))}`,
  );
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
