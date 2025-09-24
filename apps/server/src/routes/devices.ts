import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';

// Validation schemas
const createDeviceSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  name: z.string().min(1, 'Device name is required'),
  type: z.enum(['gpu', 'cpu', 'storage', 'bandwidth']),
  specifications: z.object({
    model: z.string().optional(),
    memory: z.string().optional(),
    cores: z.number().optional(),
    storage: z.string().optional(),
    bandwidth: z.string().optional(),
  }),
  location: z.object({
    country: z.string(),
    region: z.string().optional(),
    datacenter: z.string().optional(),
  }),
  pricing: z.object({
    hourlyRate: z.number().positive('Hourly rate must be positive'),
    currency: z.string().default('USD'),
  }),
  status: z.enum(['online', 'offline', 'maintenance']).default('offline'),
});

const deviceResponseSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  type: z.enum(['gpu', 'cpu', 'storage', 'bandwidth']),
  specifications: z.object({
    model: z.string().optional(),
    memory: z.string().optional(),
    cores: z.number().optional(),
    storage: z.string().optional(),
    bandwidth: z.string().optional(),
  }),
  location: z.object({
    country: z.string(),
    region: z.string().optional(),
    datacenter: z.string().optional(),
  }),
  pricing: z.object({
    hourlyRate: z.number(),
    currency: z.string(),
  }),
  status: z.enum(['online', 'offline', 'maintenance']),
  utilization: z.object({
    current: z.number().min(0).max(100),
    average24h: z.number().min(0).max(100),
    average7d: z.number().min(0).max(100),
  }),
  earnings: z.object({
    today: z.number(),
    thisWeek: z.number(),
    thisMonth: z.number(),
    total: z.number(),
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastSeen: z.string().optional(),
});

const getDevicesQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  ownerId: z.string().optional(),
  type: z.enum(['gpu', 'cpu', 'storage', 'bandwidth']).optional(),
  status: z.enum(['online', 'offline', 'maintenance']).optional(),
  location: z.string().optional(), // Filter by country
  search: z.string().optional(),
});

type CreateDeviceBody = z.infer<typeof createDeviceSchema>;
type DeviceResponse = z.infer<typeof deviceResponseSchema>;
type GetDevicesQuery = z.infer<typeof getDevicesQuerySchema>;

