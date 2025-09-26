import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';

// Validation schemas
const repriceRequestSchema = z.object({
  deviceIds: z.array(z.string()).optional(), // If not provided, reprice all devices
  strategy: z
    .enum(['market_based', 'utilization_based', 'competitive', 'fixed_percentage'])
    .default('market_based'),
  parameters: z
    .object({
      // For market_based strategy
      marketMultiplier: z.number().min(0.5).max(2.0).optional(),

      // For utilization_based strategy
      lowUtilizationThreshold: z.number().min(0).max(100).optional(),
      highUtilizationThreshold: z.number().min(0).max(100).optional(),
      utilizationMultiplier: z.number().min(0.8).max(1.5).optional(),

      // For competitive strategy
      competitorOffset: z.number().optional(), // +/- percentage vs competitors

      // For fixed_percentage strategy
      percentageChange: z.number().min(-50).max(100).optional(),

      // Global constraints
      minPrice: z.number().min(0).optional(),
      maxPrice: z.number().min(0).optional(),
    })
    .optional(),
  scheduledFor: z.string().optional(), // ISO timestamp for scheduled repricing
  dryRun: z.boolean().default(false), // Preview changes without applying
});

const repriceResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['queued', 'processing', 'completed', 'failed']),
  strategy: z.string(),
  devicesAffected: z.number(),
  estimatedCompletion: z.string(),
  changes: z.array(
    z.object({
      deviceId: z.string(),
      deviceName: z.string(),
      currentPrice: z.number(),
      newPrice: z.number(),
      changePercentage: z.number(),
      reason: z.string(),
    }),
  ),
  summary: z.object({
    totalDevices: z.number(),
    priceIncreases: z.number(),
    priceDecreases: z.number(),
    noChange: z.number(),
    averageChange: z.number(), // percentage
  }),
});

const maintenanceRequestSchema = z.object({
  deviceIds: z.array(z.string()),
  action: z.enum(['start_maintenance', 'end_maintenance', 'restart', 'update_software']),
  scheduledFor: z.string().optional(),
  estimatedDuration: z.number().optional(), // minutes
  reason: z.string().optional(),
  notifyUsers: z.boolean().default(true),
});

const optimizationRequestSchema = z.object({
  deviceIds: z.array(z.string()).optional(),
  optimizationType: z.enum(['performance', 'efficiency', 'cost']).default('performance'),
  parameters: z
    .object({
      targetUtilization: z.number().min(0).max(100).optional(),
      powerBudget: z.number().optional(), // watts
      thermalLimit: z.number().optional(), // celsius
    })
    .optional(),
});

type RepriceRequest = z.infer<typeof repriceRequestSchema>;
type RepriceResponse = z.infer<typeof repriceResponseSchema>;
type MaintenanceRequest = z.infer<typeof maintenanceRequestSchema>;
type OptimizationRequest = z.infer<typeof optimizationRequestSchema>;

