import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/marketing-plans — List all plans (with targets + metrics)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (planId) {
      const plan = await prisma.marketingPlan.findUnique({
        where: { id: planId },
        include: {
          targets: {
            include: { lead: { select: { company: true, phone: true, email: true } } },
            orderBy: { createdAt: 'asc' },
          },
          metrics: { orderBy: { date: 'desc' }, take: 100 },
        },
      });
      if (!plan) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json({ plan });
    }

    const plans = await prisma.marketingPlan.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { targets: true } },
      },
    });

    // Calculate close rates
    const plansWithMetrics = plans.map(p => ({
      ...p,
      actualCloseRate: p.totalLeads > 0 ? Math.round((p.convertedLeads / p.totalLeads) * 100) : 0,
    }));

    return NextResponse.json({ plans: plansWithMetrics });
  } catch (error: any) {
    console.error('GET /api/admin/marketing-plans error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/marketing-plans — Create plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, description, targetCloseRate, startDate, endDate, budget, notes, createdById
    } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Plan name is required' }, { status: 400 });
    }

    const plan = await prisma.marketingPlan.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        targetCloseRate: targetCloseRate || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: budget ? Math.round(budget * 100) : null,
        notes: notes?.trim() || null,
        createdById: createdById || null,
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('POST /api/admin/marketing-plans error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/marketing-plans — Update plan
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, ...updates } = body;

    if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

    const data: any = { updatedAt: new Date() };
    if (updates.name !== undefined) data.name = updates.name.trim();
    if (updates.description !== undefined) data.description = updates.description?.trim() || null;
    if (updates.status !== undefined) data.status = updates.status;
    if (updates.targetCloseRate !== undefined) data.targetCloseRate = updates.targetCloseRate;
    if (updates.startDate !== undefined) data.startDate = updates.startDate ? new Date(updates.startDate) : null;
    if (updates.endDate !== undefined) data.endDate = updates.endDate ? new Date(updates.endDate) : null;
    if (updates.budget !== undefined) data.budget = updates.budget ? Math.round(updates.budget * 100) : null;
    if (updates.notes !== undefined) data.notes = updates.notes?.trim() || null;

    const plan = await prisma.marketingPlan.update({ where: { id: planId }, data });

    // If status changed to ACTIVE, recalc metrics
    if (updates.status === 'ACTIVE') {
      const targets = await prisma.marketingTarget.findMany({ where: { planId } });
      const total = targets.length;
      const converted = targets.filter(t => t.outcome === 'CLOSED_WON').length;
      await prisma.marketingPlan.update({
        where: { id: planId },
        data: { totalLeads: total, convertedLeads: converted },
      });
    }

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('PATCH /api/admin/marketing-plans error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/marketing-plans — Delete plan
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');
    if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });

    await prisma.marketingPlan.delete({ where: { id: planId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE /api/admin/marketing-plans error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
