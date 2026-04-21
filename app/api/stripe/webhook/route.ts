import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Lazy load Stripe - only when needed
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured');
  }
  const Stripe = require('stripe');
  return new Stripe(key);
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

// POST /api/stripe/webhook - Handle Stripe webhooks
export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature') || '';

  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the event
  switch (event.type) {
    // One-time payment completed
    case 'checkout.session.completed': {
      const session = event.data.object;
      const leadId = session.metadata?.leadId;
      const invoiceId = session.metadata?.invoiceId;
      const customerId = session.customer;
      const isSubscription = session.mode === 'subscription';

      // Handle invoice payment
      if (invoiceId) {
        await prisma.invoice.update({
          where: { id: invoiceId },
          data: {
            status: 'PAID',
            paidAt: new Date(),
          },
        });
      }

      if (leadId) {
        // Store stripe customer ID for card-on-file billing
        if (customerId) {
          await prisma.lead.update({
            where: { id: leadId },
            data: { stripeCustomerId: customerId },
          }).catch(() => {}); // Ignore if already exists
        }

        // Update payment status (one-time)
        if (!isSubscription) {
          await prisma.payment.updateMany({
            where: { stripeSessionId: session.id },
            data: {
              status: 'PAID',
              paidAt: new Date(),
            },
          });
        }

        // Update lead status to ACTIVE and mark onboarding complete
        await prisma.lead.update({
          where: { id: leadId },
          data: { 
            status: 'ACTIVE',
            onboardingStep: 5,
            onboardingCompleted: true,
          },
        });

        // Auto-convert: if lead has a paid payment and isn't already a client, create Client record
        try {
          const lead = await prisma.lead.findUnique({ where: { id: leadId } });
          if (lead && !lead.convertedToClientAt) {
            const client = await prisma.client.create({
              data: {
                leadId: lead.id,
                company: lead.company,
                firstName: lead.firstName,
                lastName: lead.lastName,
                email: lead.email,
                phone: lead.phone,
                status: 'ACTIVE',
                clientTier: lead.aiiTier === 'A' ? 'TIER_A' : lead.aiiTier === 'B' ? 'TIER_B' : 'TIER_C',
                stripeCustomerId: customerId || lead.stripeCustomerId || undefined,
                convertedAt: new Date(),
              },
            });

            // Mark lead as converted
            await prisma.lead.update({
              where: { id: leadId },
              data: {
                convertedToClientAt: new Date(),
                convertedToClientId: client.id,
              },
            });

            // Migrate the payment to the new client
            await prisma.payment.updateMany({
              where: { leadId, status: 'PAID' },
              data: { clientId: client.id },
            });

            // Migrate any existing subscription
            await prisma.subscription.updateMany({
              where: { leadId },
              data: { clientId: client.id },
            });

            console.log(`Auto-converted lead ${leadId} to client ${client.id}`);
          }
        } catch (convErr: any) {
          console.error('Auto-convert error (non-fatal):', convErr.message);
        }

        // Mark AIIO contract as paid if deposit
        try {
          const metadata = session.metadata || {};
          if (metadata.type === 'AIIO_DEPOSIT' && metadata.contractId) {
            const contract = await prisma.contract.findUnique({ where: { id: metadata.contractId } });
            if (contract && contract.terms) {
              const termsData = JSON.parse(contract.terms);
              termsData.paymentStatus = 'PAID';
              termsData.paidAt = new Date().toISOString();
              await prisma.contract.update({
                where: { id: metadata.contractId },
                data: { terms: JSON.stringify(termsData) },
              });
            }
          }
        } catch (contractErr: any) {
          console.error('Contract payment update error (non-fatal):', contractErr.message);
        }
      }
      break;
    }

    // Subscription created
    case 'customer.subscription.created': {
      const subscription = event.data.object;
      const leadId = subscription.metadata?.leadId;

      if (leadId) {
        // Calculate period dates
        const currentPeriodStart = new Date(subscription.current_period_start * 1000);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        
        // Get customer ID
        const customerId = subscription.customer;

        // Store stripe customer ID for card-on-file billing
        if (customerId) {
          await prisma.lead.update({
            where: { id: leadId },
            data: { stripeCustomerId: customerId },
          }).catch(() => {}); // Ignore if already exists
        }

        // Create subscription record
        await prisma.subscription.create({
          data: {
            leadId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customerId,
            status: subscription.status === 'active' ? 'ACTIVE' : 
                    subscription.status === 'trialing' ? 'TRIALING' : 
                    subscription.status === 'past_due' ? 'PAST_DUE' : 'INCOMPLETE',
            interval: subscription.items?.data[0]?.price?.recurring?.interval === 'year' 
              ? 'YEARLY' : 'MONTHLY',
            amount: subscription.items?.data[0]?.price?.unit_amount || 0,
            currency: subscription.currency || 'usd',
            currentPeriodStart,
            currentPeriodEnd,
          },
        });

        // Update payment record with subscription ID
        await prisma.payment.updateMany({
          where: { leadId, status: 'PENDING', paymentType: 'RECURRING' },
          data: {
            stripeSubscriptionId: subscription.id,
            status: 'PAID',
            paidAt: new Date(),
          },
        });

        // Mark onboarding complete
        await prisma.lead.update({
          where: { id: leadId },
          data: { 
            status: 'ACTIVE',
            onboardingStep: 5,
            onboardingCompleted: true,
          },
        });
      }
      break;
    }

    // Subscription updated (e.g., plan change, status change)
    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      
      const existingSub = await prisma.subscription.findUnique({
        where: { stripeSubscriptionId: subscription.id },
      });

      if (existingSub) {
        const currentPeriodStart = new Date(subscription.current_period_start * 1000);
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === 'active' ? 'ACTIVE' : 
                    subscription.status === 'canceled' ? 'CANCELED' :
                    subscription.status === 'past_due' ? 'PAST_DUE' : 
                    subscription.status === 'trialing' ? 'TRIALING' : 'INCOMPLETE',
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        });
      }
      break;
    }

    // Subscription deleted/canceled
    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      
      await prisma.subscription.update({
        where: { stripeSubscriptionId: subscription.id },
        data: { status: 'CANCELED' },
      });
      break;
    }

    // Invoice payment failed
    case 'invoice.payment_failed': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription as string;
      
      if (subscriptionId) {
        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: { status: 'PAST_DUE' },
        });
      }
      console.error('Invoice payment failed:', invoice.id);
      break;
    }

    // Invoice paid successfully (recurring)
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        // Update subscription period
        const currentPeriodStart = new Date(invoice.period_start * 1000);
        const currentPeriodEnd = new Date(invoice.period_end * 1000);

        await prisma.subscription.update({
          where: { stripeSubscriptionId: subscriptionId },
          data: {
            status: 'ACTIVE',
            currentPeriodStart,
            currentPeriodEnd,
            cancelAtPeriodEnd: false,
          },
        });

        // Create payment record for this invoice
        await prisma.payment.create({
          data: {
            leadId: invoice.metadata?.leadId || '',
            stripeSubscriptionId: subscriptionId,
            stripeSessionId: invoice.id,
            amount: invoice.amount_paid,
            status: 'PAID',
            paymentType: 'RECURRING',
            paidAt: new Date(),
          },
        });
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      console.error('Payment failed:', paymentIntent.id);
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}

// GET handler
export async function GET() {
  return NextResponse.json({ error: 'Use POST for webhook' }, { status: 405 });
}