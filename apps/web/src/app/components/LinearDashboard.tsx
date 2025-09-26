'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertTriangle,
  Users,
  Tag,
  Calendar,
  ExternalLink,
  Copy,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { apiClient } from '@/lib/api';

interface LinearIssue {
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
  createdAt: string;
  updatedAt: string;
  url: string;
}

interface CreateTaskForm {
  agentName: string;
  taskTitle: string;
  taskDescription: string;
  priority: number;
}

export function LinearDashboard() {
  const [activeTab, setActiveTab] = useState('issues');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<CreateTaskForm>({
    agentName: '',
    taskTitle: '',
    taskDescription: '',
    priority: 0,
  });
  const [toasts, setToasts] = useState<
    Array<{ id: number; type: 'success' | 'error' | 'info'; message: string }>
  >([]);
  const pushToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  const queryClient = useQueryClient();

  const handleRefreshIssues = () => {
    refetchIssues()
      .then(() => pushToast('Issues refreshed', 'success'))
      .catch(() => pushToast('Failed to refresh issues', 'error'));
  };

  const handleRefreshWorkflow = () => {
    refetchWorkflow()
      .then(() => pushToast('Status refreshed', 'success'))
      .catch(() => pushToast('Failed to refresh status', 'error'));
  };

  // Fetch issues
  const {
    data: issues,
    isLoading: issuesLoading,
    refetch: refetchIssues,
  } = useQuery({
    queryKey: ['linear-issues'],
    queryFn: async () => {
      const response = await apiClient.get('/linear?action=list-issues');
      return response.data.issues as LinearIssue[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch labels (commented out for now)
  const { data: labels } = useQuery({
    queryKey: ['linear-labels'],
    queryFn: async () => {
      const response = await apiClient.get('/linear?action=get-labels');
      return response.data.labels as Array<{ id: string; name: string; color: string }>;
    },
  });

  // Fetch states (commented out for now)
  const { data: states } = useQuery({
    queryKey: ['linear-states'],
    queryFn: async () => {
      const response = await apiClient.get('/linear?action=get-states');
      return response.data.states as Array<{ id: string; name: string }>;
    },
  });

  // Workflow status
  const {
    data: workflow,
    refetch: refetchWorkflow,
    isFetching: statusLoading,
  } = useQuery({
    queryKey: ['workflow-status'],
    queryFn: async () => {
      const response = await apiClient.get('/linear?action=workflow-status');
      return response.data.state as any;
    },
    refetchInterval: 30000,
  });

  // Create agent task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (formData: CreateTaskForm) => {
      const response = await apiClient.post('/linear', {
        action: 'create-agent-task',
        ...formData,
        labels: ['agent-task'],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linear-issues'] });
      setShowCreateForm(false);
      setCreateForm({
        agentName: '',
        taskTitle: '',
        taskDescription: '',
        priority: 0,
      });
      pushToast('Agent task created', 'success');
    },
    onError: (err: any) => {
      pushToast(`Failed to create task: ${err?.message || 'Unknown error'}`, 'error');
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      issueId,
      status,
      notes,
    }: {
      issueId: string;
      status: string;
      notes?: string;
    }) => {
      const response = await apiClient.post('/linear', {
        action: 'update-task-status',
        taskIssueId: issueId,
        status,
        notes,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linear-issues'] });
      pushToast('Task status updated', 'success');
    },
    onError: (err: any) => {
      pushToast(`Failed to update status: ${err?.message || 'Unknown error'}`, 'error');
    },
  });

  // Resume workflow
  const resumeWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/linear', { action: 'resume-workflow' });
      return response.data.state as any;
    },
    onSuccess: () => {
      refetchIssues();
      refetchWorkflow();
      pushToast('Workflow resumed', 'success');
    },
    onError: (err: any) => {
      pushToast(`Failed to resume: ${err?.message || 'Unknown error'}`, 'error');
    },
  });

  // Reset workflow
  const resetWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/linear', { action: 'reset-workflow' });
      return response.data.state as any;
    },
    onSuccess: () => {
      refetchWorkflow();
      pushToast('Workflow state reset', 'success');
    },
    onError: (err: any) => {
      pushToast(`Failed to reset: ${err?.message || 'Unknown error'}`, 'error');
    },
  });

  const handleCreateTask = () => {
    if (!createForm.agentName || !createForm.taskTitle || !createForm.taskDescription) {
      return;
    }
    createTaskMutation.mutate(createForm);
  };

  const handleStatusUpdate = (issueId: string, status: string) => {
    updateStatusMutation.mutate({ issueId, status });
  };

  const getStateIcon = (state: string) => {
    switch (state.toLowerCase()) {
      case 'completed':
      case 'done':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in progress':
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'blocked':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const agentTasks =
    issues?.filter((issue) => issue.labels.some((label) => label.name === 'agent-task')) || [];

  const coordinationIssues =
    issues?.filter((issue) => issue.labels.some((label) => label.name === 'coordination')) || [];

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-3 py-2 rounded shadow text-sm text-white ${
              t.type === 'success'
                ? 'bg-green-600'
                : t.type === 'error'
                  ? 'bg-red-600'
                  : 'bg-gray-800'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Linear Integration</h1>
          <p className="text-muted-foreground">
            Manage agent tasks and coordination through Linear
          </p>
          <div className="text-xs text-gray-500 mt-1">
            {labels ? `${labels.length} labels` : '...'} ·{' '}
            {states ? `${states.length} states` : '...'}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefreshIssues} disabled={issuesLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${issuesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleRefreshWorkflow} disabled={statusLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${statusLoading ? 'animate-spin' : ''}`} />
            Status
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Workflow Status */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Status</CardTitle>
          <CardDescription>Checkpointed progress for the agent workflow</CardDescription>
        </CardHeader>
        <CardContent>
          {workflow ? (
            <div className="flex items-start justify-between gap-6">
              <div className="text-sm space-y-2">
                <div>
                  Register Agents:{' '}
                  <span className="font-medium">{workflow.workflow.steps.registerAgents}</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span>
                    Coordination Issue:{' '}
                    <span className="font-medium">
                      {workflow.workflow.steps.createCoordinationIssue}
                    </span>
                    {workflow.workflow.createdCoordinationIssueId
                      ? ` (${workflow.workflow.createdCoordinationIssueId})`
                      : ''}
                    {workflow.workflow.createdCoordinationIssueTitle
                      ? ` — ${workflow.workflow.createdCoordinationIssueTitle}`
                      : ''}
                  </span>
                  {workflow.workflow.createdCoordinationIssueUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.open(workflow.workflow.createdCoordinationIssueUrl, '_blank')
                      }
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  {workflow.workflow.createdCoordinationIssueId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(workflow.workflow.createdCoordinationIssueId)
                          .then(() => pushToast('Copied coordination issue ID', 'success'))
                          .catch(() => pushToast('Copy failed', 'error'))
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div>
                  Create Tasks:{' '}
                  <span className="font-medium">{workflow.workflow.steps.createTasks}</span>
                </div>
                <div className="mt-1">
                  <div className="text-xs text-gray-500">Per-agent tasks:</div>
                  <div className="mt-1 space-y-1">
                    {Object.keys(workflow.workflow.agentTasks || {}).length > 0 ? (
                      Object.entries(workflow.workflow.agentTasks).map(([agent, rec]: any) => (
                        <div key={agent} className="flex items-center gap-2 text-xs">
                          <span className="font-medium">{agent}</span>
                          {rec.issueId && <span className="text-gray-500">{rec.issueId}</span>}
                          {rec.title && <span className="text-gray-700">— {rec.title}</span>}
                          {rec.url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(rec.url, '_blank')}
                            >
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          )}
                          {rec.issueId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                navigator.clipboard
                                  .writeText(rec.issueId)
                                  .then(() => pushToast('Copied task ID', 'success'))
                                  .catch(() => pushToast('Copy failed', 'error'))
                              }
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500">No agent tasks yet.</div>
                    )}
                  </div>
                </div>
                <div>
                  Last Updated:{' '}
                  <span className="font-mono">
                    {new Date(workflow.workflow.lastUpdated).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  onClick={() => resetWorkflowMutation.mutate()}
                  disabled={resetWorkflowMutation.isPending}
                >
                  {resetWorkflowMutation.isPending ? 'Resetting...' : 'Reset'}
                </Button>
                <Button
                  onClick={() => resumeWorkflowMutation.mutate()}
                  disabled={resumeWorkflowMutation.isPending}
                >
                  {resumeWorkflowMutation.isPending ? 'Resuming...' : 'Resume'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
        </CardContent>
      </Card>

      {/* Create Task Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Agent Task</CardTitle>
            <CardDescription>Create a new task for an agent to work on</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Agent Name</label>
                <input
                  type="text"
                  value={createForm.agentName}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, agentName: e.target.value }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Frontend Agent"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, priority: parseInt(e.target.value) }))
                  }
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value={0}>Low</option>
                  <option value={1}>High</option>
                  <option value={2}>Medium</option>
                  <option value={3}>Critical</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Task Title</label>
              <input
                type="text"
                value={createForm.taskTitle}
                onChange={(e) => setCreateForm((prev) => ({ ...prev, taskTitle: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Brief description of the task"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Task Description</label>
              <textarea
                value={createForm.taskDescription}
                onChange={(e) =>
                  setCreateForm((prev) => ({ ...prev, taskDescription: e.target.value }))
                }
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md h-24"
                placeholder="Detailed description of what needs to be done"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending}>
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="issues">All Issues</TabsTrigger>
          <TabsTrigger value="agent-tasks">Agent Tasks</TabsTrigger>
          <TabsTrigger value="coordination">Coordination</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="space-y-4">
          {issuesLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid gap-4">
              {issues?.map((issue) => (
                <Card key={issue.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{issue.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {issue.description && (
                            <div className="text-sm text-gray-600 mb-2">
                              {issue.description.length > 200
                                ? `${issue.description.substring(0, 200)}...`
                                : issue.description}
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(issue.createdAt).toLocaleDateString()}
                            </span>
                            {issue.assignee && (
                              <span className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                {issue.assignee.name}
                              </span>
                            )}
                          </div>
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(issue.priority)}>
                          Priority {issue.priority}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(issue.url, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStateIcon(issue.state)}
                        <span className="text-sm font-medium">{issue.state}</span>
                      </div>
                      <div className="flex gap-1">
                        {issue.labels.map((label) => (
                          <Badge key={label.id} variant="secondary" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {label.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="agent-tasks" className="space-y-4">
          <div className="grid gap-4">
            {agentTasks.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {issue.description && (
                          <div className="text-sm text-gray-600 mb-2">
                            {issue.description.length > 200
                              ? `${issue.description.substring(0, 200)}...`
                              : issue.description}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(issue.priority)}>
                        Priority {issue.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(issue.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStateIcon(issue.state)}
                      <span className="text-sm font-medium">{issue.state}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(issue.id, 'in-progress')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Start
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(issue.id, 'completed')}
                        disabled={updateStatusMutation.isPending}
                      >
                        Complete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="coordination" className="space-y-4">
          <div className="grid gap-4">
            {coordinationIssues.map((issue) => (
              <Card key={issue.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{issue.title}</CardTitle>
                      <CardDescription className="mt-2">
                        {issue.description && (
                          <div className="text-sm text-gray-600 mb-2">
                            {issue.description.length > 200
                              ? `${issue.description.substring(0, 200)}...`
                              : issue.description}
                          </div>
                        )}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getPriorityColor(issue.priority)}>
                        Priority {issue.priority}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(issue.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getStateIcon(issue.state)}
                      <span className="text-sm font-medium">{issue.state}</span>
                    </div>
                    <div className="flex gap-1">
                      {issue.labels.map((label) => (
                        <Badge key={label.id} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          {(() => {
            const getByLabel = (name: string) =>
              (issues || []).filter((i) => i.labels.some((l) => l.name.toLowerCase() === name));
            const opportunity = getByLabel('opportunity');
            const outreach = getByLabel('outreach');
            const negotiation = getByLabel('negotiation');
            const won = getByLabel('won');
            const lost = getByLabel('lost');
            return (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Pipeline</CardTitle>
                    <CardDescription>Counts by revenue stage (label-based)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-5 gap-4 text-center">
                      <div>
                        <div className="text-xl font-bold">{opportunity.length}</div>
                        <div className="text-xs text-gray-500">Opportunity</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{outreach.length}</div>
                        <div className="text-xs text-gray-500">Outreach</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{negotiation.length}</div>
                        <div className="text-xs text-gray-500">Negotiation</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{won.length}</div>
                        <div className="text-xs text-gray-500">Won</div>
                      </div>
                      <div>
                        <div className="text-xl font-bold">{lost.length}</div>
                        <div className="text-xs text-gray-500">Lost</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Latest Opportunities</CardTitle>
                    <CardDescription>Top 10 by priority and recency</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {opportunity
                        .slice()
                        .sort(
                          (a, b) =>
                            b.priority - a.priority ||
                            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
                        )
                        .slice(0, 10)
                        .map((issue) => (
                          <div key={issue.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(issue.priority)}>
                                P{issue.priority}
                              </Badge>
                              <span className="text-sm">{issue.title}</span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(issue.url, '_blank')}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      {opportunity.length === 0 && (
                        <div className="text-sm text-gray-500">No opportunities yet.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
