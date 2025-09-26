import type { FastifyPluginCallback } from 'fastify';
import { z } from 'zod';

// Validation schemas
const generateStatementSchema = z.object({
  ownerId: z.string().min(1, 'Owner ID is required'),
  period: z.object({
    startDate: z.string(), // ISO date string
    endDate: z.string(), // ISO date string
  }),
  type: z.enum(['earnings', 'usage', 'tax', 'comprehensive']).default('comprehensive'),
  format: z.enum(['pdf', 'html', 'json']).default('pdf'),
  includeCharts: z.boolean().default(true),
  includeTaxInfo: z.boolean().default(false),
  deviceIds: z.array(z.string()).optional(), // Filter specific devices
  currency: z.string().default('USD'),
  sendEmail: z.boolean().default(false),
  emailAddress: z.string().email().optional(),
});

const statementResponseSchema = z.object({
  statementId: z.string(),
  ownerId: z.string(),
  type: z.string(),
  format: z.string(),
  status: z.enum(['generating', 'completed', 'failed']),
  period: z.object({
    startDate: z.string(),
    endDate: z.string(),
  }),
  generatedAt: z.string(),
  downloadUrl: z.string().optional(),
  emailSent: z.boolean().optional(),
  summary: z
    .object({
      totalEarnings: z.number(),
      totalHours: z.number(),
      averageUtilization: z.number(),
      devicesIncluded: z.number(),
      currency: z.string(),
    })
    .optional(),
});

const getStatementsQuerySchema = z.object({
  ownerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  type: z.enum(['earnings', 'usage', 'tax', 'comprehensive']).optional(),
  status: z.enum(['generating', 'completed', 'failed']).optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

type GenerateStatementRequest = z.infer<typeof generateStatementSchema>;
type StatementResponse = z.infer<typeof statementResponseSchema>;
type GetStatementsQuery = z.infer<typeof getStatementsQuerySchema>;

const statementRoutes: FastifyPluginCallback = async (fastify) => {
  // POST /statements/generate - Generate new statement
  fastify.post<{
    Body: GenerateStatementRequest;
  }>(
    '/generate',
    {
      schema: {
        body: generateStatementSchema,
      },
    },
    async (request, reply) => {
      try {
        const statementRequest = request.body;

        // Generate statement ID
        const statementId = `stmt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // TODO: Replace with actual statement generation logic
        const response: StatementResponse = {
          statementId,
          ownerId: statementRequest.ownerId,
          type: statementRequest.type,
          format: statementRequest.format,
          status: 'generating',
          period: statementRequest.period,
          generatedAt: new Date().toISOString(),
          summary: {
            totalEarnings: 1247.5,
            totalHours: 168.5,
            averageUtilization: 73.2,
            devicesIncluded: statementRequest.deviceIds?.length || 3,
            currency: statementRequest.currency,
          },
        };

        // In a real implementation, this would queue a background job
        // For now, simulate immediate completion for demo purposes
        setTimeout(async () => {
          response.status = 'completed';
          response.downloadUrl = `/api/statements/${statementId}/download`;
          response.emailSent = statementRequest.sendEmail;

          fastify.log.info('Statement generation completed:', {
            statementId,
            ownerId: statementRequest.ownerId,
            type: statementRequest.type,
          });
        }, 1000);

        fastify.log.info('Statement generation started:', {
          statementId,
          ownerId: statementRequest.ownerId,
          type: statementRequest.type,
          period: statementRequest.period,
        });

        return reply.status(202).send(response); // 202 Accepted for async operation
      } catch (error) {
        fastify.log.error('Error generating statement:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to generate statement',
        });
      }
    },
  );

  // GET /statements - List statements with filtering
  fastify.get<{
    Querystring: GetStatementsQuery;
  }>(
    '/',
    {
      schema: {
        querystring: getStatementsQuerySchema,
      },
    },
    async (request, reply) => {
      try {
        const { ownerId, startDate, endDate, type, status, page, limit } = request.query;

        // TODO: Replace with actual database query
        const mockStatements: StatementResponse[] = [
          {
            statementId: 'stmt_1',
            ownerId: '1',
            type: 'comprehensive',
            format: 'pdf',
            status: 'completed',
            period: {
              startDate: '2024-01-01T00:00:00Z',
              endDate: '2024-01-31T23:59:59Z',
            },
            generatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            downloadUrl: '/api/statements/stmt_1/download',
            emailSent: true,
            summary: {
              totalEarnings: 2456.75,
              totalHours: 744, // January hours
              averageUtilization: 78.3,
              devicesIncluded: 3,
              currency: 'USD',
            },
          },
          {
            statementId: 'stmt_2',
            ownerId: '1',
            type: 'earnings',
            format: 'json',
            status: 'completed',
            period: {
              startDate: '2024-01-01T00:00:00Z',
              endDate: '2024-01-07T23:59:59Z',
            },
            generatedAt: new Date(Date.now() - 7 * 86400000).toISOString(), // 1 week ago
            downloadUrl: '/api/statements/stmt_2/download',
            emailSent: false,
            summary: {
              totalEarnings: 578.25,
              totalHours: 168,
              averageUtilization: 82.1,
              devicesIncluded: 2,
              currency: 'USD',
            },
          },
        ];

        // Apply filters (in real implementation, this would be in the database query)
        let filteredStatements = mockStatements;

        if (ownerId) {
          filteredStatements = filteredStatements.filter((s) => s.ownerId === ownerId);
        }
        if (type) {
          filteredStatements = filteredStatements.filter((s) => s.type === type);
        }
        if (status) {
          filteredStatements = filteredStatements.filter((s) => s.status === status);
        }
        // Date filtering would be more complex in real implementation

        const totalCount = filteredStatements.length;
        const totalPages = Math.ceil(totalCount / limit);
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedStatements = filteredStatements.slice(startIndex, endIndex);

        const response = {
          statements: paginatedStatements,
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
        fastify.log.error('Error fetching statements:', error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to fetch statements',
        });
      }
    },
  );

  // GET /statements/:id - Get specific statement
  fastify.get<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Replace with actual database query
      const mockStatement: StatementResponse = {
        statementId: id,
        ownerId: '1',
        type: 'comprehensive',
        format: 'pdf',
        status: 'completed',
        period: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-31T23:59:59Z',
        },
        generatedAt: new Date(Date.now() - 86400000).toISOString(),
        downloadUrl: `/api/statements/${id}/download`,
        emailSent: true,
        summary: {
          totalEarnings: 2456.75,
          totalHours: 744,
          averageUtilization: 78.3,
          devicesIncluded: 3,
          currency: 'USD',
        },
      };

      return reply.send(mockStatement);
    } catch (error) {
      fastify.log.error(`Error fetching statement ${request.params.id}:`, error);
      return reply.status(404).send({
        error: 'Not found',
        message: 'Statement not found',
      });
    }
  });

  // GET /statements/:id/download - Download statement file
  fastify.get<{
    Params: { id: string };
  }>('/:id/download', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Replace with actual file serving logic
      // In a real implementation, you would:
      // 1. Look up the statement in the database
      // 2. Verify user permissions
      // 3. Check if the file exists
      // 4. Stream the file to the response

      // Mock PDF content
      const pdfContent = Buffer.from(
        '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n193\n%%EOF',
      );

      reply.type('application/pdf');
      reply.header('Content-Disposition', `attachment; filename="statement-${id}.pdf"`);
      reply.header('Content-Length', pdfContent.length);

      return reply.send(pdfContent);
    } catch (error) {
      fastify.log.error(`Error downloading statement ${request.params.id}:`, error);
      return reply.status(404).send({
        error: 'Not found',
        message: 'Statement file not found',
      });
    }
  });

  // POST /statements/:id/resend - Resend statement via email
  fastify.post<{
    Params: { id: string };
    Body: { emailAddress: string };
  }>(
    '/:id/resend',
    {
      schema: {
        body: z.object({
          emailAddress: z.string().email('Valid email address required'),
        }),
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { emailAddress } = request.body;

        // TODO: Replace with actual email sending logic
        fastify.log.info('Resending statement via email:', {
          statementId: id,
          emailAddress,
        });

        return reply.send({
          success: true,
          message: 'Statement sent successfully',
          sentAt: new Date().toISOString(),
        });
      } catch (error) {
        fastify.log.error(`Error resending statement ${request.params.id}:`, error);
        return reply.status(500).send({
          error: 'Internal server error',
          message: 'Failed to resend statement',
        });
      }
    },
  );

  // DELETE /statements/:id - Delete statement
  fastify.delete<{
    Params: { id: string };
  }>('/:id', async (request, reply) => {
    try {
      const { id } = request.params;

      // TODO: Replace with actual deletion logic
      // Check permissions, delete from database and file system

      fastify.log.info('Deleted statement:', { statementId: id });

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error(`Error deleting statement ${request.params.id}:`, error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to delete statement',
      });
    }
  });

  // GET /statements/templates - Get available statement templates
  fastify.get('/templates', async (request, reply) => {
    try {
      const templates = [
        {
          id: 'earnings_summary',
          name: 'Earnings Summary',
          description: 'Basic earnings report with device breakdown',
          type: 'earnings',
          supportedFormats: ['pdf', 'html', 'json'],
          includesCharts: true,
        },
        {
          id: 'usage_detailed',
          name: 'Detailed Usage Report',
          description: 'Comprehensive usage statistics and performance metrics',
          type: 'usage',
          supportedFormats: ['pdf', 'html'],
          includesCharts: true,
        },
        {
          id: 'tax_report',
          name: 'Tax Report',
          description: 'Tax-compliant earnings report with necessary documentation',
          type: 'tax',
          supportedFormats: ['pdf', 'json'],
          includesCharts: false,
        },
        {
          id: 'comprehensive',
          name: 'Comprehensive Statement',
          description: 'Complete overview including earnings, usage, and performance',
          type: 'comprehensive',
          supportedFormats: ['pdf', 'html', 'json'],
          includesCharts: true,
        },
      ];

      return reply.send({ templates });
    } catch (error) {
      fastify.log.error('Error fetching statement templates:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch templates',
      });
    }
  });
};

export default statementRoutes;
