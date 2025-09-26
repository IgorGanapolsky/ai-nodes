import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Subscription created:', subscription.id);
  
  // TODO: Update user subscription status in database
  // Example:
  // await updateUserSubscription(subscription.customer, {
  //   subscriptionId: subscription.id,
  //   status: subscription.status,
  //   tier: subscription.metadata.tier,
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  // });
  
  // Send welcome email
  // await sendWelcomeEmail(subscription.customer);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  // TODO: Update user subscription status in database
  // await updateUserSubscription(subscription.customer, {
  //   status: subscription.status,
  //   currentPeriodEnd: new Date(subscription.current_period_end * 1000),
  // });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  // TODO: Update user subscription status in database
  // await updateUserSubscription(subscription.customer, {
  //   status: 'canceled',
  //   canceledAt: new Date(),
  // });
  
  // Send cancellation email
  // await sendCancellationEmail(subscription.customer);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  // TODO: Record successful payment
  // await recordPayment({
  //   invoiceId: invoice.id,
  //   customerId: invoice.customer,
  //   amount: invoice.amount_paid,
  //   currency: invoice.currency,
  //   status: 'succeeded',
  // });
  
  // Send payment confirmation email
  // await sendPaymentConfirmationEmail(invoice.customer, invoice);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed:', invoice.id);
  
  // TODO: Handle failed payment
  // await recordPayment({
  //   invoiceId: invoice.id,
  //   customerId: invoice.customer,
  //   amount: invoice.amount_due,
  //   currency: invoice.currency,
  //   status: 'failed',
  // });
  
  // Send payment failure notification
  // await sendPaymentFailureEmail(invoice.customer, invoice);
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Checkout completed:', session.id);
  
  // TODO: Handle successful checkout
  // const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  // await handleSubscriptionCreated(subscription);
  
  // Track conversion
  // await trackConversion({
  //   sessionId: session.id,
  //   customerId: session.customer,
  //   tier: session.metadata?.tier,
  //   amount: session.amount_total,
  // });
}
