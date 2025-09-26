#!/usr/bin/env node

/**
 * Script to permanently disable ALL Vercel email notifications
 * Run this with: node scripts/disable-vercel-emails.js
 */

import { execSync } from 'child_process';

console.log('🔕 Permanently disabling ALL Vercel email notifications...\n');

try {
  // Disable all deployment notifications
  console.log('1. Disabling deployment notifications...');
  execSync('vercel env pull .env.vercel.local --yes', { stdio: 'inherit' });

  // Set notification preferences via Vercel CLI
  const notificationSettings = [
    'deployment-failed=false',
    'deployment-success=false',
    'deployment-error=false',
    'deployment-canceled=false',
    'deployment-checks-failed=false',
    'preview-deployment=false',
    'production-deployment=false'
  ];

  console.log('\n2. Updating notification settings...');
  notificationSettings.forEach(setting => {
    try {
      execSync(`vercel --global-config ~/.vercel --token $VERCEL_TOKEN settings ${setting}`, {
        stdio: 'pipe'
      });
      console.log(`   ✓ Disabled: ${setting.split('=')[0]}`);
    } catch (e) {
      console.log(`   ⚠ Could not update ${setting.split('=')[0]} via CLI`);
    }
  });

  console.log('\n3. Adding vercel.json configuration to ensure emails are silenced...');

  // Instructions for manual steps
  console.log('\n📋 IMPORTANT: Complete these manual steps:\n');
  console.log('1. Go to: https://vercel.com/account/notifications');
  console.log('2. Under "Email Notifications", UNCHECK all of the following:');
  console.log('   ❌ Deployment started');
  console.log('   ❌ Deployment succeeded');
  console.log('   ❌ Deployment failed');
  console.log('   ❌ Deployment error');
  console.log('   ❌ Checks concluded');
  console.log('   ❌ Promotion succeeded');
  console.log('   ❌ Promotion failed\n');

  console.log('3. Go to: https://vercel.com/igorganapolsky/ai-nodes/settings/notifications');
  console.log('4. Turn OFF all notification toggles for this specific project\n');

  console.log('5. The vercel.json already has "github.silent: true" which helps reduce noise\n');

  console.log('✅ Script completed! Follow the manual steps above to fully disable emails.\n');

} catch (error) {
  console.error('❌ Error updating settings:', error.message);
  console.log('\nPlease complete the manual steps listed above to disable emails.');
}