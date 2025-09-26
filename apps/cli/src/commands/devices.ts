import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { api, Device, Owner } from '../utils/api.js';
import { createTable, formatters } from '../utils/table.js';

const devicesCommand = new Command('devices')
  .description('Manage devices')
  .addCommand(createAddCommand())
  .addCommand(createListCommand())
  .addCommand(createShowCommand())
  .addCommand(createUpdateCommand())
  .addCommand(createRemoveCommand());

function createAddCommand(): Command {
  return new Command('add')
    .description('Add a new device')
    .option('-n, --name <name>', 'Device name')
    .option('-t, --type <type>', 'Device type')
    .option('-o, --owner <ownerId>', 'Owner ID')
    .option('--interactive', 'Use interactive mode', true)
    .action(async (options) => {
      try {
        let deviceData: Omit<Device, 'id' | 'lastSeen' | 'metrics'>;

        if (options.interactive && (!options.name || !options.type || !options.owner)) {
          // First, get list of owners for selection
          const spinner = ora('Loading owners...').start();
          let owners: Owner[] = [];

          try {
            owners = await api.getOwners();
            spinner.succeed('Owners loaded');
          } catch (error) {
            spinner.fail('Failed to load owners');
            throw error;
          }

          if (owners.length === 0) {
            console.error(
              chalk.red(
                'No owners found. Please create an owner first using: depinautopilot owners add',
              ),
            );
            process.exit(1);
          }

          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Device name:',
              default: options.name,
              validate: (input) => (input.trim() ? true : 'Device name is required'),
            },
            {
              type: 'list',
              name: 'type',
              message: 'Device type:',
              choices: [
                'IoT Node',
                'Storage Node',
                'Compute Node',
                'Network Node',
                'Validator Node',
                'Mining Rig',
                'Other',
              ],
              default: options.type || 'IoT Node',
            },
            {
              type: 'list',
              name: 'ownerId',
              message: 'Select owner:',
              choices: owners.map((owner) => ({
                name: `${owner.name} (${owner.email})`,
                value: owner.id,
              })),
              default: options.owner,
            },
            {
              type: 'list',
              name: 'status',
              message: 'Initial status:',
              choices: ['online', 'offline', 'maintenance'],
              default: 'offline',
            },
          ]);

          deviceData = answers;
        } else {
          if (!options.name || !options.type || !options.owner) {
            console.error(chalk.red('Error: Name, type, and owner are required'));
            console.log(chalk.gray('Use --interactive for guided setup'));
            process.exit(1);
          }

          deviceData = {
            name: options.name,
            type: options.type,
            ownerId: options.owner,
            status: 'offline',
          };
        }

        const spinner = ora('Creating device...').start();

        try {
          const newDevice = await api.createDevice(deviceData);
          spinner.succeed(chalk.green('Device created successfully!'));

          console.log(
            '\n' +
              createTable(
                [
                  { title: 'ID', key: 'id' },
                  { title: 'Name', key: 'name' },
                  { title: 'Type', key: 'type' },
                  { title: 'Owner', key: 'ownerId' },
                  { title: 'Status', key: 'status', color: formatters.status },
                  { title: 'Last Seen', key: 'lastSeen', color: formatters.date },
                ],
                [newDevice],
                { title: 'New Device Details' },
              ),
          );
        } catch (error) {
          spinner.fail('Failed to create device');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error creating device:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}

function createListCommand(): Command {
  return new Command('list')
    .alias('ls')
    .description('List devices')
    .option('-o, --owner <ownerId>', 'Filter by owner ID')
    .option('-s, --status <status>', 'Filter by status (online, offline, maintenance)')
    .option('-f, --format <format>', 'Output format (table, json)', 'table')
    .action(async (options) => {
      try {
        const spinner = ora('Fetching devices...').start();

        try {
          const devices = await api.getDevices(options.owner);

          // Filter by status if provided
          const filteredDevices = options.status
            ? devices.filter((device) => device.status === options.status)
            : devices;

          spinner.succeed(`Found ${filteredDevices.length} device(s)`);

          if (filteredDevices.length === 0) {
            console.log(chalk.yellow('No devices found.'));
            return;
          }

          if (options.format === 'json') {
            console.log(JSON.stringify(filteredDevices, null, 2));
            return;
          }

          console.log(
            '\n' +
              createTable(
                [
                  { title: 'ID', key: 'id' },
                  { title: 'Name', key: 'name' },
                  { title: 'Type', key: 'type' },
                  { title: 'Owner', key: 'ownerId' },
                  { title: 'Status', key: 'status', color: formatters.status },
                  { title: 'Last Seen', key: 'lastSeen', color: formatters.date },
                  {
                    title: '24h Revenue',
                    key: 'metrics.grossRevenue24h',
                    color: formatters.currency,
                  },
                  {
                    title: 'Utilization',
                    key: 'metrics.utilization',
                    color: formatters.percentage,
                  },
                ],
                filteredDevices.map((device) => ({
                  ...device,
                  'metrics.grossRevenue24h': device.metrics?.grossRevenue24h || 0,
                  'metrics.utilization': device.metrics?.utilization || 0,
                })),
                { title: 'Devices' },
              ),
          );
        } catch (error) {
          spinner.fail('Failed to fetch devices');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error fetching devices:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}

function createShowCommand(): Command {
  return new Command('show')
    .description('Show detailed device information')
    .argument('<id>', 'Device ID')
    .action(async (id) => {
      try {
        const spinner = ora('Fetching device details...').start();

        try {
          const device = await api.getDevice(id);
          spinner.succeed('Device details loaded');

          console.log(
            '\n' +
              createTable(
                [
                  { title: 'Property', key: 'key' },
                  { title: 'Value', key: 'value' },
                ],
                [
                  { key: 'ID', value: device.id },
                  { key: 'Name', value: device.name },
                  { key: 'Type', value: device.type },
                  { key: 'Owner ID', value: device.ownerId },
                  { key: 'Status', value: formatters.status(device.status) },
                  { key: 'Last Seen', value: formatters.date(device.lastSeen) },
                  ...(device.metrics
                    ? [
                        {
                          key: '24h Revenue',
                          value: formatters.currency(device.metrics.grossRevenue24h),
                        },
                        {
                          key: '7d Revenue',
                          value: formatters.currency(device.metrics.grossRevenue7d),
                        },
                        {
                          key: 'Utilization',
                          value: formatters.percentage(device.metrics.utilization),
                        },
                        { key: 'Uptime', value: formatters.percentage(device.metrics.uptime) },
                      ]
                    : []),
                ],
                { title: 'Device Details' },
              ),
          );
        } catch (error) {
          spinner.fail('Failed to fetch device');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error fetching device:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}

function createUpdateCommand(): Command {
  return new Command('update')
    .description('Update a device')
    .argument('<id>', 'Device ID')
    .option('-n, --name <name>', 'New device name')
    .option('-t, --type <type>', 'New device type')
    .option('-s, --status <status>', 'New device status (online, offline, maintenance)')
    .option('--interactive', 'Use interactive mode', false)
    .action(async (id, options) => {
      try {
        // First, get the current device details
        const spinner = ora('Fetching device details...').start();
        let currentDevice: Device;

        try {
          currentDevice = await api.getDevice(id);
          spinner.succeed('Device details loaded');
        } catch (error) {
          spinner.fail('Failed to fetch device');
          throw error;
        }

        let updateData: Partial<Device> = {};

        if (options.interactive) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'name',
              message: 'Device name:',
              default: options.name || currentDevice.name,
            },
            {
              type: 'list',
              name: 'type',
              message: 'Device type:',
              choices: [
                'IoT Node',
                'Storage Node',
                'Compute Node',
                'Network Node',
                'Validator Node',
                'Mining Rig',
                'Other',
              ],
              default: options.type || currentDevice.type,
            },
            {
              type: 'list',
              name: 'status',
              message: 'Device status:',
              choices: ['online', 'offline', 'maintenance'],
              default: options.status || currentDevice.status,
            },
          ]);

          updateData = answers;
        } else {
          if (options.name) {
            updateData.name = options.name;
          }
          if (options.type) {
            updateData.type = options.type;
          }
          if (options.status) {
            updateData.status = options.status as 'online' | 'offline' | 'maintenance';
          }

          if (Object.keys(updateData).length === 0) {
            console.log(chalk.yellow('No updates provided. Use --interactive for guided update.'));
            return;
          }
        }

        const updateSpinner = ora('Updating device...').start();

        try {
          const updatedDevice = await api.updateDevice(id, updateData);
          updateSpinner.succeed(chalk.green('Device updated successfully!'));

          console.log(
            '\n' +
              createTable(
                [
                  { title: 'ID', key: 'id' },
                  { title: 'Name', key: 'name' },
                  { title: 'Type', key: 'type' },
                  { title: 'Owner', key: 'ownerId' },
                  { title: 'Status', key: 'status', color: formatters.status },
                  { title: 'Last Seen', key: 'lastSeen', color: formatters.date },
                ],
                [updatedDevice],
                { title: 'Updated Device Details' },
              ),
          );
        } catch (error) {
          updateSpinner.fail('Failed to update device');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error updating device:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}

function createRemoveCommand(): Command {
  return new Command('remove')
    .alias('rm')
    .description('Remove a device')
    .argument('<id>', 'Device ID')
    .option('--force', 'Skip confirmation prompt', false)
    .action(async (id, options) => {
      try {
        // First, get the device details for confirmation
        const spinner = ora('Fetching device details...').start();
        let device: Device;

        try {
          device = await api.getDevice(id);
          spinner.succeed('Device details loaded');
        } catch (error) {
          spinner.fail('Failed to fetch device');
          throw error;
        }

        if (!options.force) {
          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Are you sure you want to remove device "${device.name}" (${device.type})?`,
              default: false,
            },
          ]);

          if (!confirm) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
          }
        }

        const deleteSpinner = ora('Removing device...').start();

        try {
          await api.deleteDevice(id);
          deleteSpinner.succeed(chalk.green(`Device "${device.name}" removed successfully!`));
        } catch (error) {
          deleteSpinner.fail('Failed to remove device');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error removing device:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}

export { devicesCommand };
