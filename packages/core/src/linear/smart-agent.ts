import { OnaLinearAgent, OnaAgentConfig } from './ona-agent';
import { LinearIssue } from './types';

export interface SmartAgentConfig extends OnaAgentConfig {
  autoLabeling?: boolean;
  autoPriority?: boolean;
}

export class SmartLinearAgent extends OnaLinearAgent {
  private labelMap: Map<string, string> = new Map();

  constructor(config: SmartAgentConfig) {
    super({
      ...config,
      agentName: config.agentName || 'Smart Linear Agent',
      capabilities: [...(config.capabilities || []), 'auto-label', 'auto-prioritize'],
    });

    // Initialize label mappings
    this.initializeLabelMappings();
  }

  private initializeLabelMappings() {
    // Keywords to label mappings
    this.labelMap.set('vercel', 'Vercel');
    this.labelMap.set('deployment', 'CI/CD');
    this.labelMap.set('build', 'CI/CD');
    this.labelMap.set('pipeline', 'CI/CD');
    this.labelMap.set('performance', 'Performance');
    this.labelMap.set('slow', 'Performance');
    this.labelMap.set('security', 'Security');
    this.labelMap.set('vulnerability', 'Security');
    this.labelMap.set('database', 'Database');
    this.labelMap.set('db', 'Database');
    this.labelMap.set('frontend', 'Frontend');
    this.labelMap.set('ui', 'Frontend');
    this.labelMap.set('backend', 'Backend');
    this.labelMap.set('api', 'Backend');
    this.labelMap.set('mobile', 'Mobile');
    this.labelMap.set('cli', 'CLI');
    this.labelMap.set('node', 'Node Management');
    this.labelMap.set('revenue', 'Revenue');
    this.labelMap.set('connector', 'Connector');
    this.labelMap.set('linear', 'Linear Integration');
    this.labelMap.set('ona', 'Ona Agent');
  }

  async createSmartTask(input: {
    title: string;
    description?: string;
    autoLabel?: boolean;
    autoPriority?: boolean;
  }): Promise<LinearIssue> {
    const labels: string[] = ['Automated', 'Ona Agent'];
    let priority = 3; // Default medium priority

    // Auto-detect labels from title and description
    if (input.autoLabel !== false) {
      const text = `${input.title} ${input.description || ''}`.toLowerCase();

      for (const [keyword, label] of this.labelMap.entries()) {
        if (text.includes(keyword)) {
          labels.push(label);
        }
      }

      // Detect priority based on keywords
      if (text.includes('critical') || text.includes('urgent') || text.includes('production')) {
        labels.push('Critical');
        priority = 1;
      } else if (text.includes('high') || text.includes('important')) {
        labels.push('High Priority');
        priority = 2;
      } else if (text.includes('low') || text.includes('minor')) {
        labels.push('Low Priority');
        priority = 4;
      }

      // Detect issue type
      if (text.includes('bug') || text.includes('error') || text.includes('fix')) {
        labels.push('Bug');
      } else if (text.includes('feature') || text.includes('add') || text.includes('new')) {
        labels.push('Feature');
      } else if (text.includes('improve') || text.includes('enhance') || text.includes('optimize')) {
        labels.push('Improvement');
      }

      // Detect status
      if (text.includes('blocked')) {
        labels.push('Blocked');
      }
    }

    // Get unique labels
    const uniqueLabels = [...new Set(labels)];

    // Create the issue with smart labels
    return this.createTask({
      ...input,
      priority: input.autoPriority !== false ? priority : undefined,
      // Labels will be added through Linear API label IDs
      // This would need label ID lookup in production
    });
  }

  async analyzeVercelDeployment(deploymentInfo: {
    deploymentId: string;
    projectName: string;
    error?: string;
    branch?: string;
  }): Promise<LinearIssue> {
    const title = `Vercel Deployment Failed: ${deploymentInfo.projectName}`;
    const description = `
## Deployment Failure

**Deployment ID**: ${deploymentInfo.deploymentId}
**Project**: ${deploymentInfo.projectName}
**Branch**: ${deploymentInfo.branch || 'main'}

### Error Details
\`\`\`
${deploymentInfo.error || 'Unknown error'}
\`\`\`

### Automated Analysis
This issue was automatically created by Ona Agent monitoring Vercel deployments.

**Suggested Actions**:
1. Check build logs for detailed error messages
2. Verify dependencies are correctly installed
3. Ensure environment variables are set
4. Check for TypeScript/ESLint errors
`;

    return this.createSmartTask({
      title,
      description,
      autoLabel: true,
      autoPriority: true,
    });
  }

  async createCICDWorkflow(projectName: string): Promise<any> {
    return this.processWorkflow({
      name: 'CI/CD Recovery Workflow',
      steps: [
        {
          action: 'create',
          params: {
            title: `[${projectName}] Investigate build failures`,
            description: 'Analyze recent build logs and identify root causes',
            priority: 1,
          },
        },
        {
          action: 'create',
          params: {
            title: `[${projectName}] Fix dependency issues`,
            description: 'Update package.json and lockfiles',
            priority: 1,
          },
        },
        {
          action: 'create',
          params: {
            title: `[${projectName}] Update CI configuration`,
            description: 'Update vercel.json or CI/CD configuration files',
            priority: 2,
          },
        },
        {
          action: 'create',
          params: {
            title: `[${projectName}] Test deployment`,
            description: 'Verify deployment succeeds in staging environment',
            priority: 2,
          },
        },
        {
          action: 'create',
          params: {
            title: `[${projectName}] Monitor production`,
            description: 'Monitor production deployment for 24 hours',
            priority: 3,
          },
        },
      ],
    });
  }

  async triageIssues(): Promise<void> {
    // Search for untriaged issues
    const results = await this.searchAndAnalyze('is:open -has:label');

    console.log(`Found ${results.issues.length} untriaged issues`);

    for (const issue of results.issues) {
      // Auto-apply labels based on content
      const labels: string[] = [];
      const text = `${issue.title} ${issue.description || ''}`.toLowerCase();

      for (const [keyword, label] of this.labelMap.entries()) {
        if (text.includes(keyword)) {
          labels.push(label);
        }
      }

      if (labels.length > 0) {
        console.log(`  Applying labels to "${issue.title}": ${labels.join(', ')}`);
        // In production, this would update the issue with labels
      }
    }
  }
}

// Export for use in automation scripts
export default SmartLinearAgent;
