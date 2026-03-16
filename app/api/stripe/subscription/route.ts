import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Lazy load Stripe
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured');
  }
  const Stripe = require('stripe');
  return new Stripe(key);
}

// GET /api/stripe/subscription - Get subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/stripe/subscription - Create subscription checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, interval = 'MONTHLY' } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Get lead with services
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        leadServices: {
          include: { service: true }
        }
      }
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (!lead.email) {
      return NextResponse.json({ error: 'Lead email required for subscription' }, { status: 400 });
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com';

    // Create price data for each service
    const priceData = lead.leadServices.map((ls: any) => {
      const service = ls.service;
      const price = ls.customPrice || service.basePrice;
      
      // Convert to monthly/yearly
      let unitAmount = price;
      if (interval === 'MONTHLY') {
        // If yearly price provided, divide by 12; otherwise use as-is
        // Assume basePrice is monthly
        unitAmount = price;
      } else if (interval === 'YEARLY') {
        unitAmount = price * 12;
      }

      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: service.name,
            description: `${service.description} (${interval.toLowerCase()})`,
          },
          unit_amount: unitAmount,
          recurring: {
            interval: interval === 'YEARLY' ? 'year' : 'month',
          },
        },
        quantity: 1,
      };
    });

    if (priceData.length === 0) {
      return NextResponse.json({ error: 'No services selected for subscription' }, { status: 400 });
    }

    // Create Stripe subscription checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: priceData,
      mode: 'subscription',
      success_url: `${baseUrl}/client/${lead.token}?subscription=active`,
      cancel_url: `${baseUrl}/onboard/${lead.token}?step=payment`,
      customer_email: lead.email,
      metadata: {
        leadId: lead.id,
        leadToken: lead.token,
        interval,
        type: 'subscription',
      },
    });

    // Create payment record for the subscription
    const firstPaymentAmount = priceData.reduce((sum: number, item: any) => 
      sum + (item.price_data?.unit_amount || 0), 0);

    await prisma.payment.create({
      data: {
        leadId: lead.id,
        stripeSessionId: session.id,
        amount: firstPaymentAmount,
        status: 'PENDING',
        paymentType: 'RECURRING',
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      interval,
    });
  } catch (error: any) {
    console.error('Subscription create error:', error);
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json({ error: 'Payment provider configuration error' }, { status: 500 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/stripe/subscription - Cancel subscription
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get('id');

    if (!subscriptionId) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    const stripe = getStripe();

    // Cancel at period end (don't charge immediately)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    // Update local record
    await prisma.subscription.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({ success: true, subscription });
  } catch (error: any) {
    console.error('Subscription cancel error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}