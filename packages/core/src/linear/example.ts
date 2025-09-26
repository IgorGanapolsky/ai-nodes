#!/usr/bin/env tsx

import { OnaLinearAgent } from './ona-agent';

// Example usage of Ona Linear Agent
async function main() {
  // Initialize the agent with your configuration
  const agent = new OnaLinearAgent({
    apiKey: process.env.LINEAR_API_KEY!,
    teamId: process.env.LINEAR_TEAM_ID!,
    mcpServerUrl: process.env.LINEAR_MCP_SERVER,
    agentName: 'My Ona Agent',
    capabilities: ['create', 'update', 'search', 'analyze'],
    autoProcess: true,
  });

  // Create a new task
  const issue = await agent.createTask({
    title: 'Implement new feature',
    description: 'Add support for real-time notifications',
    priority: 2,
  });

  console.log('Created issue:', issue.id);

  // Search and analyze issues
  const results = await agent.searchAndAnalyze('bug');
  console.log('Found', results.analysis.totalCount, 'bugs');
  console.log('Average age:', results.analysis.avgAge, 'days');

  // Process a workflow
  const workflowResults = await agent.processWorkflow({
    name: 'Sprint Planning',
    steps: [
      {
        action: 'create',
        params: {
          title: 'Sprint planning meeting',
          priority: 1,
        },
      },
      {
        action: 'search',
        params: {
          query: 'ready for sprint',
        },
      },
    ],
  });

  console.log('Workflow completed with', workflowResults.length, 'steps');

  // Clean up
  agent.disconnect();
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}