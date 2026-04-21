import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe is not configured');
  const Stripe = require('stripe');
  return new Stripe(key);
}

// POST /api/admin/clients/[clientId]/deposit-checkout - Create Stripe checkout for deposit
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const clientId = params.clientId;
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { lead: true, contracts: { where: { contractType: 'AIIO_SERVICE_AGREEMENT' }, orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Find the contract to get the deposit amount
    const contract = client.contracts[0];
    if (!contract || !contract.terms) {
      return NextResponse.json({ error: 'No AIIO service agreement found. Generate a contract first.' }, { status: 400 });
    }

    const contractData = JSON.parse(contract.terms);
    const depositAmount = contractData.pricing?.depositAmount;
    if (!depositAmount || depositAmount <= 0) {
      return NextResponse.json({ error: 'Invalid deposit amount in contract' }, { status: 400 });
    }

    const leadToken = client.lead?.token;
    if (!leadToken) {
      return NextResponse.json({ error: 'No token found for client' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://onboarding.simplifyingbusinesses.com';

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: depositAmount,
            product_data: {
              name: `${contractData.service?.name || 'AIIO Service'} — Deposit`,
              description: `50% deposit for ${contractData.service?.name || 'AIIO Service'}`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        clientId,
        leadId: client.leadId || '',
        contractId: contract.id,
        type: 'AIIO_DEPOSIT',
      },
      success_url: `${baseUrl}/client/${leadToken}/contract?payment=success`,
      cancel_url: `${baseUrl}/client/${leadToken}/contract?payment=cancelled`,
      customer_email: client.email || undefined,
    });

    // Create pending payment record
    await prisma.payment.create({
      data: {
        clientId,
        leadId: client.leadId,
        stripeSessionId: session.id,
        amount: depositAmount,
        status: 'PENDING',
        paymentType: 'ONE_TIME',
      },
    });

    return NextResponse.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Error creating deposit checkout:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}