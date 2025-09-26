import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// Validation schemas
const createOwnerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  walletAddress: z.string().min(1, 'Wallet address is required'),
  tier: z.enum(['basic', 'premium', 'enterprise']).default('basic'),
  preferences: z
    .object({
      notifications: z
        .object({
          email: z.boolean().default(true),
          sms: z.boolean().default(false),
          push: z.boolean().default(true),
        })
        .default(() => ({
          email: true,
          sms: false,
          push: false
        })),
      alertThresholds: z
        .object({
          utilizationLow: z.number().min(0).max(100).default(20),
          utilizationHigh: z.number().min(0).max(100).default(90),
        })
        .default(() => ({
          utilizationLow: 20,
          utilizationHigh: 80
        })),
    })
    .default(() => ({
      notifications: {
        email: true,
        sms: false,
        push: false
      },
      alertThresholds: {
        utilizationLow: 20,
        utilizationHigh: 80
      }
    })),
});

const ownerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  walletAddress: z.string(),
  tier: z.enum(['basic', 'premium', 'enterprise']),
  preferences: z.object({
    notifications: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
    alertThresholds: z.object({
      utilizationLow: z.number(),
      utilizationHigh: z.number(),
    }),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const getOwnersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  tier: z.enum(['basic', 'premium', 'enterprise']).optional(),
  search: z.string().optional(),
});

type OwnerResponse = z.infer<typeof ownerResponseSchema>;

const ownerRoutes: FastifyPluginCallback<{}, any, ZodTypeProvider> = async (fastify) => {
  // GET /owners - List owners with pagination and filtering
  fastify.get(
    '/',
    {
      schema: {
        querystring: getOwnersQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        const { page, limit } = request.query;

        // TODO: Replace with actual database query
        const mockOwners: OwnerResponse[] = [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            walletAddress: '0x1234567890abcdef',
            tier: 'premium',
            preferences: {
              notifications: { email: true, sms: false, push: true },
              alertThresholds: { utilizationLow: 15, utilizationHigh: 85 },
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        const totalCount = mockOwners.length;
        const totalPages = Math.ceil(totalCount / limit);

        const response = {
          owners: mockOwners,
          pagination: {
            page,
            limit,
            totalCount,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
          },
        };

        return reply.send(response);
      } catch (error) {
        fastify.log.error(`Error fetching owners: ${(error as Error).message || String(error)}`);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to fetch owners',
        });
      }
    },
  );

  // GET /owners/:id - Get specific owner
  fastify.get('/:id', async (request, reply) => {
    try {
      const paramsSchema = z.object({ id: z.string() });
      const { id } = paramsSchema.parse(request.params);

      // TODO: Replace with actual database query
      const mockOwner: OwnerResponse = {
        id,
        name: 'John Doe',
        email: 'john@example.com',
        walletAddress: '0x1234567890abcdef',
        tier: 'premium',
        preferences: {
          notifications: { email: true, sms: false, push: true },
          alertThresholds: { utilizationLow: 15, utilizationHigh: 85 },
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return reply.send(mockOwner);
    } catch (error) {
      const paramsSchema = z.object({ id: z.string() });
      const { id } = paramsSchema.parse(request.params);
      fastify.log.error(`Error fetching owner ${id}: ${(error as Error).message || String(error)}`);
      return reply.status(404).send({
        error: 'Not found',
        message: 'Owner not found',
      });
    }
  });

  // POST /owners - Create new owner
  fastify.post(
    '/',
    {
      schema: {
        body: createOwnerSchema,
      },
    },
    async (request, reply) => {
      try {
        const ownerData = request.body;

        // TODO: Replace with actual database insertion
        const newOwner: OwnerResponse = {
          id: Math.random().toString(36).substr(2, 9), // Generate random ID
          ...ownerData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        fastify.log.info(`Created new owner: ${JSON.stringify({ ownerId: newOwner.id, email: newOwner.email })}`);

        return reply.status(201).send(newOwner);
      } catch (error) {
        fastify.log.error(`Error creating owner: ${(error as Error).message || String(error)}`);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to create owner',
        });
      }
    },
  );

  // PUT /owners/:id - Update existing owner
  fastify.put(
    '/:id',
    {
      schema: {
        body: createOwnerSchema.partial(),
      },
    },
    async (request, reply) => {
      try {
        const paramsSchema = z.object({ id: z.string() });
        const { id } = paramsSchema.parse(request.params);
        request.body;

        // TODO: Replace with actual database update
        const updatedOwner: OwnerResponse = {
          id,
          name: 'John Doe Updated',
          email: 'john.updated@example.com',
          walletAddress: '0x1234567890abcdef',
          tier: 'premium',
          preferences: {
            notifications: { email: true, sms: false, push: true },
            alertThresholds: { utilizationLow: 15, utilizationHigh: 85 },
          },
          createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          updatedAt: new Date().toISOString(),
        };

        fastify.log.info(`Updated owner: ${JSON.stringify({ ownerId: id })}`);

        return reply.send(updatedOwner);
      } catch (error) {
        const paramsSchema = z.object({ id: z.string() });
        const { id } = paramsSchema.parse(request.params);
        fastify.log.error(`Error updating owner ${id}: ${(error as Error).message || String(error)}`);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to update owner',
        });
      }
    },
  );

  // DELETE /owners/:id - Delete owner
  fastify.delete('/:id', async (request, reply) => {
    try {
      const paramsSchema = z.object({ id: z.string() });
      const { id } = paramsSchema.parse(request.params);

      // TODO: Replace with actual database deletion
      // Check if owner has devices first
      // await db.owner.delete({ where: { id } });

      fastify.log.info(`Deleted owner: ${JSON.stringify({ ownerId: id })}`);

      return reply.status(204).send();
    } catch (error) {
      const paramsSchema = z.object({ id: z.string() });
      const { id } = paramsSchema.parse(request.params);
      fastify.log.error(`Error deleting owner ${id}: ${(error as Error).message || String(error)}`);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to delete owner',
      });
    }
  });
};

export default ownerRoutes;
