export interface LinearConfig {
  apiKey: string;
  mcpServerUrl?: string;
  teamId?: string;
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
  project?: {
    id: string;
    name: string;
  };
  labels?: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinearProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  progress: number;
  startDate?: Date;
  targetDate?: Date;
}

export interface OnaAgentTask {
  id: string;
  type: 'issue' | 'project' | 'workflow';
  linearId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  result?: any;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}
