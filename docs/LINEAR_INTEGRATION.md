# Linear Integration for Agent Coordination

## Overview

This project now includes comprehensive Linear integration for coordinating multiple AI agents working on the DePIN Autopilot project. The integration provides a centralized task management system where agents can create, assign, and track tasks.

## Features

### 🎯 **Agent Coordination**
- **Task Creation**: Create specific tasks for individual agents
- **Multi-Agent Coordination**: Coordinate work between multiple agents
- **Status Tracking**: Track task progress and completion
- **Priority Management**: Set task priorities and deadlines

### 📊 **Dashboard Integration**
- **Real-time Updates**: Live task status updates
- **Filtering**: Filter tasks by agent, status, and priority
- **Task Management**: Create, update, and complete tasks
- **Linear Integration**: Direct links to Linear issues

### 🔧 **API Integration**
- **Linear SDK**: Full integration with Linear API
- **RESTful Endpoints**: API routes for task management
- **Type Safety**: Comprehensive TypeScript types
- **Error Handling**: Robust error handling and logging

## Setup Instructions

### 1. Linear API Configuration

1. **Get Linear API Key**:
   - Go to Linear Settings → API
   - Create a new personal API key
   - Copy the API key

2. **Get Team ID**:
   - Go to your Linear workspace
   - Copy the team ID from the URL or settings

3. **Environment Variables**:
   ```bash
   # Add to .env
   LINEAR_API_KEY="your_linear_api_key_here"
   LINEAR_TEAM_ID="your_linear_team_id_here"
   ```

### 2. Install Dependencies

```bash
# Linear SDK is already installed
pnpm add @linear/sdk
```

### 3. Access the Dashboard

Navigate to `/linear` in your web application to access the Linear dashboard.

## Usage Guide

### Agent Coordination Script

The `scripts/linear-agent-coordination.js` script provides command-line tools for agent coordination:

```bash
# Register a new agent
node scripts/linear-agent-coordination.js register "Frontend Agent" React TypeScript UI

# Create a task for an agent
node scripts/linear-agent-coordination.js create-task "Frontend Agent" "Fix bug" "Fix the login bug" 1

# Create a coordination issue
node scripts/linear-agent-coordination.js create-coordination "Sprint Planning" "Plan next sprint" "Frontend Agent" "Backend Agent"

# Update task status
node scripts/linear-agent-coordination.js update-status "task-id" "completed" "Task completed successfully"

# List tasks for an agent
node scripts/linear-agent-coordination.js list-tasks "Frontend Agent"

# List all agents
node scripts/linear-agent-coordination.js list-agents

# Create a complete development workflow
node scripts/linear-agent-coordination.js create-workflow
```

### Web Dashboard

The Linear dashboard provides a user-friendly interface for:

1. **Viewing All Issues**: See all Linear issues in one place
2. **Agent Tasks**: Filter and manage agent-specific tasks
3. **Coordination Issues**: Manage multi-agent coordination
4. **Creating Tasks**: Create new tasks for agents
5. **Status Updates**: Update task status and add notes

### API Endpoints

The Linear API provides the following endpoints:

#### GET Endpoints
- `/api/linear?action=get-issue&issueId=<id>` - Get specific issue
- `/api/linear?action=list-issues` - List all issues
- `/api/linear?action=get-agent-tasks&agentName=<name>` - Get agent tasks
- `/api/linear?action=get-labels` - Get available labels
- `/api/linear?action=get-states` - Get available states

#### POST Endpoints
- `/api/linear` with action `create-issue` - Create new issue
- `/api/linear` with action `update-issue` - Update existing issue
- `/api/linear` with action `create-agent-task` - Create agent task
- `/api/linear` with action `update-task-status` - Update task status
- `/api/linear` with action `create-coordination-issue` - Create coordination issue

## Agent Workflow Examples

### 1. Frontend Development Workflow

```bash
# Register frontend agent
node scripts/linear-agent-coordination.js register "Frontend Agent" React TypeScript UI

# Create UI task
node scripts/linear-agent-coordination.js create-task "Frontend Agent" "Create Dashboard Component" "Create a comprehensive dashboard component with real-time updates" 1

# Update status when started
node scripts/linear-agent-coordination.js update-status "task-id" "in-progress" "Started working on the dashboard component"
```

### 2. Backend Development Workflow

```bash
# Register backend agent
node scripts/linear-agent-coordination.js register "Backend Agent" Node.js API Database

# Create API task
node scripts/linear-agent-coordination.js create-task "Backend Agent" "Implement API Endpoints" "Create RESTful API endpoints for data management" 1
```

### 3. Multi-Agent Coordination

```bash
# Create coordination issue
node scripts/linear-agent-coordination.js create-coordination "Feature Implementation" "Implement new feature requiring frontend and backend work" "Frontend Agent" "Backend Agent"
```

## Best Practices

### 1. Agent Registration
- Use descriptive agent names
- Include relevant capabilities
- Keep agent list updated

### 2. Task Creation
- Use clear, actionable task titles
- Provide detailed descriptions
- Set appropriate priorities
- Assign to correct agents

### 3. Status Updates
- Update status regularly
- Add meaningful notes
- Use consistent status names
- Track dependencies

### 4. Coordination
- Create coordination issues for complex features
- Involve all relevant agents
- Document decisions and progress
- Use comments for communication

## Troubleshooting

### Common Issues

1. **API Key Issues**:
   - Verify LINEAR_API_KEY is set correctly
   - Check Linear API key permissions
   - Ensure team ID is correct

2. **Authentication Errors**:
   - Verify API key is valid
   - Check team access permissions
   - Ensure proper environment variables

3. **Task Creation Failures**:
   - Check required fields
   - Verify agent exists
   - Ensure proper permissions

### Debug Commands

```bash
# Test Linear connection
node -e "
import { LinearService } from '@depinautopilot/core/linear';
const service = new LinearService({ apiKey: process.env.LINEAR_API_KEY });
service.getTeam().then(team => console.log('Team:', team.name)).catch(console.error);
"

# List available teams
node -e "
import { LinearClient } from '@linear/sdk';
const client = new LinearClient({ apiKey: process.env.LINEAR_API_KEY });
client.teams().then(teams => teams.nodes.forEach(t => console.log(t.name, t.id))).catch(console.error);
"
```

## Integration Benefits

### For Development Teams
- **Centralized Task Management**: All tasks in one place
- **Clear Accountability**: Know who's responsible for what
- **Progress Tracking**: Monitor development progress
- **Coordination**: Better collaboration between team members

### For AI Agents
- **Task Assignment**: Clear tasks for each agent
- **Status Communication**: Agents can communicate progress
- **Dependency Management**: Track task dependencies
- **Workload Distribution**: Balance work across agents

### For Project Management
- **Visibility**: See all work in progress
- **Planning**: Better sprint and release planning
- **Reporting**: Generate progress reports
- **Quality Control**: Track completion and quality

## Future Enhancements

### Planned Features
1. **Automated Task Creation**: Create tasks from code changes
2. **Agent Communication**: Direct agent-to-agent communication
3. **Performance Metrics**: Track agent productivity
4. **Integration Hooks**: Connect with CI/CD pipelines
5. **Advanced Filtering**: More sophisticated task filtering
6. **Notifications**: Real-time notifications for task updates

### Customization Options
1. **Custom Labels**: Create project-specific labels
2. **Workflow Templates**: Predefined workflow templates
3. **Agent Profiles**: Detailed agent capability profiles
4. **Reporting**: Custom reporting and analytics

---

*Last Updated: September 26, 2025*
*Integration Status: ✅ Complete and Ready for Use*