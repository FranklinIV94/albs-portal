import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/marketing-plans/metrics — Log a metric
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, metric, value, notes } = body;

    if (!planId || !metric || value === undefined) {
      return NextResponse.json({ error: 'planId, metric, and value are required' }, { status: 400 });
    }

    const record = await prisma.marketingMetric.create({
      data: {
        planId,
        metric,
        value: Number(value),
        notes: notes || null,
      },
    });

    return NextResponse.json({ success: true, metric: record });
  } catch (error: any) {
    console.error('POST metric error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/admin/marketing-plans/metrics?planId=xxx — Get metrics for a plan
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

    const metrics = await prisma.marketingMetric.findMany({
      where: { planId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ metrics });
  } catch (error: any) {
    console.error('GET metrics error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
