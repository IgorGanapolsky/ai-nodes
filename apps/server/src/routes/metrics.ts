import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

// Validation schemas
const getMetricsQuerySchema = z.object({
  deviceId: z.string().optional(),
  ownerId: z.string().optional(),
  startDate: z.string().optional(), // ISO date string
  endDate: z.string().optional(), // ISO date string
  granularity: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  metricType: z.enum(['utilization', 'earnings', 'performance', 'all']).default('all'),
});

const metricsResponseSchema = z.object({
  summary: z.object({
    totalDevices: z.number(),
    onlineDevices: z.number(),
    averageUtilization: z.number(),
    totalEarnings: z.number(),
    totalUptime: z.number(), // in hours
  }),
  utilization: z.array(
    z.object({
      timestamp: z.string(),
      deviceId: z.string(),
      deviceName: z.string(),
      utilizationPercent: z.number(),
      cpuUsage: z.number().optional(),
      memoryUsage: z.number().optional(),
      gpuUsage: z.number().optional(),
    }),
  ),
  earnings: z.array(
    z.object({
      timestamp: z.string(),
      deviceId: z.string(),
      deviceName: z.string(),
      amount: z.number(),
      currency: z.string(),
      hoursOnline: z.number(),
      hourlyRate: z.number(),
    }),
  ),
  performance: z.array(
    z.object({
      timestamp: z.string(),
      deviceId: z.string(),
      deviceName: z.string(),
      responseTime: z.number(), // in ms
      throughput: z.number(), // requests/second or similar
      errorRate: z.number(), // percentage
      uptime: z.number(), // percentage
    }),
  ),
});

type GetMetricsQuery = z.infer<typeof getMetricsQuerySchema>;
type MetricsResponse = z.infer<typeof metricsResponseSchema>;

const metricRoutes: FastifyPluginCallback<{}, any, ZodTypeProvider> = async (fastify) => {
  // GET /metrics - Get comprehensive metrics data
  fastify.get(
    '/',
    {
      schema: {
        querystring: getMetricsQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        const { deviceId, ownerId, startDate, endDate, granularity, metricType } = request.query;

        // Generate mock data based on query parameters
        const now = new Date();
        const start = startDate
          ? new Date(startDate)
          : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        const end = endDate ? new Date(endDate) : now;

        // TODO: Replace with actual database queries
        const mockMetrics: MetricsResponse = {
          summary: {
            totalDevices: deviceId ? 1 : 15,
            onlineDevices: deviceId ? 1 : 12,
            averageUtilization: 73.5,
            totalEarnings: 4285.75,
            totalUptime: 168.5, // hours
          },
          utilization: generateMockUtilizationData(start, end, granularity, deviceId),
          earnings: generateMockEarningsData(start, end, granularity, deviceId),
          performance: generateMockPerformanceData(start, end, granularity, deviceId),
        };

        // Filter response based on metricType
        let filteredResponse: Partial<MetricsResponse> = { summary: mockMetrics.summary };

        if (metricType === 'all') {
          filteredResponse = mockMetrics;
        } else if (metricType === 'utilization') {
          filteredResponse.utilization = mockMetrics.utilization;
        } else if (metricType === 'earnings') {
          filteredResponse.earnings = mockMetrics.earnings;
        } else if (metricType === 'performance') {
          filteredResponse.performance = mockMetrics.performance;
        }

        return reply.send(filteredResponse);
      } catch (error) {
        fastify.log.error('Error fetching metrics:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to fetch metrics',
        });
      }
    },
  );

  // GET /metrics/live - Get real-time metrics for dashboard
  fastify.get('/live', async (request, reply) => {
    try {
      // TODO: Replace with actual real-time data source (Redis, WebSocket, etc.)
      const liveMetrics = {
        timestamp: new Date().toISOString(),
        activeConnections: 347,
        currentUtilization: {
          average: 76.3,
          peak: 94.2,
          devices: [
            { id: '1', name: 'GPU Rig Alpha', utilization: 89.5 },
            { id: '2', name: 'Storage Node Beta', utilization: 65.1 },
            { id: '3', name: 'CPU Farm Gamma', utilization: 78.9 },
          ],
        },
        earnings: {
          lastHour: 15.75,
          today: 342.5,
          rate: 2.35, // USD per hour
        },
        alerts: {
          critical: 0,
          warning: 2,
          info: 5,
        },
      };

      return reply.send(liveMetrics);
    } catch (error) {
      fastify.log.error('Error fetching live metrics:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch live metrics',
      });
    }
  });

  // GET /metrics/export - Export metrics data (CSV/JSON)
  fastify.get<{
    Querystring: GetMetricsQuery & { format: 'csv' | 'json' };
  }>(
    '/export',
    {
      schema: {
        querystring: getMetricsQuerySchema.extend({
          format: z.enum(['csv', 'json']).default('json'),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { format, ...queryParams } = request.query;

        // Get metrics data (same logic as main endpoint)
        // TODO: Implement actual export functionality

        if (format === 'csv') {
          const csvData =
            'timestamp,device_id,utilization,earnings\n2024-01-01T00:00:00Z,1,75.5,2.30\n';
          reply.type('text/csv');
          reply.header('Content-Disposition', `attachment; filename="metrics-${Date.now()}.csv"`);
          return reply.send(csvData);
        } else {
          // Return JSON format
          const exportData = {
            exportedAt: new Date().toISOString(),
            query: queryParams,
            data: [], // Metrics data would go here
          };

          reply.header('Content-Disposition', `attachment; filename="metrics-${Date.now()}.json"`);
          return reply.send(exportData);
        }
      } catch (error) {
        fastify.log.error('Error exporting metrics:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to export metrics',
        });
      }
    },
  );
};