const deviceRoutes: FastifyPluginCallback = async (fastify) => {
  // GET /devices - List devices with pagination and filtering
  fastify.get<{
    Querystring: GetDevicesQuery;
  }>('/', {
    schema: {
      querystring: getDevicesQuerySchema,
    },
  }, async (request, reply) => {
    try {
      const { page, limit, ownerId, type, status, location, search } = request.query;

      // TODO: Replace with actual database query
      const mockDevices: DeviceResponse[] = [
        {
          id: '1',
          ownerId: '1',
          name: 'GPU Rig Alpha',
          type: 'gpu',
          specifications: {
            model: 'NVIDIA RTX 4090',
            memory: '24GB GDDR6X',
            cores: 16384,
          },
          location: {
            country: 'USA',
            region: 'California',
            datacenter: 'SF-01',
          },
          pricing: {
            hourlyRate: 2.50,
            currency: 'USD',
          },
          status: 'online',
          utilization: {
            current: 87,
            average24h: 82,
            average7d: 79,
          },
          earnings: {
            today: 58.30,
            thisWeek: 410.20,
            thisMonth: 1650.75,
            total: 12847.50,
          },
          createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
          updatedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        },
        {
          id: '2',
          ownerId: '1',
          name: 'Storage Node Beta',
          type: 'storage',
          specifications: {
            storage: '10TB SSD',
          },
          location: {
            country: 'Germany',
            region: 'Berlin',
          },
          pricing: {
            hourlyRate: 0.15,
            currency: 'USD',
          },
          status: 'online',
          utilization: {
            current: 65,
            average24h: 68,
            average7d: 71,
          },
          earnings: {
            today: 3.60,
            thisWeek: 25.20,
            thisMonth: 108.50,
            total: 847.30,
          },
          createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
          updatedAt: new Date().toISOString(),
          lastSeen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        },
      ];

      // Apply filters (in real implementation, this would be in the database query)
      let filteredDevices = mockDevices;

      if (ownerId) {
        filteredDevices = filteredDevices.filter(d => d.ownerId === ownerId);
      }
      if (type) {
        filteredDevices = filteredDevices.filter(d => d.type === type);
      }
      if (status) {
        filteredDevices = filteredDevices.filter(d => d.status === status);
      }
      if (location) {
        filteredDevices = filteredDevices.filter(d =>
          d.location.country.toLowerCase().includes(location.toLowerCase())
        );
      }
      if (search) {
        filteredDevices = filteredDevices.filter(d =>
          d.name.toLowerCase().includes(search.toLowerCase()) ||
          d.specifications.model?.toLowerCase().includes(search.toLowerCase())
        );
      }

      const totalCount = filteredDevices.length;
      const totalPages = Math.ceil(totalCount / limit);
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedDevices = filteredDevices.slice(startIndex, endIndex);

      const response = {
        devices: paginatedDevices,
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
      fastify.log.error('Error fetching devices:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch devices',
      });
    }
  });

  // GET /devices/:id - Get specific device
  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Replace with actual database query
      const mockDevice: DeviceResponse = {
        id,
        ownerId: '1',
        name: 'GPU Rig Alpha',
        type: 'gpu',
        specifications: {
          model: 'NVIDIA RTX 4090',
          memory: '24GB GDDR6X',
          cores: 16384,
        },
        location: {
          country: 'USA',
          region: 'California',
          datacenter: 'SF-01',
        },
        pricing: {
          hourlyRate: 2.50,
          currency: 'USD',
        },
        status: 'online',
        utilization: {
          current: 87,
          average24h: 82,
          average7d: 79,
        },
        earnings: {
          today: 58.30,
          thisWeek: 410.20,
          thisMonth: 1650.75,
          total: 12847.50,
        },
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };

      return reply.send(mockDevice);
    } catch (error) {
      fastify.log.error(`Error fetching device ${request.params.id}:`, error);
      return reply.status(404).send({
        error: 'Not found',
        message: 'Device not found',
      });
    }
  });

  // POST /devices - Create new device
  fastify.post<{
    Body: CreateDeviceBody;
  }>('/', {
    schema: {
      body: createDeviceSchema,
    },
  }, async (request, reply) => {
    try {
      const deviceData = request.body;

      // TODO: Replace with actual database insertion
      const newDevice: DeviceResponse = {
        id: Math.random().toString(36).substr(2, 9), // Generate random ID
        ...deviceData,
        utilization: {
          current: 0,
          average24h: 0,
          average7d: 0,
        },
        earnings: {
          today: 0,
          thisWeek: 0,
          thisMonth: 0,
          total: 0,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      fastify.log.info('Created new device:', {
        deviceId: newDevice.id,
        ownerId: newDevice.ownerId,
        type: newDevice.type
      });

      return reply.status(201).send(newDevice);
    } catch (error) {
      fastify.log.error('Error creating device:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to create device',
      });
    }
  });

  // PUT /devices/:id - Update existing device
  fastify.put<{
    Params: { id: string };
    Body: Partial<CreateDeviceBody>;
  }>('/:id', {
    schema: {
      body: createDeviceSchema.partial(),
    },
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      // TODO: Replace with actual database update
      const updatedDevice: DeviceResponse = {
        id,
        ownerId: '1',
        name: 'GPU Rig Alpha Updated',
        type: 'gpu',
        specifications: {
          model: 'NVIDIA RTX 4090',
          memory: '24GB GDDR6X',
          cores: 16384,
        },
        location: {
          country: 'USA',
          region: 'California',
          datacenter: 'SF-01',
        },
        pricing: {
          hourlyRate: 2.75, // Updated price
          currency: 'USD',
        },
        status: 'online',
        utilization: {
          current: 87,
          average24h: 82,
          average7d: 79,
        },
        earnings: {
          today: 58.30,
          thisWeek: 410.20,
          thisMonth: 1650.75,
          total: 12847.50,
        },
        createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
        updatedAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
      };

      fastify.log.info('Updated device:', { deviceId: id });

      return reply.send(updatedDevice);
    } catch (error) {
      fastify.log.error(`Error updating device ${request.params.id}:`, error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to update device',
      });
    }
  });

  // DELETE /devices/:id - Delete device
  fastify.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Replace with actual database deletion
      // Check if device is currently in use first
      // await db.device.delete({ where: { id } });

      fastify.log.info('Deleted device:', { deviceId: id });

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error(`Error deleting device ${request.params.id}:`, error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to delete device',
      });
    }
  });
};

export default deviceRoutes;