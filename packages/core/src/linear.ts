/**
 * Linear Integration Service
 *
 * Provides integration with Linear for project management and agent coordination
 */

export interface LinearConfig {
  apiKey: string;
  teamId?: string;
  workspaceId?: string;
}

export interface LinearIssue {
  id: string;
  title: string;
  description?: string;
  state: string;
  priority: number;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
  url: string;
}

export interface CreateIssueInput {
  title: string;
  description?: string;
  priority?: number;
  assigneeId?: string;
  labelIds?: string[];
  teamId?: string;
}

export interface UpdateIssueInput {
  title?: string;
  description?: string;
  state?: string;
  priority?: number;
  assigneeId?: string;
  labelIds?: string[];
}

export class LinearService {
  private apiKey: string;
  private teamId?: string;

  constructor(config: LinearConfig) {
    this.apiKey = config.apiKey;
    this.teamId = config.teamId;
  }

  /**
   * Create a new issue in Linear using GraphQL API
   */
  async createIssue(input: CreateIssueInput): Promise<LinearIssue> {
    try {
      const mutation = `
        mutation IssueCreate($input: IssueCreateInput!) {
          issueCreate(input: $input) {
            success
            issue {
              id
              title
              description
              state {
                name
              }
              priority
              assignee {
                id
                name
                email
              }
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
              createdAt
              updatedAt
              url
            }
          }
        }
      `;

      const variables = {
        input: {
          title: input.title,
          description: input.description,
          priority: input.priority || 0,
          teamId: input.teamId || this.teamId,
          assigneeId: input.assigneeId,
          labelIds: input.labelIds,
        },
      };

      const response = await this.graphqlRequest(mutation, variables);

      if (!response.data?.issueCreate?.success || !response.data?.issueCreate?.issue) {
        throw new Error('Failed to create issue');
      }

      return this.mapIssueToInterface(response.data.issueCreate.issue);
    } catch (error) {
      console.error('Error creating Linear issue:', error);
      throw error;
    }
  }

  /**
   * Update an existing issue
   */
  async updateIssue(issueId: string, input: UpdateIssueInput): Promise<LinearIssue> {
    try {
      const mutation = `
        mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
          issueUpdate(id: $id, input: $input) {
            success
            issue {
              id
              title
              description
              state {
                name
              }
              priority
              assignee {
                id
                name
                email
              }
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
              createdAt
              updatedAt
              url
            }
          }
        }
      `;

      const variables = {
        id: issueId,
        input: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          assigneeId: input.assigneeId,
          labelIds: input.labelIds,
        },
      };

      const response = await this.graphqlRequest(mutation, variables);

      if (!response.data?.issueUpdate?.success || !response.data?.issueUpdate?.issue) {
        throw new Error('Failed to update issue');
      }

      return this.mapIssueToInterface(response.data.issueUpdate.issue);
    } catch (error) {
      console.error('Error updating Linear issue:', error);
      throw error;
    }
  }

  /**
   * Get an issue by ID
   */
  async getIssue(issueId: string): Promise<LinearIssue | null> {
    try {
      const query = `
        query Issue($id: String!) {
          issue(id: $id) {
            id
            title
            description
            state {
              name
            }
            priority
            assignee {
              id
              name
              email
            }
            labels {
              nodes {
                id
                name
                color
              }
            }
            createdAt
            updatedAt
            url
          }
        }
      `;

      const response = await this.graphqlRequest(query, { id: issueId });

      if (!response.data?.issue) {
        return null;
      }

      return this.mapIssueToInterface(response.data.issue);
    } catch (error) {
      console.error('Error fetching Linear issue:', error);
      throw error;
    }
  }

  /**
   * List issues with optional filters
   */
  async listIssues(filters?: {
    state?: string;
    assigneeId?: string;
    labelIds?: string[];
    teamId?: string;
    limit?: number;
  }): Promise<LinearIssue[]> {
    try {
      const query = `
        query Issues($filter: IssueFilter, $first: Int) {
          issues(filter: $filter, first: $first) {
            nodes {
              id
              title
              description
              state {
                name
              }
              priority
              assignee {
                id
                name
                email
              }
              labels {
                nodes {
                  id
                  name
                  color
                }
              }
              createdAt
              updatedAt
              url
            }
          }
        }
      `;

      const variables = {
        filter: {
          state: filters?.state ? { name: { eq: filters.state } } : undefined,
          assignee: filters?.assigneeId ? { id: { eq: filters.assigneeId } } : undefined,
          labels: filters?.labelIds ? { id: { in: filters.labelIds } } : undefined,
          team: filters?.teamId ? { id: { eq: filters.teamId } } : undefined,
        },
        first: filters?.limit || 50,
      };

      const response = await this.graphqlRequest(query, variables);

      if (!response.data?.issues?.nodes) {
        return [];
      }

      return response.data.issues.nodes.map((issue: any) => this.mapIssueToInterface(issue));
    } catch (error) {
      console.error('Error listing Linear issues:', error);
      throw error;
    }
  }

  /**
   * Create a label if missing
   */
  async createLabel(
    name: string,
    color?: string,
    teamId?: string,
  ): Promise<{ id: string; name: string; color: string }> {
    const mutation = `
      mutation IssueLabelCreate($input: IssueLabelCreateInput!) {
        issueLabelCreate(input: $input) {
          success
          label {
            id
            name
            color
          }
        }
      }
    `;
    const variables = {
      input: {
        name,
        color,
        teamId: teamId || this.teamId,
      },
    };
    const response = await this.graphqlRequest(mutation, variables);
    if (!response.data?.issueLabelCreate?.success || !response.data?.issueLabelCreate?.label) {
      throw new Error('Failed to create label');
    }
    return response.data.issueLabelCreate.label;
  }

  /**
   * Ensure a set of labels exist on a team
   */
  async ensureLabels(
    labels: Array<{ name: string; color?: string }>,
    teamId?: string,
  ): Promise<{ created: number; existing: number }> {
    const existing = await this.getLabels(teamId);
    const existingNames = new Set(existing.map((l) => l.name.toLowerCase()));
    let created = 0;
    for (const l of labels) {
      if (!existingNames.has(l.name.toLowerCase())) {
        await this.createLabel(l.name, l.color, teamId);
        created++;
      }
    }
    return { created, existing: existing.length };
  }

  /**
   * Get available labels for the team
   */
  async getLabels(teamId?: string): Promise<Array<{ id: string; name: string; color: string }>> {
    try {
      const query = `
        query TeamLabels($teamId: String!) {
          team(id: $teamId) {
            labels {
              nodes {
                id
                name
                color
              }
            }
          }
        }
      `;

      const response = await this.graphqlRequest(query, { teamId: teamId || this.teamId });

      if (!response.data?.team?.labels?.nodes) {
        return [];
      }

      return response.data.team.labels.nodes;
    } catch (error) {
      console.error('Error fetching Linear labels:', error);
      throw error;
    }
  }

  /**
   * Get available states for the team
   */
  async getStates(teamId?: string): Promise<Array<{ id: string; name: string; type: string }>> {
    try {
      const query = `
        query TeamStates($teamId: String!) {
          team(id: $teamId) {
            states {
              nodes {
                id
                name
                type
              }
            }
          }
        }
      `;

      const response = await this.graphqlRequest(query, { teamId: teamId || this.teamId });

      if (!response.data?.team?.states?.nodes) {
        return [];
      }

      return response.data.team.states.nodes;
    } catch (error) {
      console.error('Error fetching Linear states:', error);
      throw error;
    }
  }

  /**
   * Make GraphQL request to Linear API
   */
  private async graphqlRequest(query: string, variables: any = {}): Promise<any> {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as { errors?: Array<{ message: string }>; data?: any };

    if (data.errors) {
      throw new Error(`GraphQL errors: ${data.errors.map((e) => e.message).join(', ')}`);
    }

    return data;
  }

  /**
   * Map Linear issue to our interface
   */
  private mapIssueToInterface(issue: any): LinearIssue {
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      state: issue.state?.name || 'Unknown',
      priority: issue.priority || 0,
      assignee: issue.assignee
        ? {
            id: issue.assignee.id,
            name: issue.assignee.name,
            email: issue.assignee.email,
          }
        : undefined,
      labels:
        issue.labels?.nodes?.map((label: any) => ({
          id: label.id,
          name: label.name,
          color: label.color,
        })) || [],
      createdAt: new Date(issue.createdAt),
      updatedAt: new Date(issue.updatedAt),
      url: issue.url,
    };
  }
}

