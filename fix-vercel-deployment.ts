#!/usr/bin/env tsx

import { OnaLinearAgent } from './packages/core/src/linear/ona-agent';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function createVercelFixWorkflow() {
  console.log('🚀 Creating Linear issues for Vercel deployment fixes...\n');

  const agent = new OnaLinearAgent({
    apiKey: process.env.LINEAR_API_KEY!,
    teamId: process.env.LINEAR_TEAM_ID!,
    mcpServerUrl: process.env.LINEAR_MCP_SERVER,
    agentName: 'Vercel Fix Coordinator',
    capabilities: ['create', 'update', 'search', 'analyze'],
  });

  try {
    // Create main issue
    const mainIssue = await agent.createTask({
      title: 'CRITICAL: Fix Vercel Deployments - 4 Failed Builds',
      description: `
## Problem
4 Vercel deployments are failing:
- Deployment 71runueb8 on ai-nodes-web
- Deployment awyx6o1j7 on ai-nodes
- Deployment gkvuuvaue on ai-nodes-web-new
- Deployment ex3fty6b8 on ai-nodes-web-2

## Root Cause Analysis
1. **Package Manager Mismatch**: Project uses pnpm but npm lockfile exists
2. **Missing pnpm-lock.yaml**: Vercel can't install dependencies
3. **Build command references non-existent app**: @depinautopilot/web might not exist
4. **Linear integration just added**: New dependencies not properly installed

## Solution
1. Convert project to use pnpm properly
2. Generate pnpm-lock.yaml
3. Fix build commands in vercel.json
4. Ensure all dependencies are correctly installed
`,
      priority: 1,
    });

    console.log('✅ Main issue created:', mainIssue.id);

    // Create sub-tasks for parallel execution
    const subtasks = await agent.processWorkflow({
      name: 'Vercel Fix Workflow',
      steps: [
        {
          action: 'create',
          params: {
            title: 'Task 1: Install pnpm and generate lockfile',
            description:
              'Install pnpm globally and generate pnpm-lock.yaml from existing package-lock.json',
            priority: 1,
          },
        },
        {
          action: 'create',
          params: {
            title: 'Task 2: Fix vercel.json configuration',
            description: 'Update build commands and ensure proper monorepo structure',
            priority: 1,
          },
        },
        {
          action: 'create',
          params: {
            title: 'Task 3: Fix Linear integration dependencies',
            description: 'Ensure Linear integration modules are properly exported and built',
            priority: 2,
          },
        },
        {
          action: 'create',
          params: {
            title: 'Task 4: Create proper monorepo structure',
            description: 'Ensure apps/web exists and has proper Next.js configuration',
            priority: 1,
          },
        },
      ],
    });

    console.log('✅ Created', subtasks.length, 'subtasks for parallel execution');

    // Disconnect
    agent.disconnect();

    return { mainIssue, subtasks };
  } catch (error) {
    console.error('❌ Failed to create workflow:', error);
    agent.disconnect();
    throw error;
  }
}

// Run the workflow
createVercelFixWorkflow()
  .then(() => console.log('\n✅ Linear issues created successfully!'))
  .catch(console.error);
