import { Command } from 'commander';
import chalk from 'chalk';
import { table } from 'table';
import inquirer from 'inquirer';
import ora from 'ora';
import { ApiClient } from '../utils/api-client.js';

export const nodeCommand = new Command('node')
  .description('Manage DePIN nodes')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all registered nodes')
      .option('-s, --status <status>', 'Filter by status (online, offline, maintenance, error)')
      .option('-t, --type <type>', 'Filter by node type')
      .option('-r, --region <region>', 'Filter by region')
      .option('--json', 'Output as JSON')
      .action(async (options) => {
        const spinner = ora('Fetching nodes...').start();

        try {
          const apiClient = new ApiClient();
          const response = await apiClient.getNodes({
            status: options.status,
            type: options.type,
            region: options.region,
          });

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(response, null, 2));
            return;
          }

          if (response.nodes.length === 0) {
            console.log(chalk.yellow('No nodes found.'));
            return;
          }

          const tableData = [['ID', 'Name', 'Type', 'Status', 'Region', 'Uptime %', 'Earnings']];

          response.nodes.forEach((node) => {
            const statusColor =
              node.status === 'online'
                ? chalk.green
                : node.status === 'offline'
                  ? chalk.red
                  : node.status === 'maintenance'
                    ? chalk.yellow
                    : chalk.magenta;

            tableData.push([
              node.id,
              node.name,
              node.type,
              statusColor(node.status),
              node.region,
              `${node.metrics.uptime.toFixed(1)}%`,
              `${node.metrics.earnings.toFixed(4)} tokens`,
            ]);
          });

          console.log(table(tableData));
          console.log(chalk.gray(`\nTotal: ${response.total} nodes`));
        } catch (error) {
          spinner.fail('Failed to fetch nodes');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }
      }),
  )
  .addCommand(
    new Command('show')
      .description('Show detailed information about a specific node')
      .argument('<nodeId>', 'Node ID to display')
      .option('--json', 'Output as JSON')
      .action(async (nodeId, options) => {
        const spinner = ora(`Fetching node ${nodeId}...`).start();

        try {
          const apiClient = new ApiClient();
          const node = await apiClient.getNode(nodeId);

          spinner.stop();

          if (options.json) {
            console.log(JSON.stringify(node, null, 2));
            return;
          }

          console.log(chalk.cyan(`\n📡 Node: ${node.name}`));
          console.log(chalk.gray('─'.repeat(50)));
          console.log(`ID:           ${node.id}`);
          console.log(`Type:         ${node.type}`);
          console.log(`Status:       ${getStatusIcon(node.status)} ${node.status}`);
          console.log(`Region:       ${node.region}`);
          console.log(`Version:      ${node.version}`);
          console.log(`Endpoint:     ${node.endpoint}`);
          console.log(`Last Seen:    ${new Date(node.lastSeen).toLocaleString()}`);

          console.log(chalk.cyan('\n📊 Metrics:'));
          console.log(`Uptime:       ${node.metrics.uptime.toFixed(1)}%`);
          console.log(`CPU Usage:    ${node.metrics.cpu.toFixed(1)}%`);
          console.log(`Memory Usage: ${node.metrics.memory.toFixed(1)}%`);
          console.log(`Storage Used: ${node.metrics.storage.toFixed(1)}%`);
          console.log(`Earnings:     ${node.metrics.earnings.toFixed(4)} tokens`);
        } catch (error) {
          spinner.fail(`Failed to fetch node ${nodeId}`);
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }
      }),
  )
  .addCommand(
    new Command('add')
      .description('Register a new DePIN node')
      .option('-n, --name <name>', 'Node name')
      .option('-t, --type <type>', 'Node type (helium, filecoin, etc.)')
      .option('-e, --endpoint <endpoint>', 'Node API endpoint')
      .option('-r, --region <region>', 'Node region')
      .option('--interactive', 'Interactive mode', true)
      .action(async (options) => {
        let nodeData = {
          name: options.name,
          type: options.type,
          endpoint: options.endpoint,
          region: options.region,
        };

        if (
          options.interactive ||
          !nodeData.name ||
          !nodeData.type ||
          !nodeData.endpoint ||
          !nodeData.region
        ) {
          console.log(chalk.cyan('🔧 Register New DePIN Node'));
          console.log(chalk.gray('Please provide the following information:\n'));

          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Node name:',
              default: nodeData.name,
              validate: (input) => input.trim() !== '' || 'Name is required',
            },
            {
              type: 'list',
              name: 'type',
              message: 'Node type:',
              choices: ['helium', 'filecoin', 'storj', 'theta', 'akash', 'other'],
              default: nodeData.type,
            },
            {
              type: 'input',
              name: 'endpoint',
              message: 'API endpoint URL:',
              default: nodeData.endpoint,
              validate: (input) => {
                try {
                  new URL(input);
                  return true;
                } catch {
                  return 'Please enter a valid URL';
                }
              },
            },
            {
              type: 'list',
              name: 'region',
              message: 'Region:',
              choices: ['us-east-1', 'us-west-1', 'eu-west-1', 'ap-southeast-1', 'other'],
              default: nodeData.region,
            },
          ]);

          nodeData = { ...nodeData, ...answers };
        }

        const spinner = ora('Registering node...').start();

        try {
          const apiClient = new ApiClient();
          const newNode = await apiClient.createNode(nodeData);

          spinner.succeed('Node registered successfully!');
          console.log(chalk.green(`\n✅ Node created with ID: ${newNode.id}`));
          console.log(chalk.gray(`Name: ${newNode.name}`));
          console.log(chalk.gray(`Type: ${newNode.type}`));
          console.log(chalk.gray(`Region: ${newNode.region}`));
        } catch (error) {
          spinner.fail('Failed to register node');
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }
      }),
  )
  .addCommand(
    new Command('remove')
      .alias('rm')
      .description('Remove a DePIN node')
      .argument('<nodeId>', 'Node ID to remove')
      .option('-f, --force', 'Skip confirmation')
      .action(async (nodeId, options) => {
        if (!options.force) {
          const { confirmed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmed',
              message: `Are you sure you want to remove node ${nodeId}?`,
              default: false,
            },
          ]);

          if (!confirmed) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
          }
        }

        const spinner = ora(`Removing node ${nodeId}...`).start();

        try {
          const apiClient = new ApiClient();
          await apiClient.deleteNode(nodeId);

          spinner.succeed('Node removed successfully!');
          console.log(chalk.green(`✅ Node ${nodeId} has been removed`));
        } catch (error) {
          spinner.fail(`Failed to remove node ${nodeId}`);
          console.error(chalk.red(error instanceof Error ? error.message : 'Unknown error'));
        }
      }),
  );

function getStatusIcon(status: string): string {
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
