import type { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';
import crypto from 'crypto';

interface AuthConfig {
  username: string;
  password: string;
  realm?: string;
}

export async function basicAuth(fastify: FastifyInstance) {
  const config: AuthConfig = {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex'),
    realm: 'DePIN Autopilot Admin',
  };

  // Log credentials on startup (only in dev)
  if (!process.env.ADMIN_PASSWORD && process.env.NODE_ENV !== 'production') {
    fastify.log.warn(`
      ⚠️  No ADMIN_PASSWORD set. Using generated password:
      Username: ${config.username}
      Password: ${config.password}
      Set ADMIN_USERNAME and ADMIN_PASSWORD in .env for production
    `);
  }

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for health checks
    if (
      request.url === '/health' ||
      request.url === '/health/live' ||
      request.url === '/health/ready'
    ) {
      return;
    }

    // Skip auth for public docs
    if (request.url === '/docs' || request.url.startsWith('/docs/')) {
      return;
    }

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      reply
        .code(401)
        .header('WWW-Authenticate', `Basic realm="${config.realm}"`)
        .send({ error: 'Authentication required' });
      return;
    }

    const credentials = Buffer.from(authHeader.split(' ')[1], 'base64').toString();
    const [username, password] = credentials.split(':');

    if (username !== config.username || password !== config.password) {
      reply
        .code(401)
        .header('WWW-Authenticate', `Basic realm="${config.realm}"`)
        .send({ error: 'Invalid credentials' });
      return;
    }
  });
}

// Rate limiting for action endpoints
export async function rateLimitActions(fastify: FastifyInstance) {
  const limits = new Map<string, { count: number; resetTime: number }>();
  const MAX_REQUESTS = 10; // per minute
  const WINDOW_MS = 60000; // 1 minute

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only apply to action endpoints
    if (!request.url.startsWith('/actions/')) {
      return;
    }

    const clientId = request.headers['x-client-id'] || request.ip;
    const now = Date.now();
    const limit = limits.get(clientId);

    if (!limit || now > limit.resetTime) {
      limits.set(clientId, {
        count: 1,
        resetTime: now + WINDOW_MS,
      });
      return;
    }

    if (limit.count >= MAX_REQUESTS) {
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
      reply
        .code(429)
        .header('Retry-After', String(retryAfter))
        .send({
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
        });
      return;
    }

    limit.count++;
  });
}
