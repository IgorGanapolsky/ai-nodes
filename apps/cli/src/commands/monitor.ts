import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ApiClient } from '../utils/api-client.js';

export const monitorCommand = new Command('monitor')
  .description('Real-time monitoring and alerting')
  .addCommand(
    new Command('watch')
      .description('Watch nodes for real-time status changes')
      .option('-n, --nodes <nodes>', 'Comma-separated list of node IDs to watch')
      .option('-i, --interval <seconds>', 'Polling interval in seconds', '10')
      .option('--alerts-only', 'Only show alerts and status changes')
      .action(async (options) => {
        const interval = parseInt(options.interval);
        const nodeIds = options.nodes ? options.nodes.split(',').map((id: string) => id.trim()) : null;
        let running = true;
        let lastStates = new Map();

        console.log(chalk.cyan('🔍 Starting DePIN node monitoring...'));
        if (nodeIds) {
          console.log(chalk.gray(`Watching nodes: ${nodeIds.join(', ')}`));
        } else {
          console.log(chalk.gray('Watching all nodes'));
        }
        console.log(chalk.gray(`Polling every ${interval} seconds\n`));

        // Handle Ctrl+C
        process.on('SIGINT', () => {
          running = false;
          console.log(chalk.yellow('\n👋 Monitoring stopped'));
          process.exit(0);
        });

        const checkNodes = async () => {
          try {
            const apiClient = new ApiClient();
            const response = await apiClient.getNodes({
              limit: 100
            });

            const nodes = nodeIds
              ? response.nodes.filter(node => nodeIds.includes(node.id))
              : response.nodes;

            const timestamp = new Date().toLocaleTimeString();

            for (const node of nodes) {
              const lastState = lastStates.get(node.id);
              const currentState = {
                status: node.status,
                uptime: node.metrics.uptime,
                cpu: node.metrics.cpu,
                memory: node.metrics.memory
              };

              if (!lastState) {
                // First time seeing this node
                if (!options.alertsOnly) {
                  console.log(`[${timestamp}] ${getStatusIcon(node.status)} ${node.name} (${node.id}): ${node.status}`);
                }
                lastStates.set(node.id, currentState);
                continue;
              }

              // Check for status changes
              if (lastState.status !== currentState.status) {
                const statusColor = getStatusColor(currentState.status);
                console.log(chalk.bold(`[${timestamp}] 🔄 ${node.name} status changed: ${getStatusColor(lastState.status)(lastState.status)} → ${statusColor(currentState.status)}`));
              }

              // Check for performance alerts
              if (currentState.cpu > 80 && lastState.cpu <= 80) {
                console.log(chalk.red(`[${timestamp}] ⚠️  ${node.name}: High CPU usage (${currentState.cpu.toFixed(1)}%)`));
              }

              if (currentState.memory > 90 && lastState.memory <= 90) {
                console.log(chalk.red(`[${timestamp}] ⚠️  ${node.name}: High memory usage (${currentState.memory.toFixed(1)}%)`));
              }

              if (currentState.uptime < 95 && lastState.uptime >= 95) {
                console.log(chalk.yellow(`[${timestamp}] ⚠️  ${node.name}: Uptime dropped below 95% (${currentState.uptime.toFixed(1)}%)`));
              }

              // Regular status update (if not alerts-only)
              if (!options.alertsOnly && Math.random() < 0.1) { // Show occasional updates
                console.log(`[${timestamp}] ${getStatusIcon(node.status)} ${node.name}: ${node.status} (CPU: ${currentState.cpu.toFixed(1)}%, Mem: ${currentState.memory.toFixed(1)}%)`);
              }

              lastStates.set(node.id, currentState);
            }

          } catch (error) {
            console.error(chalk.red(`[${new Date().toLocaleTimeString()}] Error fetching node data: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        };

        // Initial check
        await checkNodes();

        // Start monitoring loop
        const monitorInterval = setInterval(async () => {
          if (running) {
            await checkNodes();
          } else {
            clearInterval(monitorInterval);
          }
        }, interval * 1000);
      })
  )
  .addCommand(
    new Command('alerts')
      .description('Monitor for new alerts in real-time')
      .option('-s, --severity <severity>', 'Minimum severity level (low, medium, high, critical)', 'medium')
      .option('-i, --interval <seconds>', 'Polling interval in seconds', '30')
      .action(async (options) => {
        const interval = parseInt(options.interval);
        const minSeverity = options.severity;
        let running = true;
        let lastAlertCount = 0;
        let seenAlerts = new Set();

        const severityLevels = ['low', 'medium', 'high', 'critical'];
        const minSeverityIndex = severityLevels.indexOf(minSeverity);

        console.log(chalk.cyan('🚨 Starting alert monitoring...'));
        console.log(chalk.gray(`Minimum severity: ${minSeverity}`));
        console.log(chalk.gray(`Checking every ${interval} seconds\n`));

        // Handle Ctrl+C
        process.on('SIGINT', () => {
          running = false;
          console.log(chalk.yellow('\n👋 Alert monitoring stopped'));
          process.exit(0);
        });

        const checkAlerts = async () => {
          try {
            const apiClient = new ApiClient();
            const response = await apiClient.getAlerts({
              status: 'active'
            });

            const filteredAlerts = response.alerts.filter(alert => {
              const alertSeverityIndex = severityLevels.indexOf(alert.severity);
              return alertSeverityIndex >= minSeverityIndex;
            });

            const timestamp = new Date().toLocaleTimeString();

            // Check for new alerts
            for (const alert of filteredAlerts) {
              if (!seenAlerts.has(alert.id)) {
                const severityColor = getSeverityColor(alert.severity);
                console.log(chalk.bold(`[${timestamp}] 🚨 NEW ALERT`));
                console.log(`  Severity: ${severityColor(alert.severity.toUpperCase())}`);
                console.log(`  Node: ${alert.nodeId}`);
                console.log(`  Type: ${alert.type}`);
                console.log(`  Message: ${alert.message}`);
                console.log('');

                seenAlerts.add(alert.id);
              }
            }

            // Update count
            if (filteredAlerts.length !== lastAlertCount) {
              if (filteredAlerts.length > lastAlertCount) {
                console.log(chalk.red(`[${timestamp}] Alert count increased: ${lastAlertCount} → ${filteredAlerts.length}`));
              } else {
                console.log(chalk.green(`[${timestamp}] Alert count decreased: ${lastAlertCount} → ${filteredAlerts.length}`));
              }
              lastAlertCount = filteredAlerts.length;
            }

            // Clean up resolved alerts from seen set
            const activeAlertIds = new Set(filteredAlerts.map(alert => alert.id));
            seenAlerts = new Set([...seenAlerts].filter(id => activeAlertIds.has(id)));

          } catch (error) {
            console.error(chalk.red(`[${new Date().toLocaleTimeString()}] Error fetching alerts: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        };

        // Initial check
        await checkAlerts();

        // Start monitoring loop
        const alertInterval = setInterval(async () => {
          if (running) {
            await checkAlerts();
          } else {
            clearInterval(alertInterval);
          }
        }, interval * 1000);
      })
  )
  .addCommand(
    new Command('performance')
      .description('Monitor performance metrics in real-time')
      .option('-n, --node <nodeId>', 'Specific node ID to monitor')
      .option('-i, --interval <seconds>', 'Update interval in seconds', '5')
      .option('-t, --threshold <threshold>', 'Performance threshold for alerts', '80')
      .action(async (options) => {
        const interval = parseInt(options.interval);
        const threshold = parseFloat(options.threshold);
        const nodeId = options.node;
        let running = true;

        console.log(chalk.cyan('📊 Starting performance monitoring...'));
        if (nodeId) {
          console.log(chalk.gray(`Monitoring node: ${nodeId}`));
        } else {
          console.log(chalk.gray('Monitoring all nodes'));
        }
        console.log(chalk.gray(`Update interval: ${interval}s, Alert threshold: ${threshold}%\n`));

        // Handle Ctrl+C
        process.on('SIGINT', () => {
          running = false;
          console.log(chalk.yellow('\n👋 Performance monitoring stopped'));
          process.exit(0);
        });

        const checkPerformance = async () => {
          const spinner = ora('Fetching performance data...').start();

          try {
            const apiClient = new ApiClient();
            const timestamp = new Date().toLocaleTimeString();

            if (nodeId) {
              // Monitor specific node
              const node = await apiClient.getNode(nodeId);
              spinner.stop();

              console.log(`[${timestamp}] ${node.name} (${node.id}):`);

              const cpuColor = node.metrics.cpu > threshold ? chalk.red : chalk.green;
              const memColor = node.metrics.memory > threshold ? chalk.red : chalk.green;

              console.log(`  CPU: ${cpuColor(node.metrics.cpu.toFixed(1))}%`);
              console.log(`  Memory: ${memColor(node.metrics.memory.toFixed(1))}%`);
              console.log(`  Storage: ${node.metrics.storage.toFixed(1)}%`);
              console.log(`  Uptime: ${node.metrics.uptime.toFixed(1)}%`);
              console.log('');

              // Performance alerts
              if (node.metrics.cpu > threshold) {
                console.log(chalk.red(`⚠️  HIGH CPU: ${node.metrics.cpu.toFixed(1)}% > ${threshold}%`));
              }
              if (node.metrics.memory > threshold) {
                console.log(chalk.red(`⚠️  HIGH MEMORY: ${node.metrics.memory.toFixed(1)}% > ${threshold}%`));
              }

            } else {
              // Monitor all nodes
              const response = await apiClient.getNodes({ limit: 100 });
              spinner.stop();

              console.log(`[${timestamp}] Performance Summary:`);

              let totalCpu = 0;
              let totalMemory = 0;
              let alertCount = 0;

              for (const node of response.nodes) {
                totalCpu += node.metrics.cpu;
                totalMemory += node.metrics.memory;

                if (node.metrics.cpu > threshold || node.metrics.memory > threshold) {
                  alertCount++;
                  console.log(chalk.yellow(`  ⚠️  ${node.name}: CPU ${node.metrics.cpu.toFixed(1)}%, Memory ${node.metrics.memory.toFixed(1)}%`));
                }
              }

              const avgCpu = totalCpu / response.nodes.length;
              const avgMemory = totalMemory / response.nodes.length;

              console.log(`  Average CPU: ${avgCpu.toFixed(1)}%`);
              console.log(`  Average Memory: ${avgMemory.toFixed(1)}%`);
              console.log(`  Nodes over threshold: ${alertCount}/${response.nodes.length}`);
              console.log('');
            }

          } catch (error) {
            spinner.fail('Failed to fetch performance data');
            console.error(chalk.red(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`));
          }
        };

        // Initial check
        await checkPerformance();

        // Start monitoring loop
        const perfInterval = setInterval(async () => {
          if (running) {
            await checkPerformance();
          } else {
            clearInterval(perfInterval);
          }
        }, interval * 1000);
      })
  );

function getStatusIcon(status: string): string {
  switch (status) {
    case 'online': return '🟢';
    case 'offline': return '🔴';
    case 'maintenance': return '🟡';
    case 'error': return '🔴';
    default: return '⚪';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'online': return chalk.green;
    case 'offline': return chalk.red;
    case 'maintenance': return chalk.yellow;
    case 'error': return chalk.red;
    default: return chalk.gray;
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return chalk.red.bold;
    case 'high': return chalk.red;
    case 'medium': return chalk.yellow;
    case 'low': return chalk.blue;
    default: return chalk.gray;
  }
}