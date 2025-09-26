import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';

// Import route modules
import healthRoutes from './routes/health.js';
import ownerRoutes from './routes/owners.js';
import deviceRoutes from './routes/devices.js';
import metricRoutes from './routes/metrics.js';
import actionRoutes from './routes/actions.js';
import statementRoutes from './routes/statements.js';
import alertRoutes from './routes/alerts.js';
import invoiceRoutes from './routes/invoices.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info',
    },
  }).withTypeProvider<ZodTypeProvider>();

  // Set validator and serializer
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  // Register security plugins
  await app.register(cors, {
    origin: process.env.NODE_ENV === 'production' ? false : true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  // OpenAPI/Swagger for API docs
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'DePIN Autopilot API',
        version: '1.0.0',
        description: 'Fastify API for owners, devices, metrics, actions, and statements.',
      },
      servers: [{ url: `http://localhost:${process.env.PORT || 4000}` }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Register routes
  await app.register(healthRoutes, { prefix: '/health' });
  await app.register(ownerRoutes, { prefix: '/owners' });
  await app.register(deviceRoutes, { prefix: '/devices' });
  await app.register(metricRoutes, { prefix: '/metrics' });
  await app.register(actionRoutes, { prefix: '/actions' });
  await app.register(statementRoutes, { prefix: '/statements' });
  await app.register(alertRoutes, { prefix: '/alerts' });
  await app.register(invoiceRoutes, { prefix: '/invoices' });

  return app;
}