// Helper functions to generate mock data
function generateMockUtilizationData(
  start: Date,
  end: Date,
  granularity: string,
  deviceId?: string,
): MetricsResponse['utilization'] {
  const data = [];
  const deviceIds = deviceId ? [deviceId] : ['1', '2', '3'];
  const deviceNames = { '1': 'GPU Rig Alpha', '2': 'Storage Node Beta', '3': 'CPU Farm Gamma' };

  // Generate time intervals based on granularity
  const interval = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  for (let time = start.getTime(); time <= end.getTime(); time += interval) {
    for (const devId of deviceIds) {
      data.push({
        timestamp: new Date(time).toISOString(),
        deviceId: devId,
        deviceName: deviceNames[devId as keyof typeof deviceNames] || `Device ${devId}`,
        utilizationPercent: Math.floor(Math.random() * 40 + 60), // 60-100%
        cpuUsage: Math.floor(Math.random() * 30 + 40), // 40-70%
        memoryUsage: Math.floor(Math.random() * 25 + 50), // 50-75%
        gpuUsage: devId === '1' ? Math.floor(Math.random() * 40 + 60) : undefined,
      });
    }
  }

  return data;
}

function generateMockEarningsData(
  start: Date,
  end: Date,
  granularity: string,
  deviceId?: string,
): MetricsResponse['earnings'] {
  const data = [];
  const deviceIds = deviceId ? [deviceId] : ['1', '2', '3'];
  const deviceNames = { '1': 'GPU Rig Alpha', '2': 'Storage Node Beta', '3': 'CPU Farm Gamma' };
  const rates = { '1': 2.5, '2': 0.15, '3': 1.2 };

  const interval = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  const hoursPerInterval = granularity === 'hour' ? 1 : 24;

  for (let time = start.getTime(); time <= end.getTime(); time += interval) {
    for (const devId of deviceIds) {
      const hourlyRate = rates[devId as keyof typeof rates] || 1.0;
      const hoursOnline = hoursPerInterval * (Math.random() * 0.4 + 0.6); // 60-100% uptime

      data.push({
        timestamp: new Date(time).toISOString(),
        deviceId: devId,
        deviceName: deviceNames[devId as keyof typeof deviceNames] || `Device ${devId}`,
        amount: Number((hourlyRate * hoursOnline).toFixed(2)),
        currency: 'USD',
        hoursOnline: Number(hoursOnline.toFixed(2)),
        hourlyRate,
      });
    }
  }

  return data;
}

function generateMockPerformanceData(
  start: Date,
  end: Date,
  granularity: string,
  deviceId?: string,
): MetricsResponse['performance'] {
  const data = [];
  const deviceIds = deviceId ? [deviceId] : ['1', '2', '3'];
  const deviceNames = { '1': 'GPU Rig Alpha', '2': 'Storage Node Beta', '3': 'CPU Farm Gamma' };

  const interval = granularity === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

  for (let time = start.getTime(); time <= end.getTime(); time += interval) {
    for (const devId of deviceIds) {
      data.push({
        timestamp: new Date(time).toISOString(),
        deviceId: devId,
        deviceName: deviceNames[devId as keyof typeof deviceNames] || `Device ${devId}`,
        responseTime: Math.floor(Math.random() * 100 + 50), // 50-150ms
        throughput: Math.floor(Math.random() * 500 + 100), // 100-600 req/s
        errorRate: Math.random() * 2, // 0-2% error rate
        uptime: Math.random() * 5 + 95, // 95-100% uptime
      });
    }
  }

  return data;
}

export default metricRoutes;
