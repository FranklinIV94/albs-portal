import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendInvoiceEmail } from '@/lib/email';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('Stripe not configured');
  const Stripe = require('stripe');
  return new Stripe(key);
}

// POST /api/invoices/checkout - Create Stripe session for invoice and send email
export async function POST(request: NextRequest) {
  // Auth handled by middleware for admin routes
  
  try {
    const body = await request.json();
    const { invoiceId, sendEmail: shouldSendEmail } = body;

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
    }

    // Get invoice
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { lead: true }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 });
    }

    // Create Stripe checkout session
    const stripe = getStripe();
    const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com';
    
    const lineItems = (invoice.lineItems as any[]).map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.description,
        },
        unit_amount: item.unitPrice,
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/admin?paid=${invoice.id}`,
      cancel_url: `${baseUrl}/admin`,
      customer_email: invoice.clientEmail || undefined,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
    });

    // Update invoice with Stripe session ID
    await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        stripeSessionId: session.id,
        status: 'SENT',
      }
    });

    // Create Payment record (pending until paid) - leadId is required but invoice.leadId may be null for some records
    const paymentLeadId = invoice.leadId;
    if (paymentLeadId) {
      await prisma.payment.create({
        data: {
          leadId: paymentLeadId,
          stripeSessionId: session.id,
          amount: invoice.total,
          status: 'PENDING',
          paymentType: 'ONE_TIME',
        },
      });
    }

    // Send email with payment link if requested
    let emailResult = null;
    if (shouldSendEmail && invoice.clientEmail) {
      emailResult = await sendInvoiceEmail({
        to: invoice.clientEmail,
        clientName: invoice.clientName,
        invoiceNumber: invoice.invoiceNumber,
        lineItems: invoice.lineItems as any[],
        subtotal: invoice.subtotal,
        taxRate: invoice.taxRate,
        taxAmount: invoice.taxAmount,
        total: invoice.total,
        dueDate: invoice.dueDate?.toISOString() || new Date().toISOString(),
        paymentUrl: session.url,
        notes: invoice.notes || undefined,
      });
    }

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      paymentUrl: session.url,
      emailSent: !!emailResult,
      emailResult,
    });

  } catch (error: any) {
    console.error('Invoice checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
