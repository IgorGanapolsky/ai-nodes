import { buildApp } from './app.js';
import { Scheduler } from './scheduler.js';
import * as dotenv from 'dotenv';
// Load environment variables
dotenv.config();
// Environment configuration
const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  enableScheduler: process.env.ENABLE_SCHEDULER !== 'false',
};
async function start() {
  try {
    // Build the Fastify application
    const app = await buildApp();
    // Initialize scheduler if enabled
    let scheduler = null;
    if (config.enableScheduler) {
      scheduler = new Scheduler(app);
    }
    // Add scheduler routes for management
    if (scheduler) {
      app.get('/admin/scheduler/status', async (request, reply) => {
        const status = scheduler.getJobStatus();
        return reply.send({
          enabled: true,
          jobs: status,
          timestamp: new Date().toISOString(),
        });
      });
      app.post(
        '/admin/scheduler/trigger',
        {
          schema: {
            body: {
              type: 'object',
              required: ['jobName'],
              properties: {
                jobName: { type: 'string' },
              },
            },
          },
        },
        async (request, reply) => {
          const { jobName } = request.body;
          const success = await scheduler.triggerJob(jobName);
          if (success) {
            return reply.send({
              success: true,
              message: `Job ${jobName} triggered successfully`,
              triggeredAt: new Date().toISOString(),
            });
          } else {
            return reply.status(404).send({
              success: false,
              error: 'Job not found',
              message: `Job ${jobName} does not exist`,
            });
          }
        },
      );
    }
    // Global error handler
    app.setErrorHandler((error, request, reply) => {
      app.log.error(error);
      const statusCode = error.statusCode || 500;
      const isProduction = config.nodeEnv === 'production';
      reply.status(statusCode).send({
        error: {
          message: error.message,
          statusCode,
          ...(isProduction ? {} : { stack: error.stack }),
        },
        timestamp: new Date().toISOString(),
        requestId: request.id,
      });
    });
    // Not found handler
    app.setNotFoundHandler((request, reply) => {
      reply.status(404).send({
        error: {
          message: 'Route not found',
          statusCode: 404,
          path: request.url,
        },
        timestamp: new Date().toISOString(),
        requestId: request.id,
      });
    });
    // Graceful shutdown handler
    const gracefulShutdown = async (signal) => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      try {
        // Stop scheduler first
        if (scheduler) {
          scheduler.stop();
        }
        // Close Fastify server
        await app.close();
        app.log.info('Server shut down successfully');
        process.exit(0);
      } catch (error) {
        app.log.error('Error during shutdown:', error);
        process.exit(1);
      }
    };
    // Register signal handlers
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      app.log.fatal('Uncaught Exception:', error);
      process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      app.log.fatal('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
    // Start the server
    const address = await app.listen({
      port: config.port,
      host: config.host,
    });
    app.log.info(`Server listening at ${address}`);
    app.log.info(`Environment: ${config.nodeEnv}`);
    app.log.info(`Log level: ${config.logLevel}`);
    app.log.info(`Scheduler enabled: ${config.enableScheduler}`);
    // Start scheduler after server is listening
    if (scheduler) {
      scheduler.start();
    }
    // Log available routes in development
    if (config.nodeEnv === 'development') {
      app.log.info('Available routes:');
      app.log.info('  GET  /health - Health check');
      app.log.info('  GET  /health/live - Liveness probe');
      app.log.info('  GET  /health/ready - Readiness probe');
      app.log.info('  GET  /owners - List owners');
      app.log.info('  POST /owners - Create owner');
      app.log.info('  GET  /devices - List devices');
      app.log.info('  POST /devices - Create device');
      app.log.info('  GET  /metrics - Get metrics');
      app.log.info('  POST /actions/reprice - Dynamic repricing');
      app.log.info('  POST /actions/maintenance - Device maintenance');
      app.log.info('  POST /actions/optimize - Performance optimization');
      app.log.info('  POST /statements/generate - Generate statement');
      app.log.info('  GET  /alerts - List alerts');
      app.log.info('  POST /alerts/resolve/:id - Resolve alert');
      if (scheduler) {
        app.log.info('  GET  /admin/scheduler/status - Scheduler status');
        app.log.info('  POST /admin/scheduler/trigger - Trigger job');
      }
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
// Start the server
start();
