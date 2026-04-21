import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/client/[token]/portal — Get portal data for signed+paid clients
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    const lead = await prisma.lead.findUnique({
      where: { token },
      include: { client: true },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Invalid access link' }, { status: 401 });
    }

    const client = lead.client || (lead.convertedToClientId
      ? await prisma.client.findUnique({ where: { id: lead.convertedToClientId } })
      : null);

    if (!client) {
      return NextResponse.json({ success: false, error: 'No client record found' }, { status: 404 });
    }

    // Check for contract
    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ clientId: client.id }, { leadId: lead.id }],
        contractType: 'AIIO_SERVICE_AGREEMENT',
      },
      orderBy: { createdAt: 'desc' },
    });

    // If no contract or not signed, redirect to contract page
    if (!contract || !contract.signedAt) {
      return NextResponse.json({
        success: false,
        error: 'Contract not signed yet',
        redirect: 'contract',
      }, { status: 403 });
    }

    // Check for deposit payment
    const depositPayment = await prisma.payment.findFirst({
      where: {
        OR: [{ clientId: client.id }, { leadId: lead.id }],
        status: 'PAID',
        paymentType: 'ONE_TIME',
      },
      orderBy: { paidAt: 'desc' },
    });

    // Get all payments
    const payments = await prisma.payment.findMany({
      where: {
        OR: [{ clientId: client.id }, { leadId: lead.id }],
      },
      orderBy: { createdAt: 'desc' },
    });

    // Determine project status
    let projectStatus = 'Kickoff Scheduled';
    const tasks = await prisma.task.findMany({
      where: {
        OR: [{ clientId: client.id }, { leadId: lead.id }],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (tasks.some(t => t.status === 'IN_PROGRESS')) projectStatus = 'In Progress';
    if (tasks.some(t => t.status === 'COMPLETED') && !tasks.some(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS')) projectStatus = 'Complete';

    return NextResponse.json({
      success: true,
      client: {
        id: client.id,
        company: client.company,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
      },
      lead: {
        aiiProduct: lead.aiiProduct,
        aiiFee: lead.aiiFee,
      },
      contract: {
        signedAt: contract.signedAt,
        signatureName: contract.signatureName,
      },
      payments: payments.map(p => ({
        amount: p.amount,
        status: p.status,
        paidAt: p.paidAt,
      })),
      projectStatus,
    });
  } catch (error: any) {
    console.error('Error fetching portal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}