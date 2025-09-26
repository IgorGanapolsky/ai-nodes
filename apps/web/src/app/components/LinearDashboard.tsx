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
  ExternalLink
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

  const queryClient = useQueryClient();

  // Fetch issues
  const { data: issues, isLoading: issuesLoading, refetch: refetchIssues } = useQuery({
    queryKey: ['linear-issues'],
    queryFn: async () => {
      const response = await apiClient.get('/linear?action=list-issues');
      return response.data.issues as LinearIssue[];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch labels (commented out for now)
  // const { data: labels } = useQuery({
  //   queryKey: ['linear-labels'],
  //   queryFn: async () => {
  //     const response = await apiClient.get('/linear?action=get-labels');
  //     return response.data.labels;
  //   },
  // });

  // Fetch states (commented out for now)
  // const { data: states } = useQuery({
  //   queryKey: ['linear-states'],
  //   queryFn: async () => {
  //     const response = await apiClient.get('/linear?action=get-states');
  //     return response.data.states;
  //   },
  // });

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
    },
  });

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ issueId, status, notes }: { issueId: string; status: string; notes?: string }) => {
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

  const agentTasks = issues?.filter(issue => 
    issue.labels.some(label => label.name === 'agent-task')
  ) || [];

  const coordinationIssues = issues?.filter(issue => 
    issue.labels.some(label => label.name === 'coordination')
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Linear Integration</h1>
          <p className="text-muted-foreground">
            Manage agent tasks and coordination through Linear
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetchIssues()}
            disabled={issuesLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${issuesLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Agent Task</CardTitle>
            <CardDescription>
              Create a new task for an agent to work on
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Agent Name</label>
                <input
                  type="text"
                  value={createForm.agentName}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, agentName: e.target.value }))}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Frontend Agent"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Priority</label>
                <select
                  value={createForm.priority}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, priority: parseInt(e.target.value) }))}
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
                onChange={(e) => setCreateForm(prev => ({ ...prev, taskTitle: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Brief description of the task"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Task Description</label>
              <textarea
                value={createForm.taskDescription}
                onChange={(e) => setCreateForm(prev => ({ ...prev, taskDescription: e.target.value }))}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md h-24"
                placeholder="Detailed description of what needs to be done"
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
              >
                {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
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
                                : issue.description
                              }
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
                              : issue.description
                            }
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
                              : issue.description
                            }
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
      </Tabs>
    </div>
  );
}