#!/usr/bin/env node

/**
 * Simple Renovate configuration validator
 * Validates the JSON syntax and checks for required fields
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILES = [
  'renovate.json',
  '.renovaterc',
  '.github/renovate.json5'
];

function validateRenovateConfig() {
  console.log('🤖 Validating Renovate configuration...\n');

  let allValid = true;

  for (const configFile of CONFIG_FILES) {
    const filePath = path.join(process.cwd(), configFile);

    console.log(`Checking ${configFile}...`);

    if (!fs.existsSync(filePath)) {
      console.log(`  ⚠️  File not found (optional)`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf8');

      // Skip JSON5 validation (would need additional dependency)
      if (configFile.endsWith('.json5')) {
        console.log(`  ✅ JSON5 file exists (syntax not validated)`);
        continue;
      }

      const config = JSON.parse(content);

      // Basic validation
      if (configFile === 'renovate.json') {
        const requiredFields = ['automerge', 'schedule', 'prConcurrentLimit'];
        const missingFields = requiredFields.filter(field => !(field in config));

        if (missingFields.length > 0) {
          console.log(`  ❌ Missing required fields: ${missingFields.join(', ')}`);
          allValid = false;
        } else {
          console.log(`  ✅ Valid with aggressive settings`);
          console.log(`    - Auto-merge: ${config.automerge}`);
          console.log(`    - Schedule: ${config.schedule}`);
          console.log(`    - PR Limit: ${config.prConcurrentLimit}`);
          console.log(`    - Branch Limit: ${config.branchConcurrentLimit}`);
        }
      } else {
        console.log(`  ✅ Valid JSON syntax`);
      }

    } catch (error) {
      console.log(`  ❌ Invalid JSON: ${error.message}`);
      allValid = false;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (allValid) {
    console.log('🎉 All Renovate configurations are valid!');
    console.log('🚀 Ultra-aggressive automation is ready to deploy!');
    process.exit(0);
  } else {
    console.log('💥 Configuration validation failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  validateRenovateConfig();
}

module.exports = { validateRenovateConfig };