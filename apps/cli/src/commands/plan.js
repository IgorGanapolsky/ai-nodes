import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { api } from '../utils/api.js';
import { createTable, createKeyValueTable, formatters } from '../utils/table.js';
export const planCommand = new Command('plan')
  .description('Calculate required utilization and capacity planning')
  .addCommand(createUtilizationCommand())
  .addCommand(createCapacityCommand())
  .addCommand(createScenarioCommand());
function createUtilizationCommand() {
  return new Command('utilization')
    .description('Calculate required devices for target utilization')
    .option('-t, --target <percentage>', 'Target utilization percentage')
    .option('-r, --revenue <amount>', 'Target daily revenue')
    .option('--interactive', 'Use interactive mode', false)
    .action(async (options) => {
      try {
        let targetUtilization;
        let targetRevenue;
        if (options.interactive || (!options.target && !options.revenue)) {
          const answers = await inquirer.prompt([
            {
              type: 'number',
              name: 'target',
              message: 'Target utilization percentage (1-100):',
              default: options.target ? parseFloat(options.target) : 80,
              validate: (input) => {
                const num = parseFloat(input);
                return num >= 1 && num <= 100
                  ? true
                  : 'Please enter a percentage between 1 and 100';
              },
            },
            {
              type: 'number',
              name: 'revenue',
              message: 'Target daily revenue (optional):',
              default: options.revenue ? parseFloat(options.revenue) : undefined,
            },
          ]);
          targetUtilization = answers.target;
          targetRevenue = answers.revenue;
        } else {
          if (options.target) {
            targetUtilization = parseFloat(options.target);
            if (targetUtilization < 1 || targetUtilization > 100) {
              console.error(chalk.red('Error: Target utilization must be between 1 and 100'));
              process.exit(1);
            }
          } else {
            console.error(chalk.red('Error: Either --target or --interactive is required'));
            process.exit(1);
          }
          if (options.revenue) {
            targetRevenue = parseFloat(options.revenue);
            if (targetRevenue <= 0) {
              console.error(chalk.red('Error: Target revenue must be positive'));
              process.exit(1);
            }
          }
        }
        const spinner = ora('Calculating utilization plan...').start();
        try {
          const plan = await api.getUtilizationPlan(targetUtilization);
          spinner.succeed('Utilization plan calculated');
          // Display current state
          console.log(
            '\n' +
              createKeyValueTable({
                'Current Utilization': formatters.percentage(plan.currentUtilization),
                'Target Utilization': formatters.percentage(plan.targetUtilization),
                'Required Additional Devices': plan.requiredDevices.toString(),
                'Estimated Revenue Impact': formatters.currency(plan.estimatedRevenue),
              }),
          );
          // Display recommendations
          if (plan.recommendations.length > 0) {
            console.log('\n' + chalk.bold.cyan('📋 Recommendations:'));
            plan.recommendations.forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`);
            });
          }
          // Additional analysis
          const currentDevices = await api.getDevices();
          const onlineDevices = currentDevices.filter((d) => d.status === 'online');
          if (targetRevenue) {
            const currentRevenue = currentDevices.reduce(
              (sum, device) => sum + (device.metrics?.grossRevenue24h || 0),
              0,
            );
            const revenueGap = targetRevenue - currentRevenue;
            const revenuePerDevice = currentRevenue / Math.max(onlineDevices.length, 1);
            console.log('\n' + chalk.bold.yellow('💰 Revenue Analysis:'));
            console.log(
              createKeyValueTable({
                'Current Daily Revenue': formatters.currency(currentRevenue),
                'Target Daily Revenue': formatters.currency(targetRevenue),
                'Revenue Gap': formatters.currency(revenueGap),
                'Avg Revenue per Device': formatters.currency(revenuePerDevice),
                'Devices Needed (Revenue)': Math.ceil(
                  revenueGap / Math.max(revenuePerDevice, 1),
                ).toString(),
              }),
            );
          }
          // Device type breakdown
          const deviceTypes = currentDevices.reduce((acc, device) => {
            acc[device.type] = (acc[device.type] || 0) + 1;
            return acc;
          }, {});
          if (Object.keys(deviceTypes).length > 0) {
            console.log(
              '\n' +
                createTable(
                  [
                    { title: 'Device Type', key: 'type' },
                    { title: 'Count', key: 'count' },
                    { title: 'Percentage', key: 'percentage', color: formatters.percentage },
                  ],
                  Object.entries(deviceTypes).map(([type, count]) => ({
                    type,
                    count: count.toString(),
                    percentage: ((count / currentDevices.length) * 100).toFixed(1),
                  })),
                  { title: 'Device Distribution' },
                ),
            );
          }
        } catch (error) {
          spinner.fail('Failed to calculate utilization plan');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error calculating plan:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}
function createCapacityCommand() {
  return new Command('capacity')
    .description('Analyze current capacity and predict growth needs')
    .option('-d, --days <number>', 'Forecast period in days', '30')
    .option('-g, --growth <percentage>', 'Expected growth rate percentage per month', '10')
    .action(async (options) => {
      try {
        const forecastDays = parseInt(options.days);
        const growthRate = parseFloat(options.growth);
        if (isNaN(forecastDays) || forecastDays <= 0) {
          console.error(chalk.red('Error: Forecast days must be a positive number'));
          process.exit(1);
        }
        if (isNaN(growthRate) || growthRate < 0) {
          console.error(chalk.red('Error: Growth rate must be a non-negative number'));
          process.exit(1);
        }
        const spinner = ora('Analyzing current capacity...').start();
        try {
          const devices = await api.getDevices();
          const summary = await api.pullMetrics();
          spinner.succeed('Capacity analysis complete');
          // Current capacity metrics
          const currentCapacity = {
            totalDevices: devices.length,
            onlineDevices: devices.filter((d) => d.status === 'online').length,
            avgUtilization: summary.averageUtilization,
            dailyRevenue: summary.totalRevenue24h,
            weeklyRevenue: summary.totalRevenue7d,
          };
          // Growth projections
          const monthlyGrowthMultiplier = 1 + growthRate / 100;
          const dailyGrowthMultiplier = Math.pow(monthlyGrowthMultiplier, 1 / 30);
          const forecastMultiplier = Math.pow(dailyGrowthMultiplier, forecastDays);
          const projectedDemand = currentCapacity.avgUtilization * forecastMultiplier;
          const capacityGap = Math.max(0, projectedDemand - 100); // Utilization over 100% indicates need for more capacity
          const recommendedDevices =
            Math.ceil((currentCapacity.totalDevices * projectedDemand) / 100) -
            currentCapacity.totalDevices;
          console.log(
            '\n' +
              createKeyValueTable({
                'Current Total Devices': currentCapacity.totalDevices.toString(),
                'Current Online Devices': currentCapacity.onlineDevices.toString(),
                'Current Avg Utilization': formatters.percentage(currentCapacity.avgUtilization),
                'Current Daily Revenue': formatters.currency(currentCapacity.dailyRevenue),
              }),
          );
          console.log('\n' + chalk.bold.cyan(`📈 ${forecastDays}-Day Forecast:`));
          console.log(
            createKeyValueTable({
              'Growth Rate (Monthly)': formatters.percentage(growthRate),
              'Projected Demand': formatters.percentage(projectedDemand),
              'Capacity Gap':
                capacityGap > 0 ? formatters.percentage(capacityGap) : chalk.green('None'),
              'Recommended Additional Devices':
                recommendedDevices > 0 ? recommendedDevices.toString() : chalk.green('0'),
              'Projected Revenue': formatters.currency(
                currentCapacity.dailyRevenue * forecastMultiplier,
              ),
            }),
          );
          // Capacity planning recommendations
          const recommendations = [];
          if (capacityGap > 0) {
            recommendations.push('Network will be over-utilized - add devices before demand peak');
            recommendations.push(
              `Consider adding ${recommendedDevices} devices over the next ${forecastDays} days`,
            );
          } else if (projectedDemand < 50) {
            recommendations.push(
              'Low projected utilization - focus on demand generation over capacity expansion',
            );
          } else if (projectedDemand > 80) {
            recommendations.push(
              'High projected utilization - monitor closely and prepare for capacity expansion',
            );
          }
          if (currentCapacity.onlineDevices / currentCapacity.totalDevices < 0.9) {
            recommendations.push(
              'Significant offline capacity - focus on bringing existing devices online first',
            );
          }
          // Device lifecycle analysis
          const deviceUptime = devices.map((d) => {
            const lastSeen = new Date(d.lastSeen);
            const hoursSinceLastSeen = (Date.now() - lastSeen.getTime()) / (1000 * 60 * 60);
            return { ...d, hoursSinceLastSeen };
          });
          const staleDevices = deviceUptime.filter((d) => d.hoursSinceLastSeen > 24);
          if (staleDevices.length > 0) {
            recommendations.push(
              `${staleDevices.length} devices haven't been seen in >24h - investigate maintenance needs`,
            );
          }
          if (recommendations.length > 0) {
            console.log('\n' + chalk.bold.blue('💡 Capacity Recommendations:'));
            recommendations.forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`);
            });
          }
          // Show timeline for scale-up
          if (recommendedDevices > 0) {
            const weeklyAdditions = Math.ceil(recommendedDevices / (forecastDays / 7));
            console.log('\n' + chalk.bold.yellow('📅 Scaling Timeline:'));
            console.log(
              createKeyValueTable({
                'Total Devices to Add': recommendedDevices.toString(),
                'Recommended Weekly Additions': weeklyAdditions.toString(),
                'Timeline to Full Capacity': `${forecastDays} days`,
                'Estimated Cost Impact': 'Calculate based on device provisioning costs',
              }),
            );
          }
        } catch (error) {
          spinner.fail('Failed to analyze capacity');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error analyzing capacity:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}
function createScenarioCommand() {
  return new Command('scenario')
    .description('Run what-if scenarios for different configurations')
    .option('--devices <number>', 'Number of devices to simulate')
    .option('--utilization <percentage>', 'Target utilization for simulation')
    .option('--price <amount>', 'Average price per device per day')
    .action(async (options) => {
      try {
        let scenarioParams = {};
        if (!options.devices && !options.utilization && !options.price) {
          const answers = await inquirer.prompt([
            {
              type: 'number',
              name: 'devices',
              message: 'Number of devices to simulate:',
              validate: (input) => (input > 0 ? true : 'Must be greater than 0'),
            },
            {
              type: 'number',
              name: 'utilization',
              message: 'Target utilization percentage:',
              default: 75,
              validate: (input) =>
                input >= 0 && input <= 100 ? true : 'Must be between 0 and 100',
            },
            {
              type: 'number',
              name: 'pricePerDevice',
              message: 'Average revenue per device per day:',
              default: 5.0,
              validate: (input) => (input >= 0 ? true : 'Must be non-negative'),
            },
          ]);
          scenarioParams = answers;
        } else {
          if (options.devices) {scenarioParams.devices = parseInt(options.devices);}
          if (options.utilization) {scenarioParams.utilization = parseFloat(options.utilization);}
          if (options.price) {scenarioParams.pricePerDevice = parseFloat(options.price);}
        }
        const spinner = ora('Running scenario simulation...').start();
        try {
          // Get current state for comparison
          const currentDevices = await api.getDevices();
          const currentSummary = await api.pullMetrics();
          spinner.succeed('Scenario simulation complete');
          // Calculate scenario metrics
          const simulatedDevices = scenarioParams.devices || currentDevices.length;
          const simulatedUtilization =
            scenarioParams.utilization || currentSummary.averageUtilization;
          const simulatedPrice =
            scenarioParams.pricePerDevice ||
            currentSummary.totalRevenue24h / Math.max(currentDevices.length, 1);
          const simulatedDailyRevenue =
            simulatedDevices * simulatedPrice * (simulatedUtilization / 100);
          const simulatedWeeklyRevenue = simulatedDailyRevenue * 7;
          const simulatedMonthlyRevenue = simulatedDailyRevenue * 30;
          // Display scenario results
          console.log('\n' + chalk.bold.cyan('🎯 Scenario Parameters:'));
          console.log(
            createKeyValueTable({
              Devices: simulatedDevices.toString(),
              'Target Utilization': formatters.percentage(simulatedUtilization),
              'Revenue per Device/Day': formatters.currency(simulatedPrice),
            }),
          );
          console.log('\n' + chalk.bold.green('📊 Projected Results:'));
          console.log(
            createKeyValueTable({
              'Daily Revenue': formatters.currency(simulatedDailyRevenue),
              'Weekly Revenue': formatters.currency(simulatedWeeklyRevenue),
              'Monthly Revenue': formatters.currency(simulatedMonthlyRevenue),
              'Annual Revenue': formatters.currency(simulatedMonthlyRevenue * 12),
            }),
          );
          // Compare with current state
          console.log('\n' + chalk.bold.yellow('📈 Comparison with Current:'));
          const currentDailyRevenue = currentSummary.totalRevenue24h;
          const revenueDifference = simulatedDailyRevenue - currentDailyRevenue;
          const revenueChangePercent =
            currentDailyRevenue > 0 ? (revenueDifference / currentDailyRevenue) * 100 : 0;
          console.log(
            createKeyValueTable({
              'Current Daily Revenue': formatters.currency(currentDailyRevenue),
              'Scenario Daily Revenue': formatters.currency(simulatedDailyRevenue),
              'Revenue Difference':
                revenueDifference >= 0
                  ? chalk.green(`+${formatters.currency(revenueDifference)}`)
                  : chalk.red(`${formatters.currency(revenueDifference)}`),
              'Change Percentage':
                revenueChangePercent >= 0
                  ? chalk.green(`+${revenueChangePercent.toFixed(1)}%`)
                  : chalk.red(`${revenueChangePercent.toFixed(1)}%`),
              'Device Difference': (simulatedDevices - currentDevices.length).toString(),
              'Utilization Difference': `${(simulatedUtilization - currentSummary.averageUtilization).toFixed(1)}%`,
            }),
          );
          // Break-even analysis
          const deviceCostEstimate = 100; // Estimated daily operational cost per device
          const operationalCost = simulatedDevices * deviceCostEstimate;
          const netProfit = simulatedDailyRevenue - operationalCost;
          const profitMargin =
            simulatedDailyRevenue > 0 ? (netProfit / simulatedDailyRevenue) * 100 : 0;
          console.log('\n' + chalk.bold.blue('💰 Financial Analysis:'));
          console.log(
            createKeyValueTable({
              'Estimated Daily Operational Cost': formatters.currency(operationalCost),
              'Net Daily Profit':
                netProfit >= 0
                  ? chalk.green(formatters.currency(netProfit))
                  : chalk.red(formatters.currency(netProfit)),
              'Profit Margin':
                profitMargin >= 0
                  ? chalk.green(`${profitMargin.toFixed(1)}%`)
                  : chalk.red(`${profitMargin.toFixed(1)}%`),
            }),
          );
          // Scenario recommendations
          const recommendations = [];
          if (netProfit < 0) {
            recommendations.push(
              'Scenario shows negative profitability - consider reducing costs or increasing prices',
            );
          } else if (profitMargin < 20) {
            recommendations.push('Low profit margin - optimize operational efficiency or pricing');
          }
          if (simulatedUtilization < 50) {
            recommendations.push('Low utilization scenario - focus on demand generation');
          } else if (simulatedUtilization > 90) {
            recommendations.push(
              'High utilization scenario - ensure infrastructure can handle the load',
            );
          }
          if (simulatedDevices > currentDevices.length * 2) {
            recommendations.push('Significant device scaling required - plan gradual rollout');
          }
          if (recommendations.length > 0) {
            console.log('\n' + chalk.bold.cyan('💡 Scenario Insights:'));
            recommendations.forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`);
            });
          }
        } catch (error) {
          spinner.fail('Failed to run scenario');
          throw error;
        }
      } catch (error) {
        console.error(
          chalk.red('Error running scenario:'),
          error instanceof Error ? error.message : error,
        );
        process.exit(1);
      }
    });
}
