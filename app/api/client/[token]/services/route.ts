import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;
    const { serviceId } = await request.json();

    if (!serviceId) {
      return NextResponse.json({ success: false, error: 'serviceId required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { token } });
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Check if already has this service
    const existing = await prisma.leadService.findUnique({
      where: { leadId_serviceId: { leadId: lead.id, serviceId } },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: 'Service already added' }, { status: 400 });
    }

    const leadService = await prisma.leadService.create({
      data: { leadId: lead.id, serviceId },
    });

    // Create a client request notification for admin
    await prisma.clientRequest.create({
      data: {
        leadId: lead.id,
        subject: `New Service Request: ${serviceId}`,
        message: `Client ${lead.email} added a new service (${serviceId}) via the client portal.`,
        status: 'OPEN',
      },
    });

    return NextResponse.json({ success: true, leadService });
  } catch (error: any) {
    console.error('Error adding service:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
