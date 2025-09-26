import { NextRequest, NextResponse } from 'next/server';
import { LinearService, AgentCoordination, CreateIssueInput } from '@depinautopilot/core';
import { getLogger } from '@depinautopilot/utils';
import fs from 'fs';
import path from 'path';

const logger = getLogger('web-linear-api');

// Initialize Linear service
const linearService = new LinearService({
  apiKey: process.env.LINEAR_API_KEY || '',
  teamId: process.env.LINEAR_TEAM_ID,
});

const agentCoordination = new AgentCoordination(linearService);

// Simple checkpoint state shared with CLI script
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
      currentStep: null as null | string,
      createdCoordinationIssueId: null as null | string,
      createdCoordinationIssueTitle: null as null | string,
      createdCoordinationIssueUrl: null as null | string,
      agentTasks: {} as Record<
        string,
        { created: boolean; issueId?: string; title?: string; url?: string }
      >,
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
  } catch (_e) {
    return defaultState();
  }
}

function saveState(state: any) {
  ensureStateDir();
  state.workflow.lastUpdated = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const issueId = searchParams.get('issueId');
    const agentName = searchParams.get('agentName');

    switch (action) {
      case 'get-issue':
        if (!issueId) {
          return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
        }
        const issue = await linearService.getIssue(issueId);
        return NextResponse.json({ issue });

      case 'list-issues':
        const filters = {
          state: searchParams.get('state') || undefined,
          assigneeId: searchParams.get('assigneeId') || undefined,
          teamId: searchParams.get('teamId') || undefined,
          limit: parseInt(searchParams.get('limit') || '50'),
        };
        const issues = await linearService.listIssues(filters);
        return NextResponse.json({ issues });

      case 'get-agent-tasks':
        if (!agentName) {
          return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
        }
        const tasks = await agentCoordination.getAgentTasks(agentName);
        return NextResponse.json({ tasks });

      case 'get-labels':
        const labels = await linearService.getLabels();
        return NextResponse.json({ labels });

      case 'get-states':
        const states = await linearService.getStates();
        return NextResponse.json({ states });

      case 'workflow-status':
        return NextResponse.json({ state: loadState() });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Linear API error', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'create-issue':
        const createInput: CreateIssueInput = {
          title: body.title,
          description: body.description,
          priority: body.priority || 0,
          assigneeId: body.assigneeId,
          labelIds: body.labelIds,
          teamId: body.teamId,
        };
        const newIssue = await linearService.createIssue(createInput);
        return NextResponse.json({ issue: newIssue });

      case 'update-issue':
        const { issueId, ...updateInput } = body;
        if (!issueId) {
          return NextResponse.json({ error: 'Issue ID is required' }, { status: 400 });
        }
        const updatedIssue = await linearService.updateIssue(issueId, updateInput);
        return NextResponse.json({ issue: updatedIssue });

      case 'create-agent-task':
        const { agentName, taskTitle, taskDescription, priority: taskPriority, labels } = body;
        if (!agentName || !taskTitle || !taskDescription) {
          return NextResponse.json(
            { error: 'Agent name, task title, and description are required' },
            { status: 400 },
          );
        }
        const agentTask = await agentCoordination.createAgentTask(
          agentName,
          taskTitle,
          taskDescription,
          taskPriority || 0,
          labels || ['agent-task'],
        );
        return NextResponse.json({ issue: agentTask });

      case 'update-task-status':
        const { taskIssueId, status, notes } = body;
        if (!taskIssueId || !status) {
          return NextResponse.json(
            { error: 'Task issue ID and status are required' },
            { status: 400 },
          );
        }
        const statusUpdate = await agentCoordination.updateTaskStatus(taskIssueId, status, notes);
        return NextResponse.json({ issue: statusUpdate });

      case 'create-coordination-issue':
        const { title, description, involvedAgents, priority: coordinationPriority } = body;
        if (!title || !description || !involvedAgents || !Array.isArray(involvedAgents)) {
          return NextResponse.json(
            { error: 'Title, description, and involved agents are required' },
            { status: 400 },
          );
        }
        const coordinationIssue = await agentCoordination.createCoordinationIssue(
          title,
          description,
          involvedAgents,
          coordinationPriority || 1,
        );
        return NextResponse.json({ issue: coordinationIssue });

      case 'resume-workflow': {
        const state = loadState();

        // Step 1: Register agents in local state
        if (state.workflow.steps.registerAgents !== 'completed') {
          state.workflow.currentStep = 'registerAgents';
          saveState(state);
          const defaults: Array<[string, string[]]> = [
            ['Frontend Agent', ['React', 'TypeScript', 'UI/UX']],
            ['Backend Agent', ['Node.js', 'API', 'Database']],
            ['DevOps Agent', 'Deployment, CI/CD, Infrastructure'.split(', ')],
            ['QA Agent', ['Testing', 'Quality Assurance']],
          ];
          for (const [name, capabilities] of defaults) {
            if (!state.agents[name]) {
              state.agents[name] = { name, capabilities, activeTasks: [], status: 'available' };
            }
          }
          state.workflow.steps.registerAgents = 'completed';
          state.workflow.currentStep = null;
          saveState(state);
        }

        // Step 2: Create coordination issue once
        if (state.workflow.steps.createCoordinationIssue !== 'completed') {
          state.workflow.currentStep = 'createCoordinationIssue';
          saveState(state);
          const issue = await agentCoordination.createCoordinationIssue(
            'Sprint Planning - Agent Coordination',
            `This issue coordinates all agents for the current development sprint.\n\n**Sprint Goals:**\n- Complete Linear integration\n- Fix deployment issues\n- Implement agent coordination workflows\n\n**Agent Responsibilities:**\n- Frontend Agent: UI components and user experience\n- Backend Agent: API development and data management\n- DevOps Agent: Deployment and infrastructure\n- QA Agent: Testing and quality assurance\n\n**Coordination Points:**\n- Daily standups via Linear comments\n- Cross-agent dependencies tracked in sub-issues\n- Progress updates in this main coordination issue`,
            ['Frontend Agent', 'Backend Agent', 'DevOps Agent', 'QA Agent'],
            1,
          );
          state.workflow.createdCoordinationIssueId = issue.id;
          state.workflow.createdCoordinationIssueTitle = issue.title || 'Coordination Issue';
          state.workflow.createdCoordinationIssueUrl = issue.url;
          state.workflow.steps.createCoordinationIssue = 'completed';
          state.workflow.currentStep = null;
          saveState(state);
        }

        // Step 3: Create agent tasks if missing
        if (state.workflow.steps.createTasks !== 'completed') {
          state.workflow.currentStep = 'createTasks';
          saveState(state);
          const specs: Array<[string, string, string, number]> = [
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

          for (const [agentName, taskTitle, taskDescription, priority] of specs) {
            const rec = state.workflow.agentTasks[agentName];
            if (rec && rec.created) continue;
            const task = await agentCoordination.createAgentTask(
              agentName,
              taskTitle,
              taskDescription,
              priority,
              ['agent-task'],
            );
            state.workflow.agentTasks[agentName] = {
              created: true,
              issueId: task.id,
              title: task.title,
              url: task.url,
            };
          }
          state.workflow.steps.createTasks = 'completed';
          state.workflow.currentStep = null;
          saveState(state);
        }

        return NextResponse.json({ state: loadState() });
      }

      case 'reset-workflow': {
        const fresh = defaultState();
        saveState(fresh);
        return NextResponse.json({ state: fresh });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    logger.error('Linear API error', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
