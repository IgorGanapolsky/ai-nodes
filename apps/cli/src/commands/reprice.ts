import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { api, PricingSuggestion } from '../utils/api.js';
import { createTable, formatters } from '../utils/table.js';

export const repriceCommand = new Command('reprice')
  .description('Suggest and apply pricing changes')
  .addCommand(createSuggestCommand())
  .addCommand(createApplyCommand())
  .addCommand(createAnalyzeCommand());

function createSuggestCommand(): Command {
  return new Command('suggest')
    .description('Get pricing suggestions based on current metrics')
    .option('-d, --device <id>', 'Analyze specific device')
    .option('-t, --threshold <percentage>', 'Utilization threshold for repricing', '70')
    .option('-f, --format <format>', 'Output format (table, json)', 'table')
    .action(async (options) => {
      try {
        const threshold = parseFloat(options.threshold);

        if (isNaN(threshold) || threshold < 0 || threshold > 100) {
          console.error(chalk.red('Error: Threshold must be between 0 and 100'));
          process.exit(1);
        }

        const spinner = ora('Analyzing current pricing and generating suggestions...').start();

        try {
          const suggestions = await api.getPricingSuggestions();

          // Filter by device if specified
          const filteredSuggestions = options.device
            ? suggestions.filter((s) => s.deviceId === options.device)
            : suggestions;

          spinner.succeed(`Generated ${filteredSuggestions.length} pricing suggestion(s)`);

          if (filteredSuggestions.length === 0) {
            console.log(chalk.yellow('No pricing suggestions available at this time.'));
            return;
          }

          if (options.format === 'json') {
            console.log(JSON.stringify(filteredSuggestions, null, 2));
            return;
          }

          // Display suggestions in a table
          console.log(
            '\n' +
              createTable(
                [
                  { title: 'Device ID', key: 'deviceIdShort' },
                  { title: 'Current Price', key: 'currentPrice', color: formatters.currency },
                  { title: 'Suggested Price', key: 'suggestedPrice', color: formatters.currency },
                  {
                    title: 'Change',
                    key: 'priceChange',
                    color: (value: string) => {
                      const num = parseFloat(value.replace(/[^-\d.]/g, ''));
                      return num > 0 ? chalk.green(value) : chalk.red(value);
                    },
                  },
                  { title: 'Reason', key: 'reason' },
                ],
                filteredSuggestions.map((suggestion) => ({
                  ...suggestion,
                  deviceIdShort: suggestion.deviceId.substring(0, 8) + '...',
                  priceChange: `${suggestion.suggestedPrice > suggestion.currentPrice ? '+' : ''}${formatters.currency(suggestion.suggestedPrice - suggestion.currentPrice)}`,
                })),
                { title: 'Pricing Suggestions' },
              ),
          );

          // Show expected impact summary
          console.log('\n' + chalk.bold.cyan('📊 Impact Summary:'));
          filteredSuggestions.forEach((suggestion, index) => {
            console.log(
              `${index + 1}. Device ${suggestion.deviceId.substring(0, 8)}: ${suggestion.expectedImpact}`,
            );
          });

          // Show statistics
          const increaseCount = filteredSuggestions.filter(
            (s) => s.suggestedPrice > s.currentPrice,
          ).length;
          const decreaseCount = filteredSuggestions.filter(
            (s) => s.suggestedPrice < s.currentPrice,
          ).length;
          const totalPotentialIncrease = filteredSuggestions.reduce(
            (sum, s) => sum + Math.max(0, s.suggestedPrice - s.currentPrice),
            0,
          );
          const totalPotentialDecrease = filteredSuggestions.reduce(
            (sum, s) => sum + Math.min(0, s.suggestedPrice - s.currentPrice),
            0,
          );

          console.log('\n' + chalk.bold.yellow('📈 Pricing Analysis:'));
          console.log(`• Price increases suggested: ${chalk.green(increaseCount)} devices`);
          console.log(`• Price decreases suggested: ${chalk.red(decreaseCount)} devices`);
          console.log(
            `• Total potential daily revenue increase: ${chalk.green(formatters.currency(totalPotentialIncrease))}`,
          );
          if (totalPotentialDecrease < 0) {
            console.log(
              `• Total potential daily revenue decrease: ${chalk.red(formatters.currency(Math.abs(totalPotentialDecrease)))}`,
            );
          }
          console.log(
            `• Net daily revenue impact: ${formatters.currency(totalPotentialIncrease + totalPotentialDecrease)}`,
          );
        } catch (error) {
          spinner.fail('Failed to generate pricing suggestions');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error generating suggestions:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}

function createApplyCommand(): Command {
  return new Command('apply')
    .description('Apply pricing changes')
    .option('-d, --device <id>', 'Apply to specific device')
    .option('--all', 'Apply all suggestions', false)
    .option('--dry-run', 'Show what would be changed without applying', false)
    .option('--force', 'Skip confirmation prompts', false)
    .action(async (options) => {
      try {
        const spinner = ora('Fetching current pricing suggestions...').start();

        let suggestions: PricingSuggestion[];
        try {
          suggestions = await api.getPricingSuggestions();

          // Filter by device if specified
          if (options.device) {
            suggestions = suggestions.filter((s) => s.deviceId === options.device);
          }

          spinner.succeed(`Found ${suggestions.length} pricing suggestion(s)`);
        } catch (error) {
          spinner.fail('Failed to fetch pricing suggestions');
          throw error;
        }

        if (suggestions.length === 0) {
          console.log(chalk.yellow('No pricing suggestions available to apply.'));
          return;
        }

        let selectedSuggestions: PricingSuggestion[] = [];

        if (options.all) {
          selectedSuggestions = suggestions;
        } else if (options.device && suggestions.length === 1) {
          selectedSuggestions = suggestions;
        } else {
          // Interactive selection
          const choices = suggestions.map((s) => ({
            name: `${s.deviceId.substring(0, 8)}... (${formatters.currency(s.currentPrice)} → ${formatters.currency(s.suggestedPrice)}) - ${s.reason}`,
            value: s,
            checked: false,
          }));

          const { selected } = await inquirer.prompt([
            {
              type: 'checkbox',
              name: 'selected',
              message: 'Select pricing changes to apply:',
              choices,
              validate: (answer) => {
                if (answer.length === 0) {
                  return 'Please select at least one pricing change.';
                }
                return true;
              },
            },
          ]);

          selectedSuggestions = selected;
        }

        // Show what will be changed
        console.log(
          '\n' +
            createTable(
              [
                { title: 'Device ID', key: 'deviceIdShort' },
                { title: 'Current', key: 'currentPrice', color: formatters.currency },
                { title: 'New Price', key: 'suggestedPrice', color: formatters.currency },
                {
                  title: 'Change',
                  key: 'change',
                  color: (value: string) => {
                    const num = parseFloat(value.replace(/[^-\d.]/g, ''));
                    return num > 0 ? chalk.green(value) : chalk.red(value);
                  },
                },
                { title: 'Reason', key: 'reason' },
              ],
              selectedSuggestions.map((s) => ({
                ...s,
                deviceIdShort: s.deviceId.substring(0, 8) + '...',
                change:
                  (s.suggestedPrice > s.currentPrice ? '+' : '') +
                  (s.suggestedPrice - s.currentPrice).toFixed(2),
              })),
              { title: options.dryRun ? 'Pricing Changes (DRY RUN)' : 'Pricing Changes to Apply' },
            ),
        );

        if (options.dryRun) {
          console.log(chalk.yellow('\n🔍 DRY RUN: No changes were applied.'));
          return;
        }

        // Confirmation
        if (!options.force) {
          const totalRevenueDelta = selectedSuggestions.reduce(
            (sum, s) => sum + (s.suggestedPrice - s.currentPrice),
            0,
          );

          const { confirm } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'confirm',
              message: `Apply ${selectedSuggestions.length} pricing changes? (Net daily revenue impact: ${formatters.currency(totalRevenueDelta)})`,
              default: false,
            },
          ]);

          if (!confirm) {
            console.log(chalk.yellow('Operation cancelled.'));
            return;
          }
        }

        // Apply the changes
        const applySpinner = ora('Applying pricing changes...').start();

        try {
          const changes = selectedSuggestions.map((s) => ({
            deviceId: s.deviceId,
            newPrice: s.suggestedPrice,
          }));

          await api.applyPricingChanges(changes);
          applySpinner.succeed(
            chalk.green(`Successfully applied ${changes.length} pricing change(s)!`),
          );

          // Show summary
          const totalIncrease = selectedSuggestions.reduce(
            (sum, s) => sum + Math.max(0, s.suggestedPrice - s.currentPrice),
            0,
          );
          const totalDecrease = selectedSuggestions.reduce(
            (sum, s) => sum + Math.min(0, s.suggestedPrice - s.currentPrice),
            0,
          );

          console.log('\n' + chalk.bold.green('✅ Pricing Changes Applied:'));
          console.log(`• ${selectedSuggestions.length} devices repriced`);
          console.log(
            `• Daily revenue impact: ${formatters.currency(totalIncrease + totalDecrease)}`,
          );
          console.log(`• Changes will take effect immediately`);
        } catch (error) {
          applySpinner.fail('Failed to apply pricing changes');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error applying pricing changes:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}

function createAnalyzeCommand(): Command {
  return new Command('analyze')
    .description('Analyze pricing performance and trends')
    .option('-d, --days <number>', 'Number of days to analyze', '7')
    .option('--device <id>', 'Analyze specific device')
    .action(async (options) => {
      try {
        const days = parseInt(options.days);

        if (isNaN(days) || days <= 0) {
          console.error(chalk.red('Error: Days must be a positive number'));
          process.exit(1);
        }

        const spinner = ora(`Analyzing pricing performance over ${days} days...`).start();

        try {
          const devices = await api.getDevices(options.device ? undefined : undefined);
          const filteredDevices = options.device
            ? devices.filter((d) => d.id === options.device)
            : devices;

          if (filteredDevices.length === 0) {
            spinner.fail('No devices found');
            return;
          }

          spinner.succeed('Pricing analysis complete');

          // Calculate pricing metrics
          const deviceMetrics = filteredDevices
            .map((device) => {
              const metrics = device.metrics;
              if (!metrics) return null;

              const revenuePerDay = metrics.grossRevenue24h;
              const weeklyRevenue = metrics.grossRevenue7d;
              const utilization = metrics.utilization;

              // Estimate pricing efficiency
              const revenuePerUtilizationPoint = revenuePerDay / Math.max(utilization, 1);

              return {
                device,
                revenuePerDay,
                weeklyRevenue,
                utilization,
                revenuePerUtilizationPoint,
                efficiency: utilization > 0 ? revenuePerDay / utilization : 0,
              };
            })
            .filter((m) => m !== null);

          if (deviceMetrics.length === 0) {
            console.log(chalk.yellow('No device metrics available for analysis.'));
            return;
          }

          // Overall performance
          const totalDailyRevenue = deviceMetrics.reduce((sum, m) => sum + m!.revenuePerDay, 0);
          const averageUtilization =
            deviceMetrics.reduce((sum, m) => sum + m!.utilization, 0) / deviceMetrics.length;
          const averageEfficiency =
            deviceMetrics.reduce((sum, m) => sum + m!.efficiency, 0) / deviceMetrics.length;

          console.log('\n' + chalk.bold.cyan('📊 Pricing Performance Overview:'));
          console.log(`• Total daily revenue: ${formatters.currency(totalDailyRevenue)}`);
          console.log(`• Average utilization: ${formatters.percentage(averageUtilization)}`);
          console.log(
            `• Average pricing efficiency: ${averageEfficiency.toFixed(2)} $/% utilization`,
          );

          // Device performance breakdown
          console.log(
            '\n' +
              createTable(
                [
                  { title: 'Device', key: 'deviceName' },
                  { title: 'Daily Revenue', key: 'revenuePerDay', color: formatters.currency },
                  { title: 'Utilization', key: 'utilization', color: formatters.percentage },
                  { title: 'Efficiency', key: 'efficiency' },
                  {
                    title: 'Performance',
                    key: 'performance',
                    color: (value: string) => {
                      if (value.includes('High')) return chalk.green(value);
                      if (value.includes('Low')) return chalk.red(value);
                      return chalk.yellow(value);
                    },
                  },
                ],
                deviceMetrics.map((m) => {
                  const efficiency = m!.efficiency;
                  let performance = 'Medium';

                  if (efficiency > averageEfficiency * 1.2) {
                    performance = 'High';
                  } else if (efficiency < averageEfficiency * 0.8) {
                    performance = 'Low';
                  }

                  return {
                    deviceName: m!.device.name,
                    revenuePerDay: m!.revenuePerDay,
                    utilization: m!.utilization,
                    efficiency: efficiency.toFixed(2),
                    performance,
                  };
                }),
                { title: 'Device Pricing Performance' },
              ),
          );

          // Pricing recommendations based on performance
          const recommendations = [];

          const lowPerformers = deviceMetrics.filter(
            (m) => m!.efficiency < averageEfficiency * 0.8,
          );
          const highPerformers = deviceMetrics.filter(
            (m) => m!.efficiency > averageEfficiency * 1.2,
          );
          const underutilized = deviceMetrics.filter((m) => m!.utilization < 50);
          const overutilized = deviceMetrics.filter((m) => m!.utilization > 90);

          if (lowPerformers.length > 0) {
            recommendations.push(
              `${lowPerformers.length} devices are underperforming - consider lowering prices to increase utilization`,
            );
          }

          if (highPerformers.length > 0) {
            recommendations.push(
              `${highPerformers.length} devices are high-performing - consider testing higher prices`,
            );
          }

          if (underutilized.length > 0) {
            recommendations.push(
              `${underutilized.length} devices have low utilization (<50%) - reduce prices or improve marketing`,
            );
          }

          if (overutilized.length > 0) {
            recommendations.push(
              `${overutilized.length} devices are highly utilized (>90%) - consider increasing prices`,
            );
          }

          // Market positioning analysis
          const revenueRange = {
            min: Math.min(...deviceMetrics.map((m) => m!.revenuePerDay)),
            max: Math.max(...deviceMetrics.map((m) => m!.revenuePerDay)),
            median: deviceMetrics.sort((a, b) => a!.revenuePerDay - b!.revenuePerDay)[
              Math.floor(deviceMetrics.length / 2)
            ]!.revenuePerDay,
          };

          console.log('\n' + chalk.bold.yellow('💰 Revenue Distribution:'));
          console.log(`• Minimum daily revenue: ${formatters.currency(revenueRange.min)}`);
          console.log(`• Median daily revenue: ${formatters.currency(revenueRange.median)}`);
          console.log(`• Maximum daily revenue: ${formatters.currency(revenueRange.max)}`);
          console.log(
            `• Revenue spread: ${formatters.currency(revenueRange.max - revenueRange.min)}`,
          );

          if (recommendations.length > 0) {
            console.log('\n' + chalk.bold.blue('💡 Pricing Recommendations:'));
            recommendations.forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`);
            });
          }

          // Optimization opportunities
          console.log('\n' + chalk.bold.green('🎯 Optimization Opportunities:'));

          const totalPotentialIncrease = overutilized.reduce((sum, m) => {
            // Estimate 10% price increase potential for overutilized devices
            return sum + m!.revenuePerDay * 0.1;
          }, 0);

          const totalPotentialFromUnderutilized = underutilized.reduce((sum, m) => {
            // Estimate revenue increase from better utilization (target 70%)
            const targetUtilization = 70;
            const currentRevenue = m!.revenuePerDay;
            const potentialRevenue = (currentRevenue / m!.utilization) * targetUtilization;
            return sum + Math.max(0, potentialRevenue - currentRevenue);
          }, 0);

          console.log(
            `• Potential revenue from price optimization: ${formatters.currency(totalPotentialIncrease)}/day`,
          );
          console.log(
            `• Potential revenue from utilization improvements: ${formatters.currency(totalPotentialFromUnderutilized)}/day`,
          );
          console.log(
            `• Total optimization potential: ${formatters.currency(totalPotentialIncrease + totalPotentialFromUnderutilized)}/day`,
          );
        } catch (error) {
          spinner.fail('Failed to analyze pricing performance');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error analyzing pricing:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}
