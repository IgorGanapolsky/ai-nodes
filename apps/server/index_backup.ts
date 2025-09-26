import { createApp } from './app';
import { env, isDevelopment } from './config/env';
import { logger } from './config/logger';
import { disconnectDatabase } from './config/database';
import { initializeJobs, stopAllJobs } from './jobs';

async function start(): Promise<void> {
  try {
    logger.info(
      {
        nodeEnv: env.NODE_ENV,
        port: env.PORT,
        host: env.HOST,
      },
      'Starting AI Nodes Management Server...',
    );

    // Create Fastify app
    const app = await createApp();

    // Initialize background jobs
    initializeJobs();

    // Start server
    await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(
      {
        port: env.PORT,
        host: env.HOST,
        environment: env.NODE_ENV,
        documentation: `http://${env.HOST}:${env.PORT}/docs`,
        health: `http://${env.HOST}:${env.PORT}/api/health`,
      },
      'Server started successfully',
    );

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown...');

      try {
        // Stop accepting new connections
        await app.close();
        logger.info('HTTP server closed');

        // Stop background jobs
        stopAllJobs();
        logger.info('Background jobs stopped');

        // Disconnect from database
        await disconnectDatabase();
        logger.info('Database disconnected');

        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error(
          {
            error: error instanceof Error ? error.message : 'Unknown error',
          },
          'Error during graceful shutdown',
        );
        process.exit(1);
      }
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.fatal(
        {
          error: {
            message: error.message,
            stack: error.stack,
          },
        },
        'Uncaught exception occurred',
      );
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.fatal(
        {
          reason,
          promise,
        },
        'Unhandled promise rejection occurred',
      );
      process.exit(1);
    });

    // Log memory usage periodically in development
    if (isDevelopment) {
      setInterval(() => {
        const memUsage = process.memoryUsage();
        logger.debug(
          {
            memory: {
              rss: Math.round(memUsage.rss / 1024 / 1024),
              heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
              heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
              external: Math.round(memUsage.external / 1024 / 1024),
            },
          },
          'Memory usage (MB)',
        );
      }, 60000); // Every minute
    }
  } catch (error) {
    logger.fatal(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      'Failed to start server',
    );
    process.exit(1);
  }
}

// Start the application
start().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
