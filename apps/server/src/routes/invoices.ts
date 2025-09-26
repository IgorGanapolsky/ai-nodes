import type { FastifyPluginCallback } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia'
});

const createInvoiceSchema = z.object({
  statementId: z.string(),
  ownerId: z.string(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

const invoiceRoutes: FastifyPluginCallback<{}, any, ZodTypeProvider> = async (fastify) => {
  // POST /invoices - Create payment link for a statement
  fastify.post(
    '/',
    {
      schema: {
        body: createInvoiceSchema,
      },
    },
    async (request, reply) => {
      try {
        const { statementId, ownerId, amount, currency, description, dueDate } = request.body;

        // Create Stripe payment link
        const paymentLink = await stripe.paymentLinks.create({
          line_items: [
            {
              price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                  name: `DePIN Management Fee - Statement ${statementId}`,
                  description: description || `Revenue share for statement ${statementId}`,
                },
                unit_amount: Math.round(amount * 100), // Convert to cents
              },
              quantity: 1,
            },
          ],
          metadata: {
            statementId,
            ownerId,
          },
          after_completion: {
            type: 'redirect',
            redirect: {
              url: `${process.env.APP_URL}/statements/${statementId}/paid`,
            },
          },
          payment_intent_data: {
            metadata: {
              statementId,
              ownerId,
            },
          },
        });

        // Store invoice URL in database
        // TODO: Update statement record with invoice URL
        const invoice = {
          id: `inv_${Date.now()}`,
          statementId,
          ownerId,
          amount,
          currency,
          status: 'pending',
          paymentUrl: paymentLink.url,
          stripePaymentLinkId: paymentLink.id,
          createdAt: new Date().toISOString(),
          dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        };

        fastify.log.info({ invoiceId: invoice.id, statementId }, 'Created invoice');

        return reply.status(201).send(invoice);
      } catch (error) {
        fastify.log.error(error, 'Failed to create invoice');
        return reply.status(500).send({
          error: 'Failed to create invoice',
          message: 'Could not generate payment link',
        });
      }
    }
  );

  // GET /invoices/:statementId - Get invoice for statement
  fastify.get('/:statementId', async (request, reply) => {
    try {
      const { statementId } = request.params as { statementId: string };

      // TODO: Fetch from database
      const mockInvoice = {
        id: `inv_${statementId}`,
        statementId,
        amount: 150.00,
        currency: 'USD',
        status: 'pending',
        paymentUrl: `https://buy.stripe.com/test_${statementId}`,
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      return reply.send(mockInvoice);
    } catch (error) {
      fastify.log.error(error, 'Failed to fetch invoice');
      return reply.status(404).send({
        error: 'Invoice not found',
      });
    }
  });

  // Webhook endpoint for Stripe payment confirmations
  fastify.post('/webhook/stripe', async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      return reply.status(500).send({ error: 'Webhook secret not configured' });
    }

    try {
      const event = stripe.webhooks.constructEvent(
        request.body as string,
        sig,
        webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          const { statementId, ownerId } = paymentIntent.metadata;

          // Update statement as paid
          fastify.log.info({ statementId, ownerId }, 'Payment received for statement');

          // TODO: Update database, send confirmation email
          break;

        case 'payment_intent.payment_failed':
          fastify.log.warn({ event: event.data.object }, 'Payment failed');
          break;
      }

      return reply.send({ received: true });
    } catch (error) {
      fastify.log.error(error, 'Webhook error');
      return reply.status(400).send({ error: 'Webhook error' });
    }
  });
};

export default invoiceRoutes;