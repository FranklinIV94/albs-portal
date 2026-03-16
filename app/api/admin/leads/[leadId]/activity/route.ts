import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/leads/[leadId]/activity - Get activity log for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const activities = await prisma.activityLog.findMany({
      where: { leadId: params.leadId },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent 50 activities
    });

    return NextResponse.json({ activities });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/leads/[leadId]/activity - Log an activity (for other services to call)
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } }
) {
  try {
    const body = await request.json();
    const { type, description, actor, metadata } = body;

    if (!type || !description) {
      return NextResponse.json({ error: 'Type and description are required' }, { status: 400 });
    }

    const activity = await prisma.activityLog.create({
      data: {
        leadId: params.leadId,
        type: type as any,
        description,
        actor: actor || null,
        metadata: metadata || null,
      },
    });

    return NextResponse.json({ activity });
  } catch (error: any) {
    console.error('Error logging activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}