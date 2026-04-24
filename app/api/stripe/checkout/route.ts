import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured.');
  const Stripe = require('stripe');
  return new Stripe(key);
}

export async function GET() {
  const isConfigured = !!process.env.STRIPE_SECRET_KEY;
  return NextResponse.json({ configured: isConfigured, message: isConfigured ? 'Stripe is ready' : 'Stripe not configured' });
}

// POST /api/stripe/checkout
// Body: { leadId, consultationType?, depositAmount?, consultationLabel? }
// If consultationType is set, creates a consultation deposit session.
// Otherwise falls back to service-based payment (existing behavior).
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, consultationType, depositAmount, consultationLabel } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com';
    const stripe = getStripe();

    // === CONSULTATION DEPOSIT FLOW ===
    if (consultationType && depositAmount) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Consultation Deposit: ${consultationLabel || consultationType}`,
                description: `Refundable deposit to secure your ${consultationType} booking. Applied toward final invoice.`,
              },
              unit_amount: depositAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${baseUrl}/client/${lead.token}?booked=${consultationType}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/client/${lead.token}?tab=4`,
        customer_email: lead.email || undefined,
        metadata: {
          leadId: lead.id,
          leadToken: lead.token,
          type: 'consultation_deposit',
          consultationType,
        },
      });

      // Record pending payment
      await prisma.payment.create({
        data: {
          leadId: lead.id,
          stripeSessionId: session.id,
          amount: depositAmount,
          status: 'PENDING',
          paymentType: 'ONE_TIME',
        },
      });

      return NextResponse.json({ sessionId: session.id, url: session.url });
    }

    // === SERVICE PAYMENT FLOW (existing) ===
    const leadWithServices = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { leadServices: { include: { service: true } } },
    });

    if (!leadWithServices) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const lineItems = leadWithServices.leadServices.map((ls: any) => ({
      price_data: {
        currency: 'usd',
        product_data: { name: ls.service.name, description: ls.service.description },
        unit_amount: ls.customPrice || ls.service.basePrice,
      },
      quantity: 1,
    }));

    if (lineItems.length === 0) {
      return NextResponse.json({ error: 'No services selected' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/onboard/${lead.token}?step=confirmation`,
      cancel_url: `${baseUrl}/onboard/${lead.token}?step=payment`,
      customer_email: lead.email || undefined,
      metadata: { leadId: lead.id, leadToken: lead.token, type: 'service_payment' },
    });

    const totalAmount = lineItems.reduce((sum: number, item: any) => sum + (item.price_data?.unit_amount || 0), 0);
    await prisma.payment.create({
      data: {
        leadId: lead.id,
        stripeSessionId: session.id,
        amount: totalAmount,
        status: 'PENDING',
        paymentType: 'ONE_TIME',
      },
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    if (error.type === 'StripeAuthenticationError') {
      return NextResponse.json({ error: 'Payment provider error. Please contact support.' }, { status: 500 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
