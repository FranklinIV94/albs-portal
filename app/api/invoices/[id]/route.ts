import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/invoices/[id] - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            phone: true,
          }
        }
      }
    });
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    
    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('GET /api/invoices/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/invoices/[id] - Update invoice
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData: any = {};
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'PAID') {
        updateData.paidAt = new Date();
      }
    }
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.dueDate) updateData.dueDate = new Date(body.dueDate);
    if (body.stripeInvoiceId) updateData.stripeInvoiceId = body.stripeInvoiceId;
    if (body.stripeSessionId) updateData.stripeSessionId = body.stripeSessionId;
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('PATCH /api/invoices/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/invoices/[id] - Cancel invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    
    const invoice = await prisma.invoice.update({
      where: { id },
      data: { status: 'CANCELED' },
    });
    
    return NextResponse.json({ success: true, invoice });
  } catch (error: any) {
    console.error('DELETE /api/invoices/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
