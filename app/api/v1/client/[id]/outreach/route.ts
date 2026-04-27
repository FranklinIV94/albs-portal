import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/client/:id/outreach - Get outreach activity log for a client
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      select: {
        aiiLastTouched: true,
        aiiNextAction: true,
        aiiNextActionDate: true,
        aiiPipelineStage: true,
        aiiOutreachHook: true,
        aiiIndustry: true,
        aiiCity: true,
        aiiState: true,
        aiiTier: true,
        aiiScore: true,
        aiiAssignedTo: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get activity logs for this lead if they exist
    const activityLogs = await prisma.activityLog.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      outreach: {
        lastTouched: lead.aiiLastTouched,
        nextAction: lead.aiiNextAction,
        nextActionDate: lead.aiiNextActionDate,
        pipelineStage: lead.aiiPipelineStage,
        outreachHook: lead.aiiOutreachHook,
        tier: lead.aiiTier,
        score: lead.aiiScore,
        assignedTo: lead.aiiAssignedTo,
        industry: lead.aiiIndustry,
        city: lead.aiiCity,
        state: lead.aiiState,
      },
      activityLogs,
    });
  } catch (error: any) {
    console.error('GET /api/v1/client/:id/outreach error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/v1/client/:id/outreach - Log an outreach touch (Zo recording contact attempts)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { channel, outcome, notes, nextAction, nextActionDate } = body;

    // Verify lead exists
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Build activity log entry
    const activityData: any = {
      leadId: id,
      action: `outreach_${channel || 'contact'}`,
      description: notes || `Outreach via ${channel || 'contact'}`,
      metadata: { outcome, channel },
    };

    const activity = await prisma.activityLog.create({
      data: activityData,
    });

    // Update lead AIIO fields
    const leadUpdate: any = {
      aiiLastTouched: new Date(),
    };
    if (outcome) leadUpdate.aiiTier = outcomeToTier(outcome);
    if (nextAction) leadUpdate.aiiNextAction = nextAction;
    if (nextActionDate) leadUpdate.aiiNextActionDate = new Date(nextActionDate);

    await prisma.lead.update({
      where: { id },
      data: leadUpdate,
    });

    return NextResponse.json({ success: true, activity });
  } catch (error: any) {
    console.error('POST /api/v1/client/:id/outreach error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function outcomeToTier(outcome: string): string {
  const map: Record<string, string> = {
    replied: 'A',
    booked: 'A',
    signed: 'A',
    interested: 'A',
    pending: 'B',
    no_answer: 'B',
    voicemail: 'B',
    not_interested: 'C',
    wrong_number: 'C',
    unresponsive: 'C',
  };
  return map[outcome] || 'B';
}
