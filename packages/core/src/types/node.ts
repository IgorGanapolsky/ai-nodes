import { z } from 'zod';

// Node status enum
export const NodeStatus = z.enum(['online', 'offline', 'maintenance', 'error']);
export type NodeStatus = z.infer<typeof NodeStatus>;

// Node types for different DePIN networks
export const NodeType = z.enum([
  'helium',
  'filecoin',
  'storj',
  'theta',
  'akash',
  'render',
  'flux',
  'hivemapper',
  'other',
]);
export type NodeType = z.infer<typeof NodeType>;

// Node metrics schema
export const NodeMetrics = z.object({
  uptime: z.number().min(0).max(100),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  storage: z.number().min(0).max(100),
  earnings: z.number().min(0),
  networkLatency: z.number().min(0).optional(),
  lastReward: z.date().optional(),
  totalRewards: z.number().min(0).optional(),
});
export type NodeMetrics = z.infer<typeof NodeMetrics>;

// Node credentials for API access
export const NodeCredentials = z.object({
  apiKey: z.string().optional(),
  apiSecret: z.string().optional(),
  wallet: z.string().optional(),
  nodeId: z.string().optional(),
  additionalConfig: z.record(z.string(), z.any()).optional(),
});
export type NodeCredentials = z.infer<typeof NodeCredentials>;

// Main Node schema
export const Node = z.object({
  id: z.string(),
  name: z.string().min(1, 'Node name is required'),
  type: NodeType,
  status: NodeStatus,
  endpoint: z.string().url('Must be a valid URL'),
  region: z.string(),
  version: z.string(),
  lastSeen: z.date(),
  createdAt: z.date(),
  updatedAt: z.date(),
  metrics: NodeMetrics,
  credentials: NodeCredentials.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});
export type Node = z.infer<typeof Node>;

// Create node input schema
export const CreateNodeInput = z.object({
  name: z.string().min(1, 'Node name is required'),
  type: NodeType,
  endpoint: z.string().url('Must be a valid URL'),
  region: z.string(),
  credentials: NodeCredentials.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});
export type CreateNodeInput = z.infer<typeof CreateNodeInput>;

// Update node input schema
export const UpdateNodeInput = z.object({
  name: z.string().min(1).optional(),
  endpoint: z.string().url().optional(),
  region: z.string().optional(),
  status: NodeStatus.optional(),
  credentials: NodeCredentials.optional(),
  tags: z.array(z.string()).optional(),
  description: z.string().optional(),
});
export type UpdateNodeInput = z.infer<typeof UpdateNodeInput>;

// Node query filters
export const NodeFilters = z.object({
  status: NodeStatus.optional(),
  type: NodeType.optional(),
  region: z.string().optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  limit: z.number().min(1).max(100).default(10),
  offset: z.number().min(0).default(0),
});
export type NodeFilters = z.infer<typeof NodeFilters>;
