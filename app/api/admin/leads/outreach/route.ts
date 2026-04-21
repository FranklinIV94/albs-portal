import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/leads/outreach - Get all outreach logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const channel = searchParams.get('channel');
    const outcome = searchParams.get('outcome');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: any = {};
    if (leadId) where.leadId = leadId;
    if (channel) where.channel = channel;
    if (outcome) where.outcome = outcome;
    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = new Date(dateFrom);
      if (dateTo) where.date.lte = new Date(dateTo);
    }

    const logs = await prisma.aiiOutreachLog.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            company: true,
            aiiTier: true,
            aiiScore: true,
            aiiIndustry: true,
            aiiAssignedTo: true,
            aiiPipelineStage: true,
            aiiProduct: true,
            aiiFee: true,
            aiiProbability: true,
            aiiWeightedValue: true,
            aiiNextAction: true,
            aiiNextActionDate: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching outreach logs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
