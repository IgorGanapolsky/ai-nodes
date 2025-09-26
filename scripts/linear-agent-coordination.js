#!/usr/bin/env node

/**
 * Linear Agent Coordination Script
 * 
 * This script helps coordinate multiple agents working on the project
 * by creating and managing tasks in Linear.
 */

// Linear integration is dynamically imported only when needed
import fs from 'fs';
import path from 'path';

// Configuration
const LINEAR_API_KEY = process.env.LINEAR_API_KEY;
const LINEAR_TEAM_ID = process.env.LINEAR_TEAM_ID;

// Lazy loader for Linear services to allow offline commands (status/reset-state)
let _agentCoordination = null;
async function getAgentCoordination() {
  if (_agentCoordination) return _agentCoordination;
  const mod = await import('@depinautopilot/core/linear');
  const linearService = new mod.LinearService({
    apiKey: LINEAR_API_KEY || '',
    teamId: LINEAR_TEAM_ID,
  });
  _agentCoordination = new mod.AgentCoordination(linearService);
  return _agentCoordination;
}

// Persistent checkpointing state
const STATE_DIR = path.join(process.cwd(), 'logs', 'agents');
const STATE_FILE = path.join(STATE_DIR, 'linear-coordination-state.json');

function ensureStateDir() {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

function defaultState() {
  return {
    agents: {},
    workflow: {
      steps: {
        registerAgents: 'pending',
        createCoordinationIssue: 'pending',
        createTasks: 'pending',
      },
      currentStep: null,
      createdCoordinationIssueId: null,
      agentTasks: {},
      lastUpdated: new Date().toISOString(),
    },
  };
}

function loadState() {
  try {
    ensureStateDir();
    if (!fs.existsSync(STATE_FILE)) return defaultState();
    const raw = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    console.warn('⚠️ Failed to load state; using defaults:', e.message);
    return defaultState();
  }
}

function saveState(state) {
  ensureStateDir();
  state.workflow.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// Agent coordination functions
class AgentCoordinator {
  constructor() {
    this.state = loadState();
    this.agents = new Map(Object.entries(this.state.agents || {}));
  }

  /**
   * Register an agent
   */
  registerAgent(name, capabilities = []) {
    const agent = {
      name,
      capabilities,
      activeTasks: [],
      status: 'available',
    };
    this.agents.set(name, agent);
    this.state.agents[name] = agent;
    saveState(this.state);
    console.log(`✅ Registered agent: ${name}`);
  }

  /**
   * Create a task for a specific agent
   */
  async createAgentTask(agentName, taskTitle, taskDescription, priority = 0) {
    try {
      const agentCoordination = await getAgentCoordination();
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

      // Persist task under workflow agentTasks for idempotency
      if (!this.state.workflow.agentTasks[agentName]) {
        this.state.workflow.agentTasks[agentName] = { created: true, issueId: task.id };
      } else {
        this.state.workflow.agentTasks[agentName].created = true;
        this.state.workflow.agentTasks[agentName].issueId = task.id;
      }
      saveState(this.state);

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
      const agentCoordination = await getAgentCoordination();
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
      const agentCoordination = await getAgentCoordination();
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
      const agentCoordination = await getAgentCoordination();
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
    console.log('📁 State file:', STATE_FILE);
    console.log('⏱  Last updated:', this.state.workflow.lastUpdated);
  }

  /**
   * Create a development workflow
   */
  async createDevelopmentWorkflow() {
    console.log('🚀 Creating development workflow...');

    // Step 1: Register common agents (idempotent)
    if (this.state.workflow.steps.registerAgents !== 'completed') {
      this.state.workflow.currentStep = 'registerAgents';
      saveState(this.state);
      const defaults = [
        ['Frontend Agent', ['React', 'TypeScript', 'UI/UX']],
        ['Backend Agent', ['Node.js', 'API', 'Database']],
        ['DevOps Agent', 'Deployment, CI/CD, Infrastructure'.split(', ')],
        ['QA Agent', ['Testing', 'Quality Assurance']],
      ];
      for (const [name, caps] of defaults) {
        if (!this.agents.has(name)) this.registerAgent(name, caps);
      }
      this.state.workflow.steps.registerAgents = 'completed';
      this.state.workflow.currentStep = null;
      saveState(this.state);
    }

    // Step 2: Create coordination issue once
    if (this.state.workflow.steps.createCoordinationIssue !== 'completed') {
      this.state.workflow.currentStep = 'createCoordinationIssue';
      saveState(this.state);
      const issue = await this.createCoordinationIssue(
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
      this.state.workflow.createdCoordinationIssueId = issue.id;
      this.state.workflow.steps.createCoordinationIssue = 'completed';
      this.state.workflow.currentStep = null;
      saveState(this.state);
    }

    // Step 3: Create tasks for each agent (skip already created)
    if (this.state.workflow.steps.createTasks !== 'completed') {
      this.state.workflow.currentStep = 'createTasks';
      saveState(this.state);
      const specs = [
        [
          'Frontend Agent',
          'Implement Linear Dashboard Component',
          `Create a comprehensive dashboard component for Linear integration:\n\n**Requirements:**\n- Display issues and tasks\n- Create new tasks for agents\n- Update task status\n- Filter by agent and status\n- Real-time updates\n\n**Technical Details:**\n- Use React Query for data fetching\n- Implement proper error handling\n- Add loading states\n- Ensure responsive design`,
          1,
        ],
        [
          'Backend Agent',
          'Create Linear API Integration',
          `Implement backend API integration with Linear:\n\n**Requirements:**\n- Linear SDK integration\n- API routes for CRUD operations\n- Agent coordination utilities\n- Error handling and logging\n- Authentication and authorization\n\n**Technical Details:**\n- Use @linear/sdk\n- Implement proper TypeScript types\n- Add comprehensive error handling\n- Create agent coordination service`,
          1,
        ],
        [
          'DevOps Agent',
          'Deploy Linear Integration',
          `Deploy the Linear integration to production:\n\n**Requirements:**\n- Environment variable configuration\n- Vercel deployment\n- API key management\n- Monitoring and logging\n- Performance optimization\n\n**Technical Details:**\n- Configure Linear API keys\n- Update deployment scripts\n- Add monitoring\n- Test in staging environment`,
          2,
        ],
        [
          'QA Agent',
          'Test Linear Integration',
          `Comprehensive testing of Linear integration:\n\n**Requirements:**\n- Unit tests for API integration\n- Integration tests for workflows\n- End-to-end testing\n- Performance testing\n- Security testing\n\n**Technical Details:**\n- Test all API endpoints\n- Verify agent coordination\n- Test error scenarios\n- Performance benchmarks\n- Security audit`,
          2,
        ],
      ];
      for (const [agent, title, desc, prio] of specs) {
        const rec = this.state.workflow.agentTasks[agent];
        if (rec && rec.created) {
          console.log(`↪︎ Skipping task for ${agent} (already created: ${rec.issueId})`);
          continue;
        }
        await this.createAgentTask(agent, title, desc, prio);
      }
      this.state.workflow.steps.createTasks = 'completed';
      this.state.workflow.currentStep = null;
      saveState(this.state);
    }

    console.log('✅ Development workflow created successfully (checkpointed)!');
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
        if (!LINEAR_API_KEY) {
          console.error('❌ LINEAR_API_KEY is required for this command. Try `status` or set the env var.');
          process.exit(1);
        }
        const [agentName2, taskTitle, taskDescription, priority] = args.slice(1);
        if (!agentName2 || !taskTitle || !taskDescription) {
          console.error('❌ Agent name, task title, and description are required');
          process.exit(1);
        }
        await coordinator.createAgentTask(agentName2, taskTitle, taskDescription, parseInt(priority) || 0);
        break;

      case 'create-coordination':
        if (!LINEAR_API_KEY) {
          console.error('❌ LINEAR_API_KEY is required for this command. Try `status` or set the env var.');
          process.exit(1);
        }
        const [title, description, ...agents] = args.slice(1);
        if (!title || !description || agents.length === 0) {
          console.error('❌ Title, description, and at least one agent are required');
          process.exit(1);
        }
        await coordinator.createCoordinationIssue(title, description, agents);
        break;

      case 'update-status':
        if (!LINEAR_API_KEY) {
          console.error('❌ LINEAR_API_KEY is required for this command. Try `status` or set the env var.');
          process.exit(1);
        }
        const [taskId, status, notes] = args.slice(1);
        if (!taskId || !status) {
          console.error('❌ Task ID and status are required');
          process.exit(1);
        }
        await coordinator.updateTaskStatus(taskId, status, notes);
        break;

      case 'list-tasks':
        if (!LINEAR_API_KEY) {
          console.error('❌ LINEAR_API_KEY is required for this command. Try `status` or set the env var.');
          process.exit(1);
        }
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
        if (!LINEAR_API_KEY) {
          console.error('❌ LINEAR_API_KEY is required for this command. Try `status` or set the env var.');
          process.exit(1);
        }
        await coordinator.createDevelopmentWorkflow();
        break;

      case 'status':
        console.log('\n🧭 Workflow Status');
        console.log('=================');
        console.log('Steps:', coordinator.state.workflow.steps);
        console.log('Current Step:', coordinator.state.workflow.currentStep || 'idle');
        console.log('Coordination Issue:', coordinator.state.workflow.createdCoordinationIssueId || 'not created');
        console.log('Agent Tasks:', coordinator.state.workflow.agentTasks);
        console.log('State File:', path.join(process.cwd(), 'logs', 'agents', 'linear-coordination-state.json'));
        break;

      case 'resume':
        if (!LINEAR_API_KEY) {
          console.error('❌ LINEAR_API_KEY is required for this command. Try `status` or set the env var.');
          process.exit(1);
        }
        console.log('⏯  Resuming development workflow from last checkpoint...');
        await coordinator.createDevelopmentWorkflow();
        break;

      case 'reset-state':
        ensureStateDir();
        fs.writeFileSync(path.join(process.cwd(), 'logs', 'agents', 'linear-coordination-state.json'), JSON.stringify(defaultState(), null, 2), 'utf8');
        console.log('🧹 Reset state. Next run will start fresh.');
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
  status  Show last known checkpoint and progress
  resume  Continue workflow from last checkpoint
  reset-state  Clear local checkpoints (does not delete Linear issues)

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
