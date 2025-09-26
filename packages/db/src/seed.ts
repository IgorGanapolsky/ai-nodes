#!/usr/bin/env tsx

import { getDatabaseConnection, owners, devices, metrics, statements } from './client';

async function seedDatabase() {
  console.log('🌱 Seeding database with demo data...');

  const db = getDatabaseConnection();

  try {
    // Create demo owner
    console.log('Creating demo owner...');
    const [demoOwner] = await db
      .insert(owners)
      .values({
        displayName: 'Demo Owner',
        email: 'demo@owner.test',
        discordWebhook: 'https://discord.com/api/webhooks/demo',
        revSharePct: 0.15, // 15% platform fee
      })
      .returning();

    console.log(`✅ Created owner: ${demoOwner.displayName} (${demoOwner.id})`);

    // Create demo devices
    console.log('Creating demo devices...');

    // Device 1: io.net GPU
    const [gpuDevice] = await db
      .insert(devices)
      .values({
        ownerId: demoOwner.id,
        label: 'High-Performance GPU Node',
        marketplace: 'io.net',
        externalId: 'io-gpu-001',
        hourlyPriceUsd: 2.5,
        region: 'us-west-1',
        active: true,
      })
      .returning();

    console.log(`✅ Created GPU device: ${gpuDevice.label} (${gpuDevice.id})`);

    // Device 2: Nosana CPU
    const [cpuDevice] = await db
      .insert(devices)
      .values({
        ownerId: demoOwner.id,
        label: 'Nosana CPU Compute Node',
        marketplace: 'nosana',
        externalId: 'nosana-cpu-001',
        hourlyPriceUsd: 0.75,
        region: 'eu-central-1',
        active: true,
      })
      .returning();

    console.log(`✅ Created CPU device: ${cpuDevice.label} (${cpuDevice.id})`);

    // Generate synthetic metrics for last 30 days
    console.log('Generating synthetic metrics for the last 30 days...');

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const metricsData: any[] = [];

    // Generate metrics for both devices
    for (const device of [gpuDevice, cpuDevice]) {
      const isGPU = device.marketplace === 'io.net';

      // Generate 4 metrics per day (every 6 hours) for 30 days
      for (let day = 0; day < 30; day++) {
        for (let hour = 0; hour < 24; hour += 6) {
          const timestamp = new Date(thirtyDaysAgo.getTime() + (day * 24 + hour) * 60 * 60 * 1000);

          // Add some randomness but keep realistic ranges
          const baseEarnings = isGPU ? 2.5 : 0.75; // hourly rate
          const utilizationHours = 6 * (0.7 + Math.random() * 0.3); // 70-100% utilization
          const earningsUsd = baseEarnings * utilizationHours * (0.9 + Math.random() * 0.2); // ±10% variance

          metricsData.push({
            deviceId: device.id,
            cpuUsage: isGPU ? 15 + Math.random() * 25 : 40 + Math.random() * 40, // GPU: 15-40%, CPU: 40-80%
            memoryUsage: 60 + Math.random() * 30, // 60-90%
            gpuUsage: isGPU ? 85 + Math.random() * 10 : null, // GPU: 85-95%, CPU: null
            storageUsage: 20 + Math.random() * 30, // 20-50%
            earningsUsd: Math.round(earningsUsd * 100) / 100, // Round to 2 decimals
            utilizationHours: Math.round(utilizationHours * 100) / 100,
            uptime: 95 + Math.random() * 5, // 95-100%
            bandwidthUp: isGPU ? 800 + Math.random() * 200 : 100 + Math.random() * 50, // GPU: 800-1000Mbps, CPU: 100-150Mbps
            bandwidthDown: isGPU ? 900 + Math.random() * 100 : 150 + Math.random() * 50, // GPU: 900-1000Mbps, CPU: 150-200Mbps
            latency: 5 + Math.random() * 15, // 5-20ms
            temperature: isGPU ? 65 + Math.random() * 15 : 45 + Math.random() * 20, // GPU: 65-80°C, CPU: 45-65°C
            powerUsage: isGPU ? 250 + Math.random() * 100 : 65 + Math.random() * 35, // GPU: 250-350W, CPU: 65-100W
            timestamp,
          });
        }
      }
    }

    // Insert all metrics in batches
    const batchSize = 100;
    for (let i = 0; i < metricsData.length; i += batchSize) {
      const batch = metricsData.slice(i, i + batchSize);
      await db.insert(metrics).values(batch);
    }

    console.log(`✅ Generated ${metricsData.length} metric records`);

    // Generate monthly statements
    console.log('Creating monthly statements...');

    // const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    for (const device of [gpuDevice, cpuDevice]) {
      const isGPU = device.marketplace === 'io.net';

      // Calculate realistic monthly earnings
      const avgUtilization = 0.85; // 85% average utilization
      const hoursInMonth = 30 * 24;
      const utilizedHours = hoursInMonth * avgUtilization;
      const hourlyRate = isGPU ? 2.5 : 0.75;
      const grossEarnings = utilizedHours * hourlyRate;
      const platformFeePct = 0.15;
      const platformFee = grossEarnings * platformFeePct;
      const ownerEarnings = grossEarnings - platformFee;

      await db.insert(statements).values({
        ownerId: demoOwner.id,
        deviceId: device.id,
        periodStart: lastMonth,
        periodEnd: lastMonthEnd,
        grossEarningsUsd: Math.round(grossEarnings * 100) / 100,
        platformFeePct: platformFeePct,
        platformFeeUsd: Math.round(platformFee * 100) / 100,
        ownerEarningsUsd: Math.round(ownerEarnings * 100) / 100,
        totalUtilizationHours: Math.round(utilizedHours * 100) / 100,
        averageHourlyRate: hourlyRate,
        uptimePercentage: 98.5, // 98.5% uptime
        marketplace: device.marketplace,
        currency: 'USD',
        status: 'processed',
      });

      console.log(
        `✅ Created statement for ${device.label}: $${ownerEarnings.toFixed(2)} owner earnings`,
      );
    }

    console.log('🎉 Database seeding completed successfully!');
    console.log('\nDemo data summary:');
    console.log(`- Owner: ${demoOwner.displayName} (${demoOwner.email})`);
    console.log(`- Devices: 2 (1 GPU @ io.net, 1 CPU @ Nosana)`);
    console.log(`- Metrics: ${metricsData.length} records over 30 days`);
    console.log('- Statements: 2 monthly statements');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };
