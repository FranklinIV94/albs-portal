import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/clients/[clientId]/invoices - Create invoice for client
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const clientId = params.clientId;
    const body = await request.json();

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!body.lineItems || body.lineItems.length === 0) {
      return NextResponse.json({ error: 'lineItems are required' }, { status: 400 });
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of body.lineItems) {
      const unitPrice = item.unitPrice || 0;
      const quantity = item.quantity || 1;
      item.total = unitPrice * quantity;
      subtotal += item.total;
    }

    const taxRate = body.taxRate || 0;
    const taxAmount = Math.round(subtotal * (taxRate / 10000));
    const total = subtotal + taxAmount;

    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(5, '0')}`;

    const dueDate = body.dueDate
      ? new Date(body.dueDate)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName: body.clientName || `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.company || 'Unknown',
        clientEmail: body.clientEmail || client.email,
        clientPhone: body.clientPhone || client.phone,
        leadId: client.leadId,
        clientId,
        lineItems: body.lineItems,
        subtotal,
        taxRate,
        taxAmount,
        total,
        status: body.status || 'DRAFT',
        dueDate,
        notes: body.notes,
      },
      include: {
        lead: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
        client: { select: { id: true, company: true, firstName: true, lastName: true, email: true } },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client invoice:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}