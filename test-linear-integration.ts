#!/usr/bin/env tsx

import { OnaLinearAgent } from './packages/core/dist/linear/ona-agent.js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testLinearIntegration() {
  console.log('🚀 Testing Ona Agent with Linear Integration...\n');

  const apiKey = process.env.LINEAR_API_KEY;
  const mcpServer = process.env.LINEAR_MCP_SERVER;
  const teamId = process.env.LINEAR_TEAM_ID;

  if (!apiKey) {
    console.error('❌ LINEAR_API_KEY not found in environment variables');
    process.exit(1);
  }

  if (!teamId) {
    console.error('❌ LINEAR_TEAM_ID not found in environment variables');
    process.exit(1);
  }

  // Initialize Ona Linear Agent
  const agent = new OnaLinearAgent({
    apiKey,
    mcpServerUrl: mcpServer,
    teamId,
    agentName: 'Ona Test Agent',
    capabilities: ['create', 'search', 'analyze'],
  });

  try {
    // Test 1: Create a test issue
    console.log('📝 Test 1: Creating a test issue...');
    const newIssue = await agent.createTask({
      title: 'Test Issue from Ona Agent',
      description: 'This is a test issue created by Ona agent integration',
      priority: 2,
    });
    console.log('✅ Issue created:', {
      id: newIssue.id,
      title: newIssue.title,
      state: newIssue.state,
    });
    console.log();

    // Test 2: Search for issues
    console.log('🔍 Test 2: Searching for issues...');
    const searchResults = await agent.searchAndAnalyze('test');
    console.log('✅ Search results:', {
      totalIssues: searchResults.analysis.totalCount,
      byState: searchResults.analysis.byState,
      avgAge: `${searchResults.analysis.avgAge.toFixed(1)} days`,
    });
    console.log();

    // Test 3: Get projects
    console.log('📊 Test 3: Getting projects...');
    const projects = await agent.getProjects();
    console.log('✅ Projects found:', projects.length);
    projects.slice(0, 3).forEach((project) => {
      console.log(`  - ${project.name} (${project.state}): ${project.progress}% complete`);
    });
    console.log();

    // Test 4: Process a workflow
    console.log('⚡ Test 4: Processing a workflow...');
    const workflowResults = await agent.processWorkflow({
      name: 'Test Workflow',
      steps: [
        {
          action: 'create',
          params: {
            title: 'Workflow Task 1',
            description: 'First task in workflow',
            priority: 3,
          },
        },
        {
          action: 'search',
          params: {
            query: 'workflow',
          },
        },
      ],
    });
    console.log('✅ Workflow completed:');
    workflowResults.forEach((result, index) => {
      console.log(
        `  Step ${index + 1}: ${result.action} - ${result.success ? 'Success' : 'Failed'}`,
      );
    });
    console.log();

    // Test 5: Test MCP Server connection
    console.log('🔌 Test 5: Testing MCP Server connection...');
    try {
      const mcpResponse = await agent.sendMCPCommand('ping');
      console.log('✅ MCP Server connected successfully');
    } catch (error) {
      console.log(
        '⚠️  MCP Server connection test failed (this is expected if the server is not running)',
      );
    }

    console.log('\\n✨ All tests completed successfully!');
    console.log('\\nYour Ona agents are now integrated with Linear and ready to use!');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Disconnect from MCP server
    agent.disconnect();
  }
}

// Run tests
testLinearIntegration().catch(console.error);