/**
 * Agent Coordination Utilities
 */
export class AgentCoordination {
  private linearService: LinearService;

  constructor(linearService: LinearService) {
    this.linearService = linearService;
  }

  /**
   * Create a task for an agent
   */
  async createAgentTask(
    agentName: string,
    taskTitle: string,
    taskDescription: string,
    priority: number = 0,
    labels: string[] = ['agent-task'],
  ): Promise<LinearIssue> {
    const title = `[${agentName}] ${taskTitle}`;
    const description = `**Agent:** ${agentName}\n\n**Task:** ${taskDescription}\n\n**Created:** ${new Date().toISOString()}`;

    return this.linearService.createIssue({
      title,
      description,
      priority,
      labelIds: labels,
    });
  }

  /**
   * Update task status
   */
  async updateTaskStatus(
    issueId: string,
    status: 'in-progress' | 'completed' | 'blocked' | 'review',
    notes?: string,
  ): Promise<LinearIssue> {
    const description = notes
      ? `**Status Update:** ${status}\n\n**Notes:** ${notes}\n\n**Updated:** ${new Date().toISOString()}`
      : undefined;

    return this.linearService.updateIssue(issueId, {
      state: status,
      description,
    });
  }

  /**
   * Get tasks for a specific agent
   */
  async getAgentTasks(_agentName: string): Promise<LinearIssue[]> {
    return this.linearService.listIssues({
      labelIds: ['agent-task'],
      limit: 100,
    });
  }

  /**
   * Create a coordination issue for multiple agents
   */
  async createCoordinationIssue(
    title: string,
    description: string,
    involvedAgents: string[],
    priority: number = 1,
  ): Promise<LinearIssue> {
    const agentList = involvedAgents.map((agent) => `- ${agent}`).join('\n');
    const fullDescription = `**Coordination Issue**\n\n**Involved Agents:**\n${agentList}\n\n**Description:**\n${description}\n\n**Created:** ${new Date().toISOString()}`;

    return this.linearService.createIssue({
      title: `[COORDINATION] ${title}`,
      description: fullDescription,
      priority,
      labelIds: ['coordination', 'multi-agent'],
    });
  }
}
