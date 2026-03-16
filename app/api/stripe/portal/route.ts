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

// POST /api/stripe/portal - Create Stripe billing portal session for client
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    // Get lead
    const lead = await prisma.lead.findUnique({ where: { token } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Find active subscription to get customer ID
    const subscription = await prisma.subscription.findFirst({
      where: { 
        leadId: lead.id,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription?.stripeCustomerId) {
      return NextResponse.json({ 
        error: 'No active subscription found. Please contact support to update your payment method.' 
      }, { status: 400 });
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com';

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${baseUrl}/client/${lead.token}`,
    });

    return NextResponse.json({ 
      url: session.url 
    });
  } catch (error: any) {
    console.error('Billing portal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}