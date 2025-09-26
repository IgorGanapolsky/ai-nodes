import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';

const healthResponseSchema = z.object({
  status: z.enum(['healthy', 'unhealthy']),
  timestamp: z.string(),
  checks: z.object({
    database: z.object({
      status: z.enum(['up', 'down']),
      responseTime: z.number().optional(),
    }),
    memory: z.object({
      used: z.number(),
      total: z.number(),
      percentage: z.number(),
    }),
    uptime: z.number(),
  }),
});

type HealthResponse = z.infer<typeof healthResponseSchema>;

const healthRoutes: FastifyPluginCallback = async (fastify) => {
  fastify.get('/', async (_request, reply) => {
    try {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal + memoryUsage.external;
      const usedMemory = memoryUsage.heapUsed;

      // Database health check
      let dbStatus: 'up' | 'down' = 'up';
      let dbResponseTime: number | undefined;

      try {
        const startTime = Date.now();
        // TODO: Add actual database connection check
        // await fastify.db.raw('SELECT 1');
        dbResponseTime = Date.now() - startTime;
        dbStatus = 'up';
      } catch (error) {
        fastify.log.error('Database health check failed: ' + (error instanceof Error ? error.message : String(error)));
        dbStatus = 'down';
      }

      const healthData: HealthResponse = {
        status: dbStatus === 'up' ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        checks: {
          database: {
            status: dbStatus,
            responseTime: dbResponseTime,
          },
          memory: {
            used: usedMemory,
            total: totalMemory,
            percentage: Math.round((usedMemory / totalMemory) * 100),
          },
          uptime: process.uptime(),
        },
      };

      const statusCode = healthData.status === 'healthy' ? 200 : 503;

      return reply.status(statusCode).send(healthData);
    } catch (error) {
      fastify.log.error('Health check error: ' + (error instanceof Error ? error.message : String(error)));

      return reply.status(503).send({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Internal server error during health check',
      });
    }
  });

  // Liveness probe - simple endpoint for container orchestration
  fastify.get('/live', async (_request, reply) => {
    return reply.status(200).send({ status: 'alive' });
  });

  // Readiness probe - checks if service is ready to accept traffic
  fastify.get('/ready', async (_request, reply) => {
    try {
      // TODO: Add checks for external dependencies (database, cache, etc.)
      return reply.status(200).send({ status: 'ready' });
    } catch (error) {
      return reply.status(503).send({ status: 'not ready' });
    }
  });
};

export default healthRoutes;
