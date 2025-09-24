import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import { writeFileSync } from 'fs';
import { join } from 'path';
import { api, Statement, Owner } from '../utils/api.js';
import { createTable, createKeyValueTable, formatters } from '../utils/table.js';

export const statementCommand = new Command('statement')
  .description('Generate financial statements')
  .addCommand(createGenerateCommand())
  .addCommand(createListCommand())
  .addCommand(createSummaryCommand());

function createGenerateCommand(): Command {
  return new Command('generate')
    .description('Generate a statement for an owner')
    .option('-o, --owner <ownerId>', 'Owner ID')
    .option('-s, --start <date>', 'Start date (YYYY-MM-DD)')
    .option('-e, --end <date>', 'End date (YYYY-MM-DD)')
    .option('-f, --format <format>', 'Output format (table, json, csv)', 'table')
    .option('--save <filename>', 'Save statement to file')
    .option('--interactive', 'Use interactive mode', false)
    .action(async (options) => {
      try {
        let ownerId: string;
        let startDate: string;
        let endDate: string;

        if (options.interactive || (!options.owner || !options.start || !options.end)) {
          // Get list of owners
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
            console.error(chalk.red('No owners found. Please create an owner first.'));
            process.exit(1);
          }

          // Interactive prompts
          const answers = await inquirer.prompt([
            {
              type: 'list',
              name: 'ownerId',
              message: 'Select owner:',
              choices: owners.map(owner => ({
                name: `${owner.name} (${owner.email})`,
                value: owner.id
              })),
              default: options.owner
            },
            {
              type: 'input',
              name: 'startDate',
              message: 'Start date (YYYY-MM-DD):',
              default: options.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              validate: (input) => {
                const date = new Date(input);
                return !isNaN(date.getTime()) ? true : 'Please enter a valid date in YYYY-MM-DD format';
              }
            },
            {
              type: 'input',
              name: 'endDate',
              message: 'End date (YYYY-MM-DD):',
              default: options.end || new Date().toISOString().split('T')[0],
              validate: (input) => {
                const date = new Date(input);
                return !isNaN(date.getTime()) ? true : 'Please enter a valid date in YYYY-MM-DD format';
              }
            }
          ]);

          ownerId = answers.ownerId;
          startDate = answers.startDate;
          endDate = answers.endDate;
        } else {
          ownerId = options.owner;
          startDate = options.start;
          endDate = options.end;
        }

        // Validate dates
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) {
          console.error(chalk.red('Error: Invalid date format. Use YYYY-MM-DD.'));
          process.exit(1);
        }

        if (start >= end) {
          console.error(chalk.red('Error: Start date must be before end date.'));
          process.exit(1);
        }

        // Generate statement
        const spinner = ora('Generating statement...').start();

        try {
          const statement = await api.generateStatement(ownerId, startDate, endDate);
          const owner = await api.getOwner(ownerId);
          spinner.succeed('Statement generated successfully');

          // Display statement based on format
          if (options.format === 'json') {
            const output = JSON.stringify(statement, null, 2);
            console.log(output);

            if (options.save) {
              writeFileSync(options.save, output);
              console.log(chalk.green(`Statement saved to ${options.save}`));
            }
            return;
          }

          if (options.format === 'csv') {
            const csvContent = generateCSV(statement, owner);
            console.log(csvContent);

            if (options.save) {
              writeFileSync(options.save, csvContent);
              console.log(chalk.green(`Statement saved to ${options.save}`));
            }
            return;
          }

          // Table format
          displayStatement(statement, owner);

          // Save to file if requested
          if (options.save) {
            const content = options.format === 'csv'
              ? generateCSV(statement, owner)
              : JSON.stringify(statement, null, 2);

            writeFileSync(options.save, content);
            console.log(chalk.green(`\nStatement saved to ${options.save}`));
          }

        } catch (error) {
          spinner.fail('Failed to generate statement');
          throw error;
        }
      } catch (error) {
        console.error(chalk.red('Error generating statement:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

function createListCommand(): Command {
  return new Command('list')
    .description('List recent statements')
    .option('-o, --owner <ownerId>', 'Filter by owner')
    .option('-l, --limit <number>', 'Number of statements to show', '10')
    .action(async (options) => {
      try {
        const limit = parseInt(options.limit);

        if (isNaN(limit) || limit <= 0) {
          console.error(chalk.red('Error: Limit must be a positive number'));
          process.exit(1);
        }

        // For demo purposes, we'll simulate recent statements
        // In a real implementation, this would query the API for statement history
        console.log(chalk.yellow('Statement history feature not yet implemented.'));
        console.log('This would show previously generated statements with dates, owners, and status.');
      } catch (error) {
        console.error(chalk.red('Error listing statements:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

function createSummaryCommand(): Command {
  return new Command('summary')
    .description('Show financial summary across all owners')
    .option('-p, --period <days>', 'Period in days', '30')
    .action(async (options) => {
      try {
        const period = parseInt(options.period);

        if (isNaN(period) || period <= 0) {
          console.error(chalk.red('Error: Period must be a positive number'));
          process.exit(1);
        }

        const spinner = ora('Generating financial summary...').start();

        try {
          const owners = await api.getOwners();
          const devices = await api.getDevices();

          if (owners.length === 0 || devices.length === 0) {
            spinner.succeed('Summary generated');
            console.log(chalk.yellow('No data available for financial summary.'));
            return;
          }

          // Calculate summary metrics
          const totalDevices = devices.length;
          const onlineDevices = devices.filter(d => d.status === 'online').length;
          const totalDailyRevenue = devices.reduce((sum, d) => sum + (d.metrics?.grossRevenue24h || 0), 0);
          const totalWeeklyRevenue = devices.reduce((sum, d) => sum + (d.metrics?.grossRevenue7d || 0), 0);
          const projectedMonthlyRevenue = totalDailyRevenue * 30;

          // Calculate per-owner breakdown
          const ownerSummaries = owners.map(owner => {
            const ownerDevices = devices.filter(d => d.ownerId === owner.id);
            const ownerDailyRevenue = ownerDevices.reduce((sum, d) => sum + (d.metrics?.grossRevenue24h || 0), 0);
            const ownerWeeklyRevenue = ownerDevices.reduce((sum, d) => sum + (d.metrics?.grossRevenue7d || 0), 0);

            return {
              owner,
              deviceCount: ownerDevices.length,
              onlineDevices: ownerDevices.filter(d => d.status === 'online').length,
              dailyRevenue: ownerDailyRevenue,
              weeklyRevenue: ownerWeeklyRevenue,
              averageDeviceRevenue: ownerDevices.length > 0 ? ownerDailyRevenue / ownerDevices.length : 0
            };
          });

          spinner.succeed('Financial summary generated');

          // Display overall summary
          console.log('\n' + createKeyValueTable({
            'Total Owners': owners.length.toString(),
            'Total Devices': totalDevices.toString(),
            'Online Devices': `${onlineDevices} (${((onlineDevices / totalDevices) * 100).toFixed(1)}%)`,
            'Total Daily Revenue': formatters.currency(totalDailyRevenue),
            'Total Weekly Revenue': formatters.currency(totalWeeklyRevenue),
            'Projected Monthly Revenue': formatters.currency(projectedMonthlyRevenue),
            'Average Revenue per Device': formatters.currency(totalDailyRevenue / Math.max(totalDevices, 1)),
            'Network Utilization': formatters.percentage(devices.reduce((sum, d) => sum + (d.metrics?.utilization || 0), 0) / Math.max(devices.length, 1))
          }));

          // Display per-owner breakdown
          if (ownerSummaries.length > 0) {
            console.log('\n' + createTable(
              [
                { title: 'Owner', key: 'ownerName' },
                { title: 'Email', key: 'ownerEmail' },
                { title: 'Devices', key: 'deviceCount' },
                { title: 'Online', key: 'onlineDevices' },
                { title: 'Daily Revenue', key: 'dailyRevenue', color: formatters.currency },
                { title: 'Weekly Revenue', key: 'weeklyRevenue', color: formatters.currency },
                { title: 'Avg/Device', key: 'averageDeviceRevenue', color: formatters.currency }
              ],
              ownerSummaries.map(summary => ({
                ownerName: summary.owner.name,
                ownerEmail: summary.owner.email,
                deviceCount: summary.deviceCount.toString(),
                onlineDevices: summary.onlineDevices.toString(),
                dailyRevenue: summary.dailyRevenue,
                weeklyRevenue: summary.weeklyRevenue,
                averageDeviceRevenue: summary.averageDeviceRevenue
              })),
              { title: 'Owner Financial Summary' }
            ));
          }

          // Revenue distribution analysis
          const revenueDistribution = ownerSummaries.map(s => s.dailyRevenue).sort((a, b) => b - a);
          const topPerformer = ownerSummaries.find(s => s.dailyRevenue === revenueDistribution[0]);
          const median = revenueDistribution[Math.floor(revenueDistribution.length / 2)] || 0;

          console.log('\n' + chalk.bold.cyan('📊 Revenue Distribution Analysis:'));
          console.log(`• Top performing owner: ${topPerformer?.owner.name || 'N/A'} (${formatters.currency(revenueDistribution[0] || 0)}/day)`);
          console.log(`• Median owner revenue: ${formatters.currency(median)}/day`);
          console.log(`• Revenue concentration: Top owner represents ${((revenueDistribution[0] || 0) / totalDailyRevenue * 100).toFixed(1)}% of total revenue`);

          // Growth projections
          const weeklyGrowthRate = totalWeeklyRevenue > 0 ? ((totalDailyRevenue * 7) / totalWeeklyRevenue - 1) * 100 : 0;
          console.log(`• Weekly growth rate: ${weeklyGrowthRate >= 0 ? '+' : ''}${weeklyGrowthRate.toFixed(1)}%`);

          // Recommendations
          const recommendations = [];

          if (onlineDevices / totalDevices < 0.8) {
            recommendations.push('Low device online rate - focus on connectivity and maintenance');
          }

          if (totalDailyRevenue / totalDevices < 2.0) {
            recommendations.push('Low average revenue per device - consider pricing optimization');
          }

          const inactiveOwners = ownerSummaries.filter(s => s.dailyRevenue === 0);
          if (inactiveOwners.length > 0) {
            recommendations.push(`${inactiveOwners.length} owners have no revenue - provide onboarding support`);
          }

          if (recommendations.length > 0) {
            console.log('\n' + chalk.bold.blue('💡 Business Recommendations:'));
            recommendations.forEach((rec, index) => {
              console.log(`  ${index + 1}. ${rec}`);
            });
          }

        } catch (error) {
          spinner.fail('Failed to generate summary');
          throw error;
        }
      } catch (error) {
        console.error(chalk.red('Error generating summary:'), error instanceof Error ? error.message : error);
        process.exit(1);
      }
    });
}

function displayStatement(statement: Statement, owner: Owner): void {
  // Header
  console.log('\n' + chalk.bold.cyan('📄 Financial Statement'));
  console.log(chalk.gray('═'.repeat(60)));

  // Owner information
  console.log('\n' + createKeyValueTable({
    'Owner': owner.name,
    'Email': owner.email,
    'Statement Period': statement.period,
    'Generated': formatters.date(statement.generatedAt)
  }));

  // Financial summary
  console.log('\n' + createKeyValueTable({
    'Total Revenue': formatters.currency(statement.totalRevenue),
    'Total Expenses': formatters.currency(statement.totalExpenses),
    'Net Profit': statement.netProfit >= 0 ?
      chalk.green(formatters.currency(statement.netProfit)) :
      chalk.red(formatters.currency(statement.netProfit)),
    'Profit Margin': statement.totalRevenue > 0 ?
      formatters.percentage((statement.netProfit / statement.totalRevenue) * 100) :
      '0%'
  }));

  // Device breakdown
  if (statement.devices.length > 0) {
    console.log('\n' + createTable(
      [
        { title: 'Device', key: 'name' },
        { title: 'Type', key: 'type' },
        { title: 'Status', key: 'status', color: formatters.status },
        { title: 'Revenue', key: 'revenue', color: formatters.currency },
        { title: 'Utilization', key: 'utilization', color: formatters.percentage }
      ],
      statement.devices.map(device => ({
        name: device.name,
        type: device.type,
        status: device.status,
        revenue: device.metrics?.grossRevenue24h || 0,
        utilization: device.metrics?.utilization || 0
      })),
      { title: 'Device Performance' }
    ));
  }

  // Performance insights
  const totalDevices = statement.devices.length;
  const onlineDevices = statement.devices.filter(d => d.status === 'online').length;
  const averageUtilization = statement.devices.reduce((sum, d) =>
    sum + (d.metrics?.utilization || 0), 0
  ) / Math.max(totalDevices, 1);

  console.log('\n' + chalk.bold.yellow('📈 Performance Insights:'));
  console.log(`• Device uptime: ${((onlineDevices / totalDevices) * 100).toFixed(1)}%`);
  console.log(`• Average utilization: ${averageUtilization.toFixed(1)}%`);
  console.log(`• Revenue per device: ${formatters.currency(statement.totalRevenue / Math.max(totalDevices, 1))}`);

  if (statement.netProfit > 0) {
    console.log(`• ROI: Profitable operation with ${formatters.percentage((statement.netProfit / Math.max(statement.totalExpenses, 1)) * 100)} return`);
  } else {
    console.log(`• ROI: ${chalk.red('Operating at a loss')} - consider optimization strategies`);
  }
}

function generateCSV(statement: Statement, owner: Owner): string {
  const lines = [
    'Financial Statement',
    `Owner,${owner.name}`,
    `Email,${owner.email}`,
    `Period,${statement.period}`,
    `Generated,${statement.generatedAt}`,
    '',
    'Summary',
    `Total Revenue,${statement.totalRevenue}`,
    `Total Expenses,${statement.totalExpenses}`,
    `Net Profit,${statement.netProfit}`,
    '',
    'Device Details',
    'Device Name,Type,Status,Revenue,Utilization'
  ];

  statement.devices.forEach(device => {
    lines.push(
      `${device.name},${device.type},${device.status},${device.metrics?.grossRevenue24h || 0},${device.metrics?.utilization || 0}`
    );
  });

  return lines.join('\n');
}