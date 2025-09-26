import { LinearConfig } from './types';

export interface MCPServerConfig {
  endpoint: string;
  apiKey: string;
  autoConnect?: boolean;
}

// Check if we're in a browser or Node environment
const isNode = typeof window === 'undefined';

export class LinearMCPServer {
  private config: MCPServerConfig;
  private eventSource: any = null;

  constructor(config: LinearConfig) {
    this.config = {
      endpoint: config.mcpServerUrl || 'https://mcp.linear.app/sse',
      apiKey: config.apiKey,
      autoConnect: true,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  async connect(): Promise<void> {
    if (this.eventSource) {
      this.disconnect();
    }

    // In Node.js environment, we need to use a different approach
    // For now, we'll use polling or webhooks instead of SSE
    if (isNode) {
      console.log('Linear MCP server: Using polling mode for Node.js environment');
      // Implementation would use polling or webhooks
      return;
    }

    // Browser environment - use EventSource
    if (typeof EventSource !== 'undefined') {
      const url = new URL(this.config.endpoint);
      url.searchParams.append('api_key', this.config.apiKey);

      this.eventSource = new EventSource(url.toString());

      this.eventSource.onopen = () => {
        console.log('Connected to Linear MCP server');
      };

      this.eventSource.onmessage = (event: any) => {
        this.handleMessage(event.data);
      };

      this.eventSource.onerror = (error: any) => {
        console.error('Linear MCP server error:', error);
        this.reconnect();
      };
    }
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      console.log('Received MCP message:', message);

      // Handle different message types from Linear MCP server
      switch (message.type) {
        case 'issue.created':
        case 'issue.updated':
        case 'issue.deleted':
          this.handleIssueEvent(message);
          break;
        case 'project.updated':
          this.handleProjectEvent(message);
          break;
        default:
          console.log('Unhandled message type:', message.type);
      }
    } catch (error) {
      console.error('Failed to parse MCP message:', error);
    }
  }

  private handleIssueEvent(message: any): void {
    // Process issue events from Linear
    console.log('Issue event:', message);
  }

  private handleProjectEvent(message: any): void {
    // Process project events from Linear
    console.log('Project event:', message);
  }

  private reconnect(): void {
    setTimeout(() => {
      console.log('Attempting to reconnect to Linear MCP server...');
      this.connect();
    }, 5000);
  }

  async sendCommand(command: string, params?: any): Promise<any> {
    // Send commands to Linear MCP server
    const response = await fetch(this.config.endpoint.replace('/sse', '/command'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify({
        command,
        params,
      }),
    });

    if (!response.ok) {
      throw new Error(`MCP command failed: ${response.statusText}`);
    }

    return response.json();
  }
}