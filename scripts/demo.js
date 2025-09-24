#!/usr/bin/env tsx
import chalk from 'chalk';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { format } from 'date-fns';
// Database imports
import { getDatabaseConnection, owners, devices, metrics } from '../packages/db/src/client';
import { seedDatabase } from '../packages/db/src/seed';
// Connector imports
import { ConnectorFactory, ConnectorNetwork } from '../packages/connectors/src/factory';
// Core imports
import { generateStatementSummary, exportStatementSummaryToCSV } from '../packages/core/src/statements';
async function main() {
    console.log(chalk.blue.bold('\n🚀 DePIN Autopilot System Demo\n'));
    console.log(chalk.gray('━'.repeat(50)));
    try {
        // Step 1: Seed database
        console.log(chalk.yellow.bold('\n📊 Step 1: Seeding Database'));
        await seedDatabaseStep();
        // Step 2: Pull metrics from connectors
        console.log(chalk.yellow.bold('\n🔌 Step 2: Pulling Metrics from Connectors'));
        const connectorMetrics = await pullConnectorMetrics();
        // Step 3: Generate summary
        console.log(chalk.yellow.bold('\n📈 Step 3: Generating Summary'));
        const summary = await generateSummary();
        // Step 4: Generate weekly statement
        console.log(chalk.yellow.bold('\n📄 Step 4: Generating Weekly Statement'));
        const statementPath = await generateWeeklyStatement();
        // Step 5: Display results
        console.log(chalk.yellow.bold('\n🎯 Step 5: System Results'));
        await displayResults(summary, connectorMetrics, statementPath);
        console.log(chalk.green.bold('\n✅ Demo completed successfully!'));
        console.log(chalk.gray('━'.repeat(50)));
    }
    catch (error) {
        console.error(chalk.red.bold('\n❌ Demo failed:'), error);
        process.exit(1);
    }
}
async function seedDatabaseStep() {
    try {
        console.log(chalk.cyan('  Initializing database and seeding with demo data...'));
        // Run the existing seed function
        await seedDatabase();
        console.log(chalk.green('  ✅ Database seeded successfully'));
        console.log(chalk.dim('     • Created demo owner'));
        console.log(chalk.dim('     • Added 2 devices (GPU + CPU)'));
        console.log(chalk.dim('     • Generated 30 days of metrics'));
        console.log(chalk.dim('     • Created monthly statements'));
    }
    catch (error) {
        console.error(chalk.red('  ❌ Failed to seed database:'), error);
        throw error;
    }
}
async function pullConnectorMetrics() {
    const results = new Map();
    try {
        console.log(chalk.cyan('  Creating mock connectors...'));
        // Create mock connectors for io.net and nosana
        const ionetConnector = ConnectorFactory.createConnector({
            network: ConnectorNetwork.IONET
        });
        const nosanaConnector = ConnectorFactory.createConnector({
            network: ConnectorNetwork.NOSANA
        });
        console.log(chalk.dim('     • Created io.net connector'));
        console.log(chalk.dim('     • Created nosana connector'));
        // Initialize connectors (this will use mock data since no API keys)
        await ionetConnector.initialize({});
        await nosanaConnector.initialize({});
        console.log(chalk.cyan('  Pulling metrics from connectors...'));
        // Get metrics from both connectors
        const ionetMetrics = await ionetConnector.getMetrics();
        const nosanaMetrics = await nosanaConnector.getMetrics();
        results.set('io.net', ionetMetrics);
        results.set('nosana', nosanaMetrics);
        console.log(chalk.green('  ✅ Metrics pulled successfully'));
        console.log(chalk.dim(`     • io.net GPU: ${ionetMetrics.earnings.daily.toFixed(2)} USD/day`));
        console.log(chalk.dim(`     • nosana CPU: ${nosanaMetrics.earnings.daily.toFixed(2)} USD/day`));
        return results;
    }
    catch (error) {
        console.error(chalk.red('  ❌ Failed to pull connector metrics:'), error);
        throw error;
    }
}
async function generateSummary() {
    try {
        console.log(chalk.cyan('  Calculating earnings and utilization...'));
        const db = getDatabaseConnection();
        // Get all devices and their recent metrics
        const deviceList = await db.select().from(devices);
        // Get metrics from the last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentMetrics = await db.select()
            .from(metrics);
        // Calculate totals
        const totalEarnings = recentMetrics.reduce((sum, metric) => {
            return sum + (metric.earningsUsd || 0);
        }, 0);
        const totalUtilization = recentMetrics.reduce((sum, metric) => {
            return sum + (metric.utilizationHours || 0);
        }, 0) / recentMetrics.length;
        const weeklyEarnings = totalEarnings;
        const stats = {
            totalEarnings,
            totalUtilization,
            totalDevices: deviceList.length,
            weeklyEarnings,
            csvPath: ''
        };
        console.log(chalk.green('  ✅ Summary generated'));
        console.log(chalk.dim(`     • Total devices: ${stats.totalDevices}`));
        console.log(chalk.dim(`     • Weekly earnings: $${stats.weeklyEarnings.toFixed(2)}`));
        console.log(chalk.dim(`     • Avg utilization: ${stats.totalUtilization.toFixed(1)}%`));
        return stats;
    }
    catch (error) {
        console.error(chalk.red('  ❌ Failed to generate summary:'), error);
        throw error;
    }
}
async function generateWeeklyStatement() {
    try {
        console.log(chalk.cyan('  Creating weekly statement...'));
        const db = getDatabaseConnection();
        // Get data for the last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const deviceList = await db.select().from(devices);
        const weeklyMetrics = await db.select()
            .from(metrics);
        // Create statement records
        const records = [];
        for (const device of deviceList) {
            const deviceMetrics = weeklyMetrics.filter(m => m.deviceId === device.id);
            if (deviceMetrics.length > 0) {
                // Aggregate metrics for the week
                const totalEarnings = deviceMetrics.reduce((sum, m) => sum + (m.earningsUsd || 0), 0);
                const totalUtilization = deviceMetrics.reduce((sum, m) => sum + (m.utilizationHours || 0), 0);
                const avgUptime = deviceMetrics.reduce((sum, m) => sum + (m.uptime || 0), 0) / deviceMetrics.length;
                const record = {
                    date: new Date(),
                    nodeId: device.id,
                    nodeName: device.label,
                    nodeType: device.marketplace,
                    utilizationHours: totalUtilization,
                    totalHours: 7 * 24, // 7 days
                    utilizationPercent: (totalUtilization / (7 * 24)) * 100,
                    pricePerHour: device.hourlyPriceUsd || 0,
                    grossRevenueUsd: totalEarnings,
                    revSharePercent: 15, // 15% platform fee
                    operatorCutUsd: totalEarnings * 0.15,
                    ownerCutUsd: totalEarnings * 0.85,
                    uptime: avgUptime,
                    region: device.region || 'Unknown',
                    notes: `Weekly statement for ${device.marketplace} device`
                };
                records.push(record);
            }
        }
        // Generate statement summary
        const summary = generateStatementSummary(records);
        // Create CSV content
        const csvContent = exportStatementSummaryToCSV(summary, {
            currency: 'USD',
            decimalPlaces: 2
        });
        // Ensure statements directory exists
        const statementsDir = join(process.cwd(), 'statements');
        mkdirSync(statementsDir, { recursive: true });
        // Write CSV file
        const filename = `weekly_statement_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        const csvPath = join(statementsDir, filename);
        writeFileSync(csvPath, csvContent);
        console.log(chalk.green('  ✅ Weekly statement generated'));
        console.log(chalk.dim(`     • Records: ${records.length} devices`));
        console.log(chalk.dim(`     • Total earnings: $${summary.totalOwnerCut.toFixed(2)}`));
        console.log(chalk.dim(`     • CSV saved: ${filename}`));
        return csvPath;
    }
    catch (error) {
        console.error(chalk.red('  ❌ Failed to generate weekly statement:'), error);
        throw error;
    }
}
async function displayResults(stats, connectorMetrics, statementPath) {
    const db = getDatabaseConnection();
    // Get owner info
    const [owner] = await db.select().from(owners).limit(1);
    const deviceList = await db.select().from(devices);
    console.log(chalk.magenta.bold('\n🎯 DEMO RESULTS SUMMARY'));
    console.log(chalk.gray('━'.repeat(50)));
    // Owner Information
    console.log(chalk.blue.bold('\n👤 Owner Information'));
    console.log(chalk.white(`Name: ${chalk.cyan(owner?.displayName || 'Demo Owner')}`));
    console.log(chalk.white(`Email: ${chalk.cyan(owner?.email || 'demo@owner.test')}`));
    console.log(chalk.white(`Revenue Share: ${chalk.cyan((owner?.revSharePct || 0.15) * 100)}%`));
    // Device Status
    console.log(chalk.blue.bold('\n🖥️  Device Status'));
    for (const device of deviceList) {
        const statusColor = device.active ? chalk.green : chalk.red;
        const status = device.active ? '🟢 ONLINE' : '🔴 OFFLINE';
        console.log(chalk.white(`${device.label}:`));
        console.log(chalk.white(`  Status: ${statusColor(status)}`));
        console.log(chalk.white(`  Marketplace: ${chalk.cyan(device.marketplace)}`));
        console.log(chalk.white(`  Region: ${chalk.cyan(device.region || 'Unknown')}`));
        console.log(chalk.white(`  Hourly Rate: ${chalk.cyan('$' + (device.hourlyPriceUsd || 0).toFixed(2))}`));
    }
    // Connector Metrics
    console.log(chalk.blue.bold('\n🔌 Live Connector Data'));
    for (const [network, metrics] of connectorMetrics) {
        console.log(chalk.white(`${network}:`));
        console.log(chalk.white(`  CPU Usage: ${chalk.cyan(metrics.resource_utilization.cpu.toFixed(1))}%`));
        console.log(chalk.white(`  Memory Usage: ${chalk.cyan(metrics.resource_utilization.memory.toFixed(1))}%`));
        if (metrics.resource_utilization.gpu) {
            console.log(chalk.white(`  GPU Usage: ${chalk.cyan(metrics.resource_utilization.gpu.toFixed(1))}%`));
        }
        console.log(chalk.white(`  Daily Earnings: ${chalk.green('$' + metrics.earnings.daily.toFixed(2))}`));
    }
    // Last 7 Days Summary
    console.log(chalk.blue.bold('\n📊 Last 7 Days Summary'));
    console.log(chalk.white(`Total Devices: ${chalk.cyan(stats.totalDevices)}`));
    console.log(chalk.white(`Weekly Earnings: ${chalk.green('$' + stats.weeklyEarnings.toFixed(2))}`));
    console.log(chalk.white(`Average Utilization: ${chalk.cyan(stats.totalUtilization.toFixed(1))}%`));
    // Monthly projections
    const monthlyProjection = stats.weeklyEarnings * 4.33; // avg weeks per month
    const yearlyProjection = monthlyProjection * 12;
    console.log(chalk.blue.bold('\n🎯 Earnings Projections'));
    console.log(chalk.white(`Monthly (projected): ${chalk.green('$' + monthlyProjection.toFixed(2))}`));
    console.log(chalk.white(`Yearly (projected): ${chalk.green('$' + yearlyProjection.toFixed(2))}`));
    // Statement Information
    console.log(chalk.blue.bold('\n📄 Generated Statement'));
    console.log(chalk.white(`CSV File: ${chalk.cyan(statementPath)}`));
    console.log(chalk.white(`Format: Weekly earnings breakdown by device`));
    // Call to Action
    console.log(chalk.magenta.bold('\n🚀 Next Steps'));
    console.log(chalk.white('• Check the generated CSV file in the statements/ folder'));
    console.log(chalk.white('• Set up real API credentials to get live data'));
    console.log(chalk.white('• Configure Discord webhooks for notifications'));
    console.log(chalk.white('• Scale up with more devices across multiple networks'));
}
// Run the demo if this file is executed directly
if (require.main === module) {
    main().catch(console.error);
}
export { main as runDemo };
