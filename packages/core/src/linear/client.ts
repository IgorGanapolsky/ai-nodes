import { LinearConfig, LinearIssue, LinearProject } from './types';

export class LinearClient {
  private config: LinearConfig;
  private baseUrl = 'https://api.linear.app/graphql';

  constructor(config: LinearConfig) {
    this.config = config;
  }

  private async graphqlRequest<T>(query: string, variables?: any): Promise<T> {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': this.config.apiKey,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Linear API Error:', data);
      throw new Error(`Linear API request failed: ${response.statusText} - ${JSON.stringify(data)}`);
    }

    if (data.errors) {
      console.error('GraphQL errors:', data.errors);
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
    }

    return data.data;
  }

  async createIssue(input: {
    title: string;
    description?: string;
    teamId?: string;
    priority?: number;
    assigneeId?: string;
    projectId?: string;
    labelIds?: string[];
  }): Promise<LinearIssue> {
    const mutation = `
      mutation CreateIssue($input: IssueCreateInput!) {
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
            project {
              id
              name
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
          }
        }
      }
    `;

    const result = await this.graphqlRequest<any>(mutation, {
      input: {
        title: input.title,
        description: input.description,
        teamId: input.teamId || this.config.teamId,
        priority: input.priority,
        assigneeId: input.assigneeId,
        projectId: input.projectId,
        labelIds: input.labelIds,
      },
    });

    return this.mapIssue(result.issueCreate.issue);
  }

  async searchIssues(query: string): Promise<LinearIssue[]> {
    const graphqlQuery = `
      query SearchIssues($filter: IssueFilter) {
        issues(filter: $filter) {
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
            project {
              id
              name
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
          }
        }
      }
    `;

    const result = await this.graphqlRequest<any>(graphqlQuery, {
      filter: {
        searchableContent: {
          contains: query,
        },
      },
    });

    return result.issues.nodes.map((issue: any) => this.mapIssue(issue));
  }

  async updateIssue(id: string, updates: Partial<LinearIssue>): Promise<LinearIssue> {
    const mutation = `
      mutation UpdateIssue($id: String!, $input: IssueUpdateInput!) {
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
            project {
              id
              name
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
          }
        }
      }
    `;

    const result = await this.graphqlRequest<any>(mutation, {
      id,
      input: {
        title: updates.title,
        description: updates.description,
        priority: updates.priority,
      },
    });

    return this.mapIssue(result.issueUpdate.issue);
  }

  async getProjects(): Promise<LinearProject[]> {
    const query = `
      query GetProjects {
        projects {
          nodes {
            id
            name
            description
            state
            progress
            startDate
            targetDate
          }
        }
      }
    `;

    const result = await this.graphqlRequest<any>(query);

    return result.projects.nodes.map((project: any) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      state: project.state,
      progress: project.progress,
      startDate: project.startDate ? new Date(project.startDate) : undefined,
      targetDate: project.targetDate ? new Date(project.targetDate) : undefined,
    }));
  }

  private mapIssue(rawIssue: any): LinearIssue {
    return {
      id: rawIssue.id,
      title: rawIssue.title,
      description: rawIssue.description,
      state: rawIssue.state?.name || 'unknown',
      priority: rawIssue.priority || 0,
      assignee: rawIssue.assignee,
      project: rawIssue.project,
      labels: rawIssue.labels?.nodes || [],
      createdAt: new Date(rawIssue.createdAt),
      updatedAt: new Date(rawIssue.updatedAt),
    };
  }
}