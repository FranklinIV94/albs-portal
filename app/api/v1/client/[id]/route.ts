import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/client/:id - Full client profile (post-onboarding)
// Zo uses this to pull complete client context for service requests
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        leadServices: {
          include: {
            service: {
              select: {
                id: true,
                name: true,
                category: true,
                description: true,
                priceDisplay: true,
                basePrice: true,
                icon: true,
              },
            },
          },
        },
        clientRequests: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        contracts: true,
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        positions: true,
        availability: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Build Zo-friendly client summary
    const client = {
      id: lead.id,
      token: lead.token,
      firstName: lead.firstName,
      lastName: lead.lastName,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      title: lead.title,
      status: lead.status,
      onboardingCompleted: lead.onboardingCompleted,
      createdAt: lead.createdAt,
      // Active services
      services: lead.leadServices.map(ls => ({
        id: ls.service.id,
        name: ls.service.name,
        category: ls.service.category,
        description: ls.service.description,
        priceDisplay: ls.service.priceDisplay,
        icon: ls.service.icon,
        customPrice: ls.customPrice,
      })),
      // Recent messages/requests
      recentRequests: lead.clientRequests.map(r => ({
        id: r.id,
        subject: r.subject,
        message: r.message,
        status: r.status,
        createdAt: r.createdAt,
      })),
      // Payment summary
      payments: lead.payments.map(p => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        createdAt: p.createdAt,
      })),
      // Contracts
      contracts: lead.contracts.map(c => ({
        id: c.id,
        contractType: c.contractType,
        signedAt: c.signedAt,
      })),
      // AIIO data for pipeline context
      pipeline: {
        aiiTier: lead.aiiTier,
        aiiScore: lead.aiiScore,
        aiiIndustry: lead.aiiIndustry,
        aiiCity: lead.aiiCity,
        aiiState: lead.aiiState,
        aiiLastTouched: lead.aiiLastTouched,
        aiiNextAction: lead.aiiNextAction,
        aiiNextActionDate: lead.aiiNextActionDate,
        aiiPipelineStage: lead.aiiPipelineStage,
      },
      // Notes
      notes: lead.notes,
      // Enrichment context
      enrichedData: lead.enrichedData,
    };

    return NextResponse.json({ client });
  } catch (error: any) {
    console.error('GET /api/v1/client/:id error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/v1/client/:id - Update client fields (Zo can update status, add notes)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status, notes, aiiTier, aiiScore, aiiNextAction, aiiNextActionDate, aiiPipelineStage, enrichedData } = body;

    const data: any = {};
    if (status) data.status = status;
    if (notes !== undefined) data.notes = notes;
    if (aiiTier !== undefined) data.aiiTier = aiiTier;
    if (aiiScore !== undefined) data.aiiScore = aiiScore;
    if (aiiNextAction !== undefined) data.aiiNextAction = aiiNextAction;
    if (aiiNextActionDate !== undefined) data.aiiNextActionDate = new Date(aiiNextActionDate);
    if (aiiPipelineStage !== undefined) data.aiiPipelineStage = aiiPipelineStage;
    if (enrichedData !== undefined) data.enrichedData = enrichedData;

    const lead = await prisma.lead.update({
      where: { id },
      data,
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('PATCH /api/v1/client/:id error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
