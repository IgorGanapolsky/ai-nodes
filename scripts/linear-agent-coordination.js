#!/usr/bin/env node

/**
 * Linear Agent Coordination Script
 * 
 * This script helps coordinate multiple agents working on the project
 * by creating and managing tasks in Linear.
 */

import { LinearService, AgentCoordination } from '@depinautopilot/core/linear';
import fs from 'fs';
import path from 'path';

// Configuration
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID;

if (!LINEAR_API_KEY) {
  console.error('❌ LINEAR_API_KEY environment variable is required');
  process.exit(1);
}

// Initialize Linear service
const linearService = new LinearService({
  apiKey: LINEAR_API_KEY,
  teamId: LINEAR_TEAM_ID,
});

const agentCoordination = new AgentCoordination(linearService);

// Agent coordination functions
class AgentCoordinator {
  constructor() {
    this.agents = new Map();
  }

  /**
   * Register an agent
   */
  registerAgent(name, capabilities = []) {
    this.agents.set(name, {
      name,
      capabilities,
      activeTasks: [],
      status: 'available',
    });
    console.log(`✅ Registered agent: ${name}`);
  }

  /**
   * Create a task for a specific agent
   */
  async createAgentTask(agentName, taskTitle, taskDescription, priority = 0) {
    try {
      const task = await agentCoordination.createAgentTask(
        agentName,
        taskTitle,
        taskDescription,
        priority,
        ['agent-task']
      );

      // Update agent status
      const agent = this.agents.get(agentName);
      if (agent) {
        agent.activeTasks.push(task.id);
        agent.status = 'busy';
      }

      console.log(`✅ Created task for ${agentName}: ${taskTitle}`);
      console.log(`   Linear URL: ${task.url}`);
      
      return task;
    } catch (error) {
      console.error(`❌ Failed to create task for ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * Create a coordination issue for multiple agents
   */
  async createCoordinationIssue(title, description, involvedAgents, priority = 1) {
    try {
      const issue = await agentCoordination.createCoordinationIssue(
        title,
        description,
        involvedAgents,
        priority
      );

      console.log(`✅ Created coordination issue: ${title}`);
      console.log(`   Involved agents: ${involvedAgents.join(', ')}`);
      console.log(`   Linear URL: ${issue.url}`);
      
      return issue;
    } catch (error) {
      console.error(`❌ Failed to create coordination issue:`, error.message);
      throw error;
    }
  }

  /**
   * Update task status
   */
  async updateTaskStatus(taskId, status, notes) {
    try {
      const issue = await agentCoordination.updateTaskStatus(taskId, status, notes);
      console.log(`✅ Updated task status: ${status}`);
      return issue;
    } catch (error) {
      console.error(`❌ Failed to update task status:`, error.message);
      throw error;
    }
  }

  /**
   * Get agent tasks
   */
  async getAgentTasks(agentName) {
    try {
      const tasks = await agentCoordination.getAgentTasks(agentName);
      console.log(`📋 Tasks for ${agentName}: ${tasks.length}`);
      return tasks;
    } catch (error) {
      console.error(`❌ Failed to get tasks for ${agentName}:`, error.message);
      throw error;
    }
  }

  /**
   * List all agents and their status
   */
  listAgents() {
    console.log('\n📊 Agent Status:');
    console.log('================');
    
    for (const [name, agent] of this.agents) {
      console.log(`${name}:`);
      console.log(`  Status: ${agent.status}`);
      console.log(`  Active Tasks: ${agent.activeTasks.length}`);
      console.log(`  Capabilities: ${agent.capabilities.join(', ')}`);
      console.log('');
    }
  }

  /**
   * Create a development workflow
   */
  async createDevelopmentWorkflow() {
    console.log('🚀 Creating development workflow...');

    // Register common agents
    this.registerAgent('Frontend Agent', ['React', 'TypeScript', 'UI/UX']);
    this.registerAgent('Backend Agent', ['Node.js', 'API', 'Database']);
    this.registerAgent('DevOps Agent', ['Deployment', 'CI/CD', 'Infrastructure']);
    this.registerAgent('QA Agent', ['Testing', 'Quality Assurance']);

    // Create coordination issue for current sprint
    await this.createCoordinationIssue(
      'Sprint Planning - Agent Coordination',
      `This issue coordinates all agents for the current development sprint.

**Sprint Goals:**
- Complete Linear integration
- Fix deployment issues
- Implement agent coordination workflows

**Agent Responsibilities:**
- Frontend Agent: UI components and user experience
- Backend Agent: API development and data management
- DevOps Agent: Deployment and infrastructure
- QA Agent: Testing and quality assurance

**Coordination Points:**
- Daily standups via Linear comments
- Cross-agent dependencies tracked in sub-issues
- Progress updates in this main coordination issue`,
      ['Frontend Agent', 'Backend Agent', 'DevOps Agent', 'QA Agent'],
      1
    );

    // Create specific tasks for each agent
    await this.createAgentTask(
      'Frontend Agent',
      'Implement Linear Dashboard Component',
      `Create a comprehensive dashboard component for Linear integration:

**Requirements:**
- Display issues and tasks
- Create new tasks for agents
- Update task status
- Filter by agent and status
- Real-time updates

**Technical Details:**
- Use React Query for data fetching
- Implement proper error handling
- Add loading states
- Ensure responsive design`,
      1
    );

    await this.createAgentTask(
      'Backend Agent',
      'Create Linear API Integration',
      `Implement backend API integration with Linear:

**Requirements:**
- Linear SDK integration
- API routes for CRUD operations
- Agent coordination utilities
- Error handling and logging
- Authentication and authorization

**Technical Details:**
- Use @linear/sdk
- Implement proper TypeScript types
- Add comprehensive error handling
- Create agent coordination service`,
      1
    );

    await this.createAgentTask(
      'DevOps Agent',
      'Deploy Linear Integration',
      `Deploy the Linear integration to production:

**Requirements:**
- Environment variable configuration
- Vercel deployment
- API key management
- Monitoring and logging
- Performance optimization

**Technical Details:**
- Configure Linear API keys
- Update deployment scripts
- Add monitoring
- Test in staging environment`,
      2
    );

    await this.createAgentTask(
      'QA Agent',
      'Test Linear Integration',
      `Comprehensive testing of Linear integration:

**Requirements:**
- Unit tests for API integration
- Integration tests for workflows
- End-to-end testing
- Performance testing
- Security testing

**Technical Details:**
- Test all API endpoints
- Verify agent coordination
- Test error scenarios
- Performance benchmarks
- Security audit`,
      2
    );

    console.log('✅ Development workflow created successfully!');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  const coordinator = new AgentCoordinator();

  try {
    switch (command) {
      case 'register':
        const agentName = args[1];
        const capabilities = args.slice(2);
        if (!agentName) {
          console.error('❌ Agent name is required');
          process.exit(1);
        }
        coordinator.registerAgent(agentName, capabilities);
        break;

      case 'create-task':
        const [agentName2, taskTitle, taskDescription, priority] = args.slice(1);
        if (!agentName2 || !taskTitle || !taskDescription) {
          console.error('❌ Agent name, task title, and description are required');
          process.exit(1);
        }
        await coordinator.createAgentTask(agentName2, taskTitle, taskDescription, parseInt(priority) || 0);
        break;

      case 'create-coordination':
        const [title, description, ...agents] = args.slice(1);
        if (!title || !description || agents.length === 0) {
          console.error('❌ Title, description, and at least one agent are required');
          process.exit(1);
        }
        await coordinator.createCoordinationIssue(title, description, agents);
        break;

      case 'update-status':
        const [taskId, status, notes] = args.slice(1);
        if (!taskId || !status) {
          console.error('❌ Task ID and status are required');
          process.exit(1);
        }
        await coordinator.updateTaskStatus(taskId, status, notes);
        break;

      case 'list-tasks':
        const agentName3 = args[1];
        if (!agentName3) {
          console.error('❌ Agent name is required');
          process.exit(1);
        }
        await coordinator.getAgentTasks(agentName3);
        break;

      case 'list-agents':
        coordinator.listAgents();
        break;

      case 'create-workflow':
        await coordinator.createDevelopmentWorkflow();
        break;

      default:
        console.log(`
Linear Agent Coordination Script

Usage:
  node scripts/linear-agent-coordination.js <command> [options]

Commands:
  register <agent-name> [capabilities...]  Register a new agent
  create-task <agent> <title> <description> [priority]  Create a task for an agent
  create-coordination <title> <description> <agent1> [agent2...]  Create coordination issue
  update-status <task-id> <status> [notes]  Update task status
  list-tasks <agent-name>  List tasks for an agent
  list-agents  List all registered agents
  create-workflow  Create a complete development workflow

Examples:
  node scripts/linear-agent-coordination.js register "Frontend Agent" React TypeScript UI
  node scripts/linear-agent-coordination.js create-task "Frontend Agent" "Fix bug" "Fix the login bug" 1
  node scripts/linear-agent-coordination.js create-workflow
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}