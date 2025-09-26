#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Import commands
import { ownersCommand } from './commands/owners.js';
import { devicesCommand } from './commands/devices.js';
import { pullCommand } from './commands/pull.js';
import { planCommand } from './commands/plan.js';
import { repriceCommand } from './commands/reprice.js';
import { statementCommand } from './commands/statement.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Read package.json for version
const packagePath = join(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
// Check for updates
const notifier = updateNotifier({
  pkg: packageJson,
  updateCheckInterval: 1000 * 60 * 60 * 24, // 24 hours
});
notifier.notify();
const program = new Command();
// ASCII art banner
console.log(
  chalk.cyan(
    figlet.textSync('DePIN Autopilot', {
      font: 'Standard',
      horizontalLayout: 'default',
      verticalLayout: 'default',
    }),
  ),
);
console.log(chalk.gray('🚀 DePIN Node Management & Monitoring CLI\n'));
program
  .name('depinautopilot')
  .description('DePIN Autopilot CLI')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--api-url <url>', 'API server URL', 'http://localhost:3001')
  .hook('preAction', (thisCommand, actionCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      console.log(chalk.gray(`[DEBUG] Running command: ${actionCommand.name()}`));
      console.log(chalk.gray(`[DEBUG] API URL: ${opts.apiUrl}`));
    }
  });
// Register commands
program.addCommand(ownersCommand);
program.addCommand(devicesCommand);
program.addCommand(pullCommand);
program.addCommand(planCommand);
program.addCommand(repriceCommand);
program.addCommand(statementCommand);
// Global error handler
process.on('uncaughtException', (error) => {
  console.error(chalk.red('💥 Uncaught Exception:'), error.message);
  if (program.opts().verbose) {
    console.error(error.stack);
  }
  process.exit(1);
});
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red('💥 Unhandled Rejection:'), reason);
  process.exit(1);
});
// Parse command line arguments
program.parse();
// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
