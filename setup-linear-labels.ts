#!/usr/bin/env tsx

import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const API_KEY = process.env.LINEAR_API_KEY!;
const TEAM_ID = process.env.LINEAR_TEAM_ID!;

interface Label {
  name: string;
  description: string;
  color: string;
}

const labels: Label[] = [
  // Priority levels
  {
    name: 'Critical',
    description: 'Urgent production issues requiring immediate attention',
    color: '#FF0000',
  },
  {
    name: 'High Priority',
    description: 'Important issues that should be addressed soon',
    color: '#FF6B6B',
  },
  { name: 'Low Priority', description: 'Nice-to-have improvements', color: '#95E1D3' },

  // Issue types (additional to existing Bug, Feature, Improvement)
  { name: 'CI/CD', description: 'Deployment, build, and pipeline issues', color: '#6C5CE7' },
  { name: 'Performance', description: 'Performance optimization and monitoring', color: '#FDCB6E' },
  { name: 'Security', description: 'Security vulnerabilities and improvements', color: '#D63031' },
  {
    name: 'Documentation',
    description: 'Documentation updates and improvements',
    color: '#74B9FF',
  },
  { name: 'Integration', description: 'Third-party service integrations', color: '#A29BFE' },
  { name: 'Infrastructure', description: 'Infrastructure and DevOps related', color: '#636E72' },
  { name: 'Tech Debt', description: 'Technical debt and refactoring', color: '#FAB1A0' },

  // Status indicators
  { name: 'Blocked', description: 'Issue is blocked by external dependencies', color: '#2D3436' },
  { name: 'Ready for Review', description: 'Code is ready for review', color: '#00CEC9' },
  { name: 'In Testing', description: 'Currently being tested', color: '#E17055' },
  { name: 'Deployed', description: 'Deployed to production', color: '#00B894' },

  // Component areas
  { name: 'Frontend', description: 'Frontend/UI related issues', color: '#FF7675' },
  { name: 'Backend', description: 'Backend/API related issues', color: '#5F3DC4' },
  { name: 'Database', description: 'Database related issues', color: '#0984E3' },
  { name: 'Mobile', description: 'Mobile app related issues', color: '#A8E6CF' },
  { name: 'CLI', description: 'CLI tool related issues', color: '#FFD93D' },

  // Automation specific
  { name: 'Automated', description: 'Issue created by automation', color: '#B2BEC3' },
  { name: 'Vercel', description: 'Vercel deployment related', color: '#000000' },
  {
    name: 'Linear Integration',
    description: 'Linear API and integration issues',
    color: '#5E72E4',
  },
  { name: 'Ona Agent', description: 'Issues created or managed by Ona agents', color: '#48DBF8' },

  // DePIN specific
  { name: 'Node Management', description: 'Node monitoring and management', color: '#22A6B3' },
  { name: 'Revenue', description: 'Revenue tracking and optimization', color: '#6AB04C' },
  { name: 'Connector', description: 'Network connector issues', color: '#EB4D4B' },
];

async function createLabel(label: Label) {
  const mutation = `
    mutation CreateLabel($input: IssueLabelCreateInput!) {
      issueLabelCreate(input: $input) {
        success
        issueLabel {
          id
          name
          color
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: API_KEY,
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            name: label.name,
            description: label.description,
            color: label.color,
            teamId: TEAM_ID,
          },
        },
      }),
    });

    const data = await response.json();

    if (data.errors) {
      // Check if it's a duplicate error
      const isDuplicate = data.errors.some(
        (error: any) =>
          error.message?.includes('already exists') || error.extensions?.code === 'DUPLICATE_VALUE',
      );

      if (isDuplicate) {
        console.log(`⏭️  Label "${label.name}" already exists, skipping...`);
        return { success: true, skipped: true };
      } else {
        console.error(`❌ Error creating label "${label.name}":`, data.errors);
        return { success: false };
      }
    }

    if (data.data?.issueLabelCreate?.success) {
      console.log(`✅ Created label: ${label.name} (${label.color})`);
      return { success: true };
    }

    return { success: false };
  } catch (error) {
    console.error(`❌ Failed to create label "${label.name}":`, error);
    return { success: false };
  }
}

async function setupLabels() {
  console.log('🏷️  Setting up Linear labels for better issue tracking...\n');

  if (!API_KEY || !TEAM_ID) {
    console.error('❌ Missing LINEAR_API_KEY or LINEAR_TEAM_ID in environment variables');
    process.exit(1);
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const label of labels) {
    const result = await createLabel(label);
    if (result.success) {
      if (result.skipped) {
        skipped++;
      } else {
        created++;
      }
    } else {
      failed++;
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Created: ${created} labels`);
  console.log(`   ⏭️  Skipped: ${skipped} labels (already exist)`);
  if (failed > 0) {
    console.log(`   ❌ Failed: ${failed} labels`);
  }

  console.log('\n🎯 Your Linear workspace now has comprehensive labels for:');
  console.log('   • Priority levels (Critical, High, Low)');
  console.log('   • Issue types (CI/CD, Performance, Security, etc.)');
  console.log('   • Status tracking (Blocked, In Testing, Deployed)');
  console.log('   • Component areas (Frontend, Backend, Database, etc.)');
  console.log('   • Automation tracking (Automated, Ona Agent, Vercel)');
  console.log('   • DePIN specific (Node Management, Revenue, Connectors)');

  console.log('\n🤖 Ona agents can now use these labels to:');
  console.log('   • Automatically categorize issues');
  console.log('   • Set priorities based on severity');
  console.log('   • Track deployment status');
  console.log('   • Filter and report on specific areas');
}

// Run the setup
setupLabels().catch(console.error);
