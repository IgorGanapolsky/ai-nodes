#!/usr/bin/env tsx
import { getRepositories } from '../repositories';
import crypto from 'crypto';
// Sample data generators
function generateUsers() {
    return [
        {
            email: 'admin@example.com',
            passwordHash: crypto.createHash('sha256').update('admin123').digest('hex'),
            role: 'admin',
        },
        {
            email: 'user1@example.com',
            passwordHash: crypto.createHash('sha256').update('user123').digest('hex'),
            role: 'user',
        },
        {
            email: 'user2@example.com',
            passwordHash: crypto.createHash('sha256').update('user456').digest('hex'),
            role: 'user',
        },
        {
            email: 'viewer@example.com',
            passwordHash: crypto.createHash('sha256').update('viewer123').digest('hex'),
            role: 'viewer',
        },
    ];
}
function generateNodes(userIds) {
    const nodeTypes = ['storj', 'filecoin', 'chia', 'akash', 'theta', 'livepeer', 'helium'];
    const statuses = ['active', 'inactive', 'error', 'maintenance', 'pending'];
    const locations = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1', 'local-datacenter'];
    return userIds.flatMap((ownerId, userIndex) => {
        return Array.from({ length: 3 + userIndex }, (_, nodeIndex) => ({
            ownerId,
            type: nodeTypes[Math.floor(Math.random() * nodeTypes.length)],
            name: `Node-${userIndex + 1}-${nodeIndex + 1}`,
            description: `Sample ${nodeTypes[nodeIndex % nodeTypes.length]} node for testing`,
            apiKey: `test_api_key_${userIndex}_${nodeIndex}`,
            apiUrl: `https://api-${userIndex}-${nodeIndex}.example.com`,
            status: statuses[Math.floor(Math.random() * statuses.length)],
            version: '1.0.0',
            location: locations[Math.floor(Math.random() * locations.length)],
            hardware: `Intel i7, 16GB RAM, 1TB SSD`,
            bandwidth: 100 + Math.random() * 900, // 100-1000 Mbps
            storage: 500 + Math.random() * 1500, // 500-2000 GB
            isOnline: Math.random() > 0.3, // 70% online
            lastSeen: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last week
        }));
    });
}
function generateEarnings(nodeIds) {
    const currencies = ['USD', 'STORJ', 'FIL', 'XCH', 'AKT'];
    const earningTypes = ['storage', 'bandwidth', 'compute', 'staking', 'mining'];
    return nodeIds.flatMap(nodeId => {
        return Array.from({ length: 10 + Math.floor(Math.random() * 20) }, () => {
            const currency = currencies[Math.floor(Math.random() * currencies.length)];
            const earningType = earningTypes[Math.floor(Math.random() * earningTypes.length)];
            const amount = 1 + Math.random() * 99; // $1-100
            const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random within last 30 days
            return {
                nodeId,
                amount,
                currency: 'USD',
                cryptoAmount: currency !== 'USD' ? amount * (10 + Math.random() * 100) : null,
                cryptoCurrency: currency !== 'USD' ? currency : null,
                exchangeRate: currency !== 'USD' ? 0.5 + Math.random() * 2 : null,
                source: `${earningType} rewards`,
                earningType,
                isPaid: Math.random() > 0.3, // 70% paid
                paidAt: Math.random() > 0.3 ? timestamp : null,
                timestamp,
            };
        });
    });
}
function generateMetrics(nodeIds) {
    return nodeIds.flatMap(nodeId => {
        return Array.from({ length: 48 }, (_, index) => {
            // Generate metrics for last 48 hours (one per hour)
            const timestamp = new Date(Date.now() - index * 60 * 60 * 1000);
            return {
                nodeId,
                cpuUsage: 10 + Math.random() * 80, // 10-90%
                cpuCores: 4 + Math.floor(Math.random() * 4), // 4-8 cores
                cpuFrequency: 2.4 + Math.random() * 1.6, // 2.4-4.0 GHz
                cpuTemperature: 35 + Math.random() * 30, // 35-65°C
                memoryUsage: 20 + Math.random() * 70, // 20-90%
                memoryTotal: 8 + Math.floor(Math.random() * 24), // 8-32 GB
                memoryUsed: null, // Will be calculated
                memoryFree: null, // Will be calculated
                storageUsage: 30 + Math.random() * 60, // 30-90%
                storageTotal: 500 + Math.random() * 1500, // 500-2000 GB
                storageUsed: null, // Will be calculated
                storageFree: null, // Will be calculated
                storageIOPS: 100 + Math.random() * 400, // 100-500 IOPS
                bandwidthUp: 50 + Math.random() * 450, // 50-500 Mbps
                bandwidthDown: 100 + Math.random() * 900, // 100-1000 Mbps
                networkLatency: 10 + Math.random() * 90, // 10-100 ms
                packetLoss: Math.random() * 5, // 0-5%
                uptime: index * 3600 + Math.random() * 3600, // Increasing uptime
                connections: 10 + Math.floor(Math.random() * 90), // 10-100 connections
                requestsPerSecond: 1 + Math.random() * 49, // 1-50 RPS
                errorRate: Math.random() * 5, // 0-5% error rate
                syncStatus: 90 + Math.random() * 10, // 90-100% sync
                blockHeight: 1000000 + Math.floor(Math.random() * 10000), // Random block height
                peerCount: 5 + Math.floor(Math.random() * 45), // 5-50 peers
                timestamp,
            };
        });
    });
}
function generateAlerts(nodeIds) {
    const alertTypes = ['offline', 'high_cpu', 'high_memory', 'low_storage', 'network_issues', 'sync_error'];
    const severities = ['low', 'medium', 'high', 'critical'];
    return nodeIds.flatMap(nodeId => {
        // Generate 0-3 alerts per node
        return Array.from({ length: Math.floor(Math.random() * 4) }, () => {
            const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
            const severity = severities[Math.floor(Math.random() * severities.length)];
            const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random within last week
            const resolved = Math.random() > 0.4; // 60% resolved
            return {
                nodeId,
                type,
                severity,
                title: `${type.replace('_', ' ').toUpperCase()} Alert`,
                message: `Node is experiencing ${type.replace('_', ' ')} issues`,
                details: JSON.stringify({ timestamp: timestamp.toISOString(), threshold: '80%' }),
                resolved,
                resolvedAt: resolved ? new Date(timestamp.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
                resolvedBy: resolved ? 'system' : null,
                notificationSent: true,
                notificationChannels: JSON.stringify(['email', 'slack']),
                timestamp,
            };
        });
    });
}
function generateRevenueShares(nodeIds) {
    const shareTypes = ['owner', 'platform', 'referral', 'maintenance'];
    const periods = ['2024-01', '2024-02', '2024-03', '2023-12'];
    return nodeIds.flatMap(nodeId => {
        return periods.flatMap(period => {
            return shareTypes.map(shareType => {
                const percentage = shareType === 'owner' ? 70 + Math.random() * 20 : 5 + Math.random() * 15;
                const totalEarnings = 100 + Math.random() * 900; // $100-1000
                const periodStart = new Date(`${period}-01`);
                const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 0);
                const amount = (totalEarnings * percentage) / 100;
                return {
                    nodeId,
                    percentage,
                    amount,
                    period,
                    periodStart,
                    periodEnd,
                    totalEarnings,
                    shareType,
                    recipientId: shareType === 'owner' ? null : 'platform-wallet',
                    recipientAddress: shareType !== 'owner' ? '0x1234567890abcdef' : null,
                    paidOut: Math.random() > 0.3, // 70% paid
                    paidAt: Math.random() > 0.3 ? new Date() : null,
                    transactionHash: Math.random() > 0.3 ? `0x${crypto.randomBytes(32).toString('hex')}` : null,
                    notes: `Revenue share for ${period}`,
                };
            });
        });
    });
}
async function seedDatabase() {
    console.log('🌱 Starting database seeding...');
    try {
        const repositories = getRepositories();
        // Clear existing data (in reverse dependency order)
        console.log('🧹 Clearing existing data...');
        await repositories.revenueShares.deleteMany(await repositories.revenueShares.findMany().then(r => r.data.map(s => s.id)));
        await repositories.alerts.deleteMany(await repositories.alerts.findMany().then(r => r.data.map(a => a.id)));
        await repositories.metrics.deleteMany(await repositories.metrics.findMany().then(r => r.data.map(m => m.id)));
        await repositories.earnings.deleteMany(await repositories.earnings.findMany().then(r => r.data.map(e => e.id)));
        await repositories.nodes.deleteMany(await repositories.nodes.findMany().then(r => r.data.map(n => n.id)));
        await repositories.users.deleteMany(await repositories.users.findMany().then(r => r.data.map(u => u.id)));
        // Create users
        console.log('👥 Creating users...');
        const userData = generateUsers();
        const users = await Promise.all(userData.map(user => repositories.users.create(user)));
        console.log(`✅ Created ${users.length} users`);
        // Create nodes
        console.log('🖥️  Creating nodes...');
        const nodeData = generateNodes(users.map(u => u.id));
        const nodes = await Promise.all(nodeData.map(node => repositories.nodes.create(node)));
        console.log(`✅ Created ${nodes.length} nodes`);
        // Create earnings
        console.log('💰 Creating earnings...');
        const earningsData = generateEarnings(nodes.map(n => n.id));
        const earnings = await Promise.all(earningsData.map(earning => repositories.earnings.create(earning)));
        console.log(`✅ Created ${earnings.length} earnings records`);
        // Create metrics
        console.log('📊 Creating metrics...');
        const metricsData = generateMetrics(nodes.map(n => n.id));
        // Process in batches to avoid overwhelming the database
        const batchSize = 100;
        let metricsCreated = 0;
        for (let i = 0; i < metricsData.length; i += batchSize) {
            const batch = metricsData.slice(i, i + batchSize);
            await Promise.all(batch.map(metric => repositories.metrics.create(metric)));
            metricsCreated += batch.length;
            console.log(`  📈 Created ${metricsCreated}/${metricsData.length} metrics records`);
        }
        console.log(`✅ Created ${metricsCreated} metrics records`);
        // Create alerts
        console.log('🚨 Creating alerts...');
        const alertsData = generateAlerts(nodes.map(n => n.id));
        const alerts = await Promise.all(alertsData.map(alert => repositories.alerts.create(alert)));
        console.log(`✅ Created ${alerts.length} alerts`);
        // Create revenue shares
        console.log('💼 Creating revenue shares...');
        const revenueSharesData = generateRevenueShares(nodes.map(n => n.id));
        const revenueShares = await Promise.all(revenueSharesData.map(share => repositories.revenueShares.create(share)));
        console.log(`✅ Created ${revenueShares.length} revenue shares`);
        console.log('🎉 Database seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log(`  👥 Users: ${users.length}`);
        console.log(`  🖥️  Nodes: ${nodes.length}`);
        console.log(`  💰 Earnings: ${earnings.length}`);
        console.log(`  📊 Metrics: ${metricsCreated}`);
        console.log(`  🚨 Alerts: ${alerts.length}`);
        console.log(`  💼 Revenue Shares: ${revenueShares.length}`);
    }
    catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    seedDatabase().catch(console.error);
}
export { seedDatabase };