const actionRoutes: FastifyPluginCallback = async (fastify) => {
  // POST /actions/reprice - Dynamic pricing adjustment
  fastify.post<{
    Body: RepriceRequest;
  }>(
    '/reprice',
    {
      schema: {
        body: repriceRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const { deviceIds, strategy, parameters, scheduledFor, dryRun } = request.body;

        // Generate a job ID for tracking
        const jobId = `reprice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // TODO: Replace with actual repricing logic
        const mockChanges = [
          {
            deviceId: '1',
            deviceName: 'GPU Rig Alpha',
            currentPrice: 2.5,
            newPrice: 2.75,
            changePercentage: 10,
            reason: 'High utilization detected (89%) - market demand increase',
          },
          {
            deviceId: '2',
            deviceName: 'Storage Node Beta',
            currentPrice: 0.15,
            newPrice: 0.14,
            changePercentage: -6.7,
            reason: 'Low utilization (65%) - competitive adjustment',
          },
          {
            deviceId: '3',
            deviceName: 'CPU Farm Gamma',
            currentPrice: 1.2,
            newPrice: 1.2,
            changePercentage: 0,
            reason: 'Optimal pricing maintained - balanced utilization',
          },
        ];

        const response: RepriceResponse = {
          jobId,
          status: dryRun ? 'completed' : 'queued',
          strategy,
          devicesAffected: deviceIds?.length || mockChanges.length,
          estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
          changes: mockChanges,
          summary: {
            totalDevices: mockChanges.length,
            priceIncreases: mockChanges.filter((c) => c.changePercentage > 0).length,
            priceDecreases: mockChanges.filter((c) => c.changePercentage < 0).length,
            noChange: mockChanges.filter((c) => c.changePercentage === 0).length,
            averageChange:
              mockChanges.reduce((sum, c) => sum + c.changePercentage, 0) / mockChanges.length,
          },
        };

        if (!dryRun && !scheduledFor) {
          // TODO: Queue the repricing job for immediate execution
          fastify.log.info('Queued repricing job:', {
            jobId,
            strategy,
            devicesAffected: response.devicesAffected,
          });
        } else if (scheduledFor) {
          // TODO: Schedule the repricing job for later execution
          fastify.log.info('Scheduled repricing job:', { jobId, scheduledFor });
        }

        return reply.status(202).send(response); // 202 Accepted for async operation
      } catch (error) {
        fastify.log.error('Error processing reprice request:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to process repricing request',
        });
      }
    },
  );

  // POST /actions/maintenance - Device maintenance operations
  fastify.post<{
    Body: MaintenanceRequest;
  }>(
    '/maintenance',
    {
      schema: {
        body: maintenanceRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const { deviceIds, action, scheduledFor, estimatedDuration, reason, notifyUsers } =
          request.body;

        // Generate a job ID for tracking
        const jobId = `maintenance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // TODO: Replace with actual maintenance logic
        const response = {
          jobId,
          status: 'queued',
          action,
          devicesAffected: deviceIds.length,
          scheduledFor: scheduledFor || new Date().toISOString(),
          estimatedDuration: estimatedDuration || 30, // default 30 minutes
          reason: reason || `Scheduled ${action.replace('_', ' ')}`,
          notificationsQueued: notifyUsers ? deviceIds.length : 0,
          devices: deviceIds.map((id) => ({
            deviceId: id,
            currentStatus: 'online',
            targetStatus: action.includes('maintenance') ? 'maintenance' : 'online',
          })),
        };

        fastify.log.info('Queued maintenance job:', {
          jobId,
          action,
          devicesAffected: deviceIds.length,
          scheduledFor: response.scheduledFor,
        });

        return reply.status(202).send(response);
      } catch (error) {
        fastify.log.error('Error processing maintenance request:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to process maintenance request',
        });
      }
    },
  );

  // POST /actions/optimize - Performance optimization
  fastify.post<{
    Body: OptimizationRequest;
  }>(
    '/optimize',
    {
      schema: {
        body: optimizationRequestSchema,
      },
    },
    async (request, reply) => {
      try {
        const { deviceIds, optimizationType, parameters } = request.body;

        // Generate a job ID for tracking
        const jobId = `optimize_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // TODO: Replace with actual optimization logic
        const response = {
          jobId,
          status: 'queued',
          optimizationType,
          devicesAffected: deviceIds?.length || 10,
          estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
          parameters,
          changes: [
            {
              deviceId: '1',
              parameter: 'GPU Clock Speed',
              currentValue: '1900 MHz',
              newValue: '2100 MHz',
              expectedImprovement: '12% performance increase',
            },
            {
              deviceId: '2',
              parameter: 'Power Limit',
              currentValue: '150W',
              newValue: '130W',
              expectedImprovement: '8% efficiency improvement',
            },
          ],
        };

        fastify.log.info('Queued optimization job:', {
          jobId,
          optimizationType,
          devicesAffected: response.devicesAffected,
        });

        return reply.status(202).send(response);
      } catch (error) {
        fastify.log.error('Error processing optimization request:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to process optimization request',
        });
      }
    },
  );

  // GET /actions/jobs/:jobId - Get job status
  fastify.get<{
    Params: { jobId: string };
  }>('/jobs/:jobId', async (request, reply) => {
    try {
      const { jobId } = request.params;

      // TODO: Replace with actual job status lookup
      const jobStatus = {
        jobId,
        status: 'completed',
        type: jobId.includes('reprice')
          ? 'repricing'
          : jobId.includes('maintenance')
            ? 'maintenance'
            : 'optimization',
        createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
        startedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(), // 8 minutes ago
        completedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 minutes ago
        progress: 100,
        result: {
          success: true,
          devicesProcessed: 3,
          errors: [],
        },
      };

      return reply.send(jobStatus);
    } catch (error) {
      fastify.log.error(`Error fetching job status for ${request.params.jobId}:`, error);
      return reply.status(404).send({
        error: 'Not found',
        message: 'Job not found',
      });
    }
  });

  // GET /actions/jobs - List all jobs
  fastify.get<{
    Querystring: {
      status?: 'queued' | 'processing' | 'completed' | 'failed';
      type?: 'repricing' | 'maintenance' | 'optimization';
      limit?: number;
      page?: number;
    };
  }>('/jobs', async (request, reply) => {
    try {
      const { status, type, limit = 10, page = 1 } = request.query;

      // TODO: Replace with actual job listing logic
      const mockJobs = [
        {
          jobId: 'reprice_123',
          type: 'repricing',
          status: 'completed',
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          devicesAffected: 5,
        },
        {
          jobId: 'maintenance_456',
          type: 'maintenance',
          status: 'processing',
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
          devicesAffected: 2,
        },
      ];

      return reply.send({
        jobs: mockJobs,
        pagination: {
          page,
          limit,
          totalCount: mockJobs.length,
          totalPages: 1,
        },
      });
    } catch (error) {
      fastify.log.error('Error fetching jobs:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch jobs',
      });
    }
  });
};

export default actionRoutes;
