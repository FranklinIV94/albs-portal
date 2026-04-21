import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/clients/[clientId] - Get client detail
export async function GET(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: params.clientId },
      include: {
        lead: { select: { id: true, aiiTier: true, aiiPipelineStage: true, status: true } },
        contracts: true,
        payments: { orderBy: { createdAt: 'desc' } },
        subscriptions: { where: { status: 'ACTIVE' } },
        invoices: { orderBy: { createdAt: 'desc' } },
        proposals: { include: { services: { include: { service: true } } } },
        projectTimeline: true,
        tasks: { orderBy: { createdAt: 'desc' } },
        clientRequests: { orderBy: { createdAt: 'desc' } },
        calendarEvents: { orderBy: { startTime: 'desc' } },
        bookingSlots: { where: { status: 'available' } },
        escalations: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/clients/[clientId] - Update client
export async function PATCH(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const body = await request.json();
    const { company, firstName, lastName, email, phone, status, clientTier, stripeCustomerId, billingAddress, billingCity, billingState, billingZip } = body;

    const client = await prisma.client.update({
      where: { id: params.clientId },
      data: {
        ...(company !== undefined && { company }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(status !== undefined && { status }),
        ...(clientTier !== undefined && { clientTier }),
        ...(stripeCustomerId !== undefined && { stripeCustomerId }),
        ...(billingAddress !== undefined && { billingAddress }),
        ...(billingCity !== undefined && { billingCity }),
        ...(billingState !== undefined && { billingState }),
        ...(billingZip !== undefined && { billingZip }),
      },
    });

    return NextResponse.json({ success: true, client });
  } catch (error: any) {
    console.error('Error updating client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}