import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/invoices - List invoices (with filters)
export async function GET(request: NextRequest) {
  // Auth handled by middleware for admin routes - no additional API key needed
  // when called from the admin dashboard
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const leadId = searchParams.get('leadId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {};
    if (status) where.status = status;
    if (leadId) where.leadId = leadId;
    
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
            }
          }
        }
      }),
      prisma.invoice.count({ where })
    ]);
    
    return NextResponse.json({ invoices, total, limit, offset });
  } catch (error: any) {
    console.error('GET /api/invoices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/invoices - Create new invoice (for Zo or manual)
export async function POST(request: NextRequest) {
  // Auth handled by middleware for admin routes
  
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.clientName || !body.lineItems || body.lineItems.length === 0) {
      return NextResponse.json(
        { error: 'clientName and lineItems are required' },
        { status: 400 }
      );
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
    const taxAmount = Math.round(subtotal * (taxRate / 10000)); // taxRate in basis points (e.g., 725 = 7.25%)
    const total = subtotal + taxAmount;
    
    // Generate invoice number
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-2026-${String(count + 1).padStart(5, '0')}`;
    
    // Calculate due date (default 30 days)
    const dueDate = body.dueDate 
      ? new Date(body.dueDate) 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        clientName: body.clientName,
        clientEmail: body.clientEmail,
        clientPhone: body.clientPhone,
        leadId: body.leadId,
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
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
          }
        }
      }
    });
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/invoices error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
