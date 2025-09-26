#!/usr/bin/env node

/**
 * Vercel Usage Monitor
 * 
 * This script helps monitor and alert on Vercel usage to prevent overages.
 * It can be run as a GitHub Action or scheduled job.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const LOG_FILE = 'logs/vercel-usage.log';
const ALERT_THRESHOLD = 80; // Alert when usage reaches 80%

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  console.log(logMessage);
  fs.appendFileSync(LOG_FILE, logMessage + '\n');
}

function getVercelUsage() {
  try {
    // This would require Vercel CLI and API access
    // For now, we'll create a template that can be extended
    log('Checking Vercel usage...');
    
    // Placeholder for actual Vercel API call
    // const usage = execSync('vercel usage', { encoding: 'utf8' });
    
    // Mock data for demonstration
    const mockUsage = {
      credits: {
        used: 75,
        limit: 100,
        percentage: 75
      },
      functions: {
        invocations: 15000,
        duration: 45000 // seconds
      },
      bandwidth: {
        used: 500, // GB
        limit: 1000
      }
    };
    
    return mockUsage;
  } catch (error) {
    log(`Error getting Vercel usage: ${error.message}`);
    return null;
  }
}

function checkUsageThresholds(usage) {
  const alerts = [];
  
  if (usage.credits.percentage >= ALERT_THRESHOLD) {
    alerts.push({
      type: 'CRITICAL',
      message: `Vercel credits usage at ${usage.credits.percentage}% (${usage.credits.used}/${usage.credits.limit})`
    });
  }
  
  if (usage.credits.percentage >= 60) {
    alerts.push({
      type: 'WARNING',
      message: `Vercel credits usage at ${usage.credits.percentage}% - approaching limit`
    });
  }
  
  return alerts;
}

function generateUsageReport(usage) {
  const report = `
Vercel Usage Report - ${new Date().toLocaleDateString()}

Credits:
  Used: ${usage.credits.used}/${usage.credits.limit} (${usage.credits.percentage}%)

Functions:
  Invocations: ${usage.functions.invocations.toLocaleString()}
  Duration: ${usage.functions.duration.toLocaleString()} seconds

Bandwidth:
  Used: ${usage.bandwidth.used}GB/${usage.bandwidth.limit}GB

Recommendations:
  - Monitor function execution times
  - Implement aggressive caching
  - Consider reducing middleware execution
  - Review API proxy usage patterns
`;

  return report;
}

function main() {
  log('Starting Vercel usage monitoring...');
  
  const usage = getVercelUsage();
  if (!usage) {
    log('Failed to retrieve usage data');
    process.exit(1);
  }
  
  const alerts = checkUsageThresholds(usage);
  
  if (alerts.length > 0) {
    log('ALERTS DETECTED:');
    alerts.forEach(alert => {
      log(`${alert.type}: ${alert.message}`);
    });
  }
  
  const report = generateUsageReport(usage);
  log('Usage Report Generated');
  
  // Save report to file
  const reportFile = `logs/vercel-report-${new Date().toISOString().split('T')[0]}.txt`;
  fs.writeFileSync(reportFile, report);
  log(`Report saved to: ${reportFile}`);
  
  // Exit with error code if critical alerts
  const criticalAlerts = alerts.filter(alert => alert.type === 'CRITICAL');
  if (criticalAlerts.length > 0) {
    log('Critical alerts detected - exiting with error code');
    process.exit(1);
  }
  
  log('Monitoring completed successfully');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}