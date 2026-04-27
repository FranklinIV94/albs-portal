import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/leads - List leads with full AIIO + enrichment data
// Query params: status, industry, city, state, search, limit, offset, tier, minScore
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const industry = searchParams.get('industry');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const tier = searchParams.get('tier');
    const minScore = searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined;

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (industry) where.aiiIndustry = industry;
    if (city) where.aiiCity = { contains: city, mode: 'insensitive' };
    if (state) where.aiiState = state;
    if (tier) where.aiiTier = tier;
    if (minScore) where.aiiScore = { gte: minScore };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { aiiScore: 'desc' },
        select: {
          id: true,
          token: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          company: true,
          title: true,
          status: true,
          notes: true,
          serviceCategories: true,
          createdAt: true,
          updatedAt: true,
          // AIIO pipeline fields
          aiiTier: true,
          aiiScore: true,
          aiiIndustry: true,
          aiiCity: true,
          aiiState: true,
          aiiWebsite: true,
          aiiOutreachHook: true,
          aiiOperationalSignals: true,
          aiiAssignedTo: true,
          aiiLastTouched: true,
          aiiNextAction: true,
          aiiNextActionDate: true,
          aiiPipelineStage: true,
          aiiProduct: true,
          aiiFee: true,
          aiiProbability: true,
          aiiWeightedValue: true,
          aiiCloseDate: true,
          // Enrichment data (JSON)
          enrichedData: true,
          // Relations
          leadServices: { include: { service: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    // Pipeline summary
    const pipelineCounts = await prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true },
      where: status ? { status } : {},
    });

    const pipelineSummary = pipelineCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      leads,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      pipelineSummary,
    });
  } catch (error: any) {
    console.error('GET /api/v1/leads error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/v1/leads - Update lead fields (AIIO pipeline, status, enrichment)
export async function PATCH(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { leadId, ...updates } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    }

    // Build update data from allowed fields
    const allowedFields = [
      'status', 'notes', 'serviceCategories', 'firstName', 'lastName',
      'aiiTier', 'aiiScore', 'aiiOutreachHook', 'aiiIndustry', 'aiiCity', 'aiiState',
      'aiiWebsite', 'aiiOperationalSignals', 'aiiAssignedTo', 'aiiNextAction',
      'aiiPipelineStage', 'aiiProduct', 'aiiFee', 'aiiProbability', 'enrichedData',
    ];

    const data: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        data[field] = updates[field];
      }
    }

    // Handle date fields
    if (updates.aiiLastTouched) data.aiiLastTouched = new Date(updates.aiiLastTouched);
    if (updates.aiiNextActionDate) data.aiiNextActionDate = new Date(updates.aiiNextActionDate);
    if (updates.aiiCloseDate) data.aiiCloseDate = new Date(updates.aiiCloseDate);

    // Calculate weighted value if fee + probability provided
    if (data.aiiFee != null && data.aiiProbability != null) {
      data.aiiWeightedValue = Math.round((data.aiiFee * data.aiiProbability) / 100);
    }

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data,
      include: { leadServices: { include: { service: true } } },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('PATCH /api/v1/leads error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}