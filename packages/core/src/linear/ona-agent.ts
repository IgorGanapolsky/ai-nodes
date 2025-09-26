import { LinearClient } from './client';
import { LinearMCPServer } from './mcp-server';
import { LinearConfig, OnaAgentTask, LinearIssue, LinearProject } from './types';

export interface OnaAgentConfig extends LinearConfig {
  agentName?: string;
  capabilities?: string[];
  autoProcess?: boolean;
}

export class OnaLinearAgent {
  private client: LinearClient;
  private mcpServer: LinearMCPServer;
  private config: OnaAgentConfig;
  private taskQueue: OnaAgentTask[] = [];
  private isProcessing = false;

  constructor(config: OnaAgentConfig) {
    this.config = {
      ...config,
      agentName: config.agentName || 'Ona Agent',
      capabilities: config.capabilities || ['create', 'update', 'search', 'analyze'],
      autoProcess: config.autoProcess !== false,
    };

    this.client = new LinearClient(config);
    this.mcpServer = new LinearMCPServer(config);

    if (this.config.autoProcess) {
      this.startProcessing();
    }
  }

  async createTask(input: {
    title: string;
    description?: string;
    priority?: number;
    projectId?: string;
    assignToSelf?: boolean;
  }): Promise<LinearIssue> {
    const task: OnaAgentTask = {
      id: this.generateTaskId(),
      type: 'issue',
      linearId: '',
      status: 'in_progress',
      createdAt: new Date(),
    };

    this.taskQueue.push(task);

    try {
      const issue = await this.client.createIssue({
        title: `[${this.config.agentName}] ${input.title}`,
        description: this.formatDescription(input.description),
        priority: input.priority,
        projectId: input.projectId,
      });

      task.linearId = issue.id;
      task.status = 'completed';
      task.result = issue;
      task.completedAt = new Date();

      return issue;
    } catch (error) {
      task.status = 'failed';
      task.error = error instanceof Error ? error.message : 'Unknown error';
      throw error;
    }
  }

  async searchAndAnalyze(query: string): Promise<{
    issues: LinearIssue[];
    analysis: {
      totalCount: number;
      byState: Record<string, number>;
      byPriority: Record<number, number>;
      avgAge: number;
    };
  }> {
    const issues = await this.client.searchIssues(query);

    const analysis = {
      totalCount: issues.length,
      byState: {} as Record<string, number>,
      byPriority: {} as Record<number, number>,
      avgAge: 0,
    };

    let totalAge = 0;

    for (const issue of issues) {
      // Count by state
      analysis.byState[issue.state] = (analysis.byState[issue.state] || 0) + 1;

      // Count by priority
      analysis.byPriority[issue.priority] = (analysis.byPriority[issue.priority] || 0) + 1;

      // Calculate age
      const age = Date.now() - issue.createdAt.getTime();
      totalAge += age;
    }

    analysis.avgAge = issues.length > 0 ? totalAge / issues.length / (1000 * 60 * 60 * 24) : 0; // in days

    return { issues, analysis };
  }

  async processWorkflow(workflow: {
    name: string;
    steps: Array<{
      action: 'create' | 'update' | 'search';
      params: any;
    }>;
  }): Promise<any[]> {
    const results: any[] = [];

    for (const step of workflow.steps) {
      try {
        let result;

        switch (step.action) {
          case 'create':
            result = await this.createTask(step.params);
            break;
          case 'update':
            result = await this.client.updateIssue(step.params.id, step.params.updates);
            break;
          case 'search':
            result = await this.searchAndAnalyze(step.params.query);
            break;
          default:
            throw new Error(`Unknown workflow action: ${step.action}`);
        }

        results.push({
          success: true,
          action: step.action,
          result,
        });
      } catch (error) {
        results.push({
          success: false,
          action: step.action,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  async getProjects(): Promise<LinearProject[]> {
    return this.client.getProjects();
  }

  async sendMCPCommand(command: string, params?: any): Promise<any> {
    return this.mcpServer.sendCommand(command, params);
  }

  private startProcessing(): void {
    setInterval(() => {
      if (!this.isProcessing && this.taskQueue.length > 0) {
        this.processTasks();
      }
    }, 5000);
  }

  private async processTasks(): Promise<void> {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    const pendingTasks = this.taskQueue.filter((t) => t.status === 'pending');

    for (const task of pendingTasks) {
      console.log(`Processing task ${task.id}...`);
      // Process task logic here
      task.status = 'in_progress';
    }

    this.isProcessing = false;
  }

  private generateTaskId(): string {
    return `ona-task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private formatDescription(description?: string): string {
    const metadata = [
      `Agent: ${this.config.agentName}`,
      `Capabilities: ${this.config.capabilities?.join(', ')}`,
      `Timestamp: ${new Date().toISOString()}`,
    ];

    const formattedDescription = description || 'No description provided';

    return `${formattedDescription}

---
${metadata.join('\\n')}`;
  }

  disconnect(): void {
    this.mcpServer.disconnect();
  }
}
