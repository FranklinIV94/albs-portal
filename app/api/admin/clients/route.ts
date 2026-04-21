import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/clients - List all clients with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const where: any = {};
    if (status) where.status = status;
    if (tier) where.clientTier = tier;
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          lead: { select: { id: true, aiiTier: true, aiiPipelineStage: true } },
          contracts: true,
          payments: true,
          subscriptions: { where: { status: 'ACTIVE' } },
          invoices: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.client.count({ where }),
    ]);

    return NextResponse.json({ clients, total, limit, offset });
  } catch (error: any) {
    console.error('Error fetching clients:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/clients - Create client manually
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, company, firstName, lastName, email, phone, status, clientTier, stripeCustomerId, billingAddress, billingCity, billingState, billingZip } = body;

    // If leadId provided, convert that lead
    if (leadId) {
      const lead = await prisma.lead.findUnique({ where: { id: leadId } });
      if (!lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      if (lead.convertedToClientAt) {
        return NextResponse.json({ error: 'Lead already converted to client' }, { status: 400 });
      }

      const client = await prisma.client.create({
        data: {
          leadId,
          company: company || lead.company,
          firstName: firstName || lead.firstName,
          lastName: lastName || lead.lastName,
          email: email || lead.email,
          phone: phone || lead.phone,
          status: status || 'PROSPECT',
          clientTier: clientTier || 'TIER_C',
          stripeCustomerId: stripeCustomerId || lead.stripeCustomerId,
          billingAddress,
          billingCity,
          billingState,
          billingZip,
        },
      });

      // Mark lead as converted
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          convertedToClientAt: new Date(),
          convertedToClientId: client.id,
        },
      });

      const clientWithRelations = await prisma.client.findUnique({
        where: { id: client.id },
        include: {
          lead: { select: { id: true, aiiTier: true, aiiPipelineStage: true } },
          contracts: true,
          payments: true,
          subscriptions: true,
          invoices: true,
        },
      });

      return NextResponse.json({ success: true, client: clientWithRelations }, { status: 201 });
    }

    // Create standalone client
    const client = await prisma.client.create({
      data: {
        company,
        firstName,
        lastName,
        email,
        phone,
        status: status || 'PROSPECT',
        clientTier: clientTier || 'TIER_C',
        stripeCustomerId,
        billingAddress,
        billingCity,
        billingState,
        billingZip,
      },
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}