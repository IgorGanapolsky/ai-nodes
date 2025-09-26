import { NextRequest, NextResponse } from 'next/server';
import { LinearService, AgentCoordination, CreateIssueInput } from '@depinautopilot/core';

// Initialize Linear service
const linearService = new LinearService({
  apiKey: process.env.LINEAR_API_KEY || '',
  teamId: process.env.LINEAR_TEAM_ID,
});

const agentCoordination = new AgentCoordination(linearService);

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

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Linear API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
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
          return NextResponse.json({ error: 'Agent name, task title, and description are required' }, { status: 400 });
        }
        const agentTask = await agentCoordination.createAgentTask(
          agentName,
          taskTitle,
          taskDescription,
          taskPriority || 0,
          labels || ['agent-task']
        );
        return NextResponse.json({ issue: agentTask });

      case 'update-task-status':
        const { taskIssueId, status, notes } = body;
        if (!taskIssueId || !status) {
          return NextResponse.json({ error: 'Task issue ID and status are required' }, { status: 400 });
        }
        const statusUpdate = await agentCoordination.updateTaskStatus(taskIssueId, status, notes);
        return NextResponse.json({ issue: statusUpdate });

      case 'create-coordination-issue':
        const { title, description, involvedAgents, priority: coordinationPriority } = body;
        if (!title || !description || !involvedAgents || !Array.isArray(involvedAgents)) {
          return NextResponse.json({ error: 'Title, description, and involved agents are required' }, { status: 400 });
        }
        const coordinationIssue = await agentCoordination.createCoordinationIssue(
          title,
          description,
          involvedAgents,
          coordinationPriority || 1
        );
        return NextResponse.json({ issue: coordinationIssue });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Linear API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}