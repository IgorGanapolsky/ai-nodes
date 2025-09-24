import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
// Import route modules
import healthRoutes from './routes/health.js';
import ownerRoutes from './routes/owners.js';
import deviceRoutes from './routes/devices.js';
import metricRoutes from './routes/metrics.js';
import actionRoutes from './routes/actions.js';
import statementRoutes from './routes/statements.js';
import alertRoutes from './routes/alerts.js';
export async function buildApp() {
    const app = Fastify({
        logger: {
            level: process.env.LOG_LEVEL || 'info',
        },
    });
    // Register security plugins
    await app.register(cors, {
        origin: process.env.NODE_ENV === 'production' ? false : true,
    });
    await app.register(helmet, {
        contentSecurityPolicy: false,
    });
    // Register routes
    await app.register(healthRoutes, { prefix: '/health' });
    await app.register(ownerRoutes, { prefix: '/owners' });
    await app.register(deviceRoutes, { prefix: '/devices' });
    await app.register(metricRoutes, { prefix: '/metrics' });
    await app.register(actionRoutes, { prefix: '/actions' });
    await app.register(statementRoutes, { prefix: '/statements' });
    await app.register(alertRoutes, { prefix: '/alerts' });
    return app;
}
