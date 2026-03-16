import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Lazy load Stripe to avoid build-time initialization
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured. Please contact support.');
  }
  const Stripe = require('stripe');
  return new Stripe(key);
}

// Check if Stripe is configured
export async function GET() {
  const isConfigured = !!process.env.STRIPE_SECRET_KEY;
  return NextResponse.json({ 
    configured: isConfigured,
    message: isConfigured ? 'Stripe is ready' : 'Stripe is not configured'
  });
}

// POST /api/stripe/checkout - Create Stripe checkout session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Get lead with selected services
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

    // Calculate total from services
    const lineItems = lead.leadServices.map((ls: any) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: ls.service.name,
          description: ls.service.description,
        },
        unit_amount: ls.customPrice || ls.service.basePrice,
      },
      quantity: 1,
    }));

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No services selected' }, { status: 400 });
    }

    // Create Stripe session
    const stripe = getStripe();
    const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com';
    const successUrl = `${baseUrl}/onboard/${lead.token}?step=confirmation`;
    const cancelUrl = `${baseUrl}/onboard/${lead.token}?step=payment`;
    
    console.log('Creating Stripe session with URLs:', { successUrl, cancelUrl, baseUrl });
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: lead.email || undefined,
      metadata: {
        leadId: lead.id,
        leadToken: lead.token,
      },
    });

    // Create payment record
    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.price_data?.unit_amount || 0), 0);
    await prisma.payment.create({
      data: {
        leadId: lead.id,
        stripeSessionId: session.id,
        amount: totalAmount,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ 
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    // Provide more helpful error messages
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json({ error: 'Payment provider configuration error. Please contact support.' }, { status: 500 });
    }
    if (error.type === 'RateLimitError') {
      return NextResponse.json({ error: 'Payment system temporarily busy. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}