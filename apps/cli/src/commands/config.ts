import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import Conf from 'conf';

const config = new Conf({
  projectName: 'depinautopilot',
  schema: {
    apiUrl: {
      type: 'string',
      default: 'http://localhost:3001',
    },
    defaultTimeframe: {
      type: 'string',
      default: '24h',
    },
    theme: {
      type: 'string',
      default: 'auto',
    },
    notifications: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', default: true },
        level: { type: 'string', default: 'medium' },
      },
    },
  },
});

export const configCommand = new Command('config')
  .description('Manage CLI configuration')
  .addCommand(
    new Command('list')
      .alias('ls')
      .description('List all configuration settings')
      .option('--json', 'Output as JSON')
      .action((options) => {
        const settings = config.store;

        if (options.json) {
          console.log(JSON.stringify(settings, null, 2));
          return;
        }

        console.log(chalk.cyan('\n⚙️  Configuration Settings'));
        console.log(chalk.gray('─'.repeat(30)));

        Object.entries(settings).forEach(([key, value]) => {
          console.log(`${chalk.yellow(key)}: ${JSON.stringify(value)}`);
        });
      }),
  )
  .addCommand(
    new Command('get')
      .description('Get a configuration value')
      .argument('<key>', 'Configuration key')
      .action((key) => {
        const value = config.get(key);
        if (value === undefined) {
          console.log(chalk.red(`Configuration key '${key}' not found`));
          return;
        }
        console.log(JSON.stringify(value));
      }),
  )
  .addCommand(
    new Command('set')
      .description('Set a configuration value')
      .argument('<key>', 'Configuration key')
      .argument('<value>', 'Configuration value')
      .action((key, value) => {
        try {
          // Try to parse as JSON first, fallback to string
          let parsedValue;
          try {
            parsedValue = JSON.parse(value);
          } catch {
            parsedValue = value;
          }

          config.set(key, parsedValue);
          console.log(chalk.green(`✅ Set ${key} = ${JSON.stringify(parsedValue)}`));
        } catch (error) {
          console.error(
            chalk.red(
              `Failed to set configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
            ),
          );
        }
      }),
  )
  .addCommand(
    new Command('setup').description('Interactive configuration setup').action(async () => {
      console.log(chalk.cyan('🔧 DePIN Autopilot Configuration Setup'));
      console.log(chalk.gray('Configure your CLI preferences:\n'));

      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'apiUrl',
          message: 'API Server URL:',
          default: config.get('apiUrl'),
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
          name: 'defaultTimeframe',
          message: 'Default metrics timeframe:',
          choices: ['1h', '24h', '7d', '30d'],
          default: config.get('defaultTimeframe'),
        },
        {
          type: 'list',
          name: 'theme',
          message: 'Color theme:',
          choices: ['auto', 'light', 'dark'],
          default: config.get('theme'),
        },
        {
          type: 'confirm',
          name: 'notificationsEnabled',
          message: 'Enable notifications:',
          default: config.get('notifications.enabled'),
        },
      ]);

      if (answers.notificationsEnabled) {
        const notificationLevel = await inquirer.prompt([
          {
            type: 'list',
            name: 'level',
            message: 'Notification level:',
            choices: ['low', 'medium', 'high', 'critical'],
            default: config.get('notifications.level'),
          },
        ]);
        answers.notificationsLevel = notificationLevel.level;
      }

      // Save configuration
      config.set('apiUrl', answers.apiUrl);
      config.set('defaultTimeframe', answers.defaultTimeframe);
      config.set('theme', answers.theme);
      config.set('notifications.enabled', answers.notificationsEnabled);
      if (answers.notificationsLevel) {
        config.set('notifications.level', answers.notificationsLevel);
      }

      console.log(chalk.green('\n✅ Configuration saved successfully!'));
      console.log(chalk.gray(`Config file: ${config.path}`));
    }),
  )
  .addCommand(
    new Command('reset')
      .description('Reset configuration to defaults')
      .option('-f, --force', 'Skip confirmation')
      .action(async (options) => {
        if (!options.force) {
          const { confirmed } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirmed',
              message: 'Are you sure you want to reset all configuration to defaults?',
              default: false,
            },
          ]);

          if (!confirmed) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
          }
        }

        config.clear();
        console.log(chalk.green('✅ Configuration reset to defaults'));
      }),
  )
  .addCommand(
    new Command('path').description('Show configuration file path').action(() => {
      console.log(config.path);
    }),
  );

export { config };
