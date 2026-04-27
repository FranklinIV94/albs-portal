import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/marketing-plans/targets — Add target(s) to a plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { planId, targets } = body;

    if (!planId) return NextResponse.json({ error: 'planId required' }, { status: 400 });
    if (!targets || !Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json({ error: 'targets array required' }, { status: 400 });
    }

    const created = [];
    for (const t of targets) {
      const target = await prisma.marketingTarget.create({
        data: {
          planId,
          leadId: t.leadId || null,
          companyName: t.companyName || null,
          contactName: t.contactName || null,
          phone: t.phone || null,
          email: t.email || null,
          industry: t.industry || null,
          city: t.city || null,
          state: t.state || null,
          dealSize: t.dealSize ? Math.round(t.dealSize * 100) : null,
          notes: t.notes || null,
          outreachStatus: 'PENDING',
        },
      });
      created.push(target);
    }

    // Update plan totalLeads
    const count = await prisma.marketingTarget.count({ where: { planId } });
    await prisma.marketingPlan.update({ where: { id: planId }, data: { totalLeads: count } });

    return NextResponse.json({ success: true, targets: created });
  } catch (error: any) {
    console.error('POST targets error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/marketing-plans/targets — Update a target
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { targetId, ...updates } = body;

    if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });

    const data: any = { updatedAt: new Date() };
    if (updates.outreachStatus !== undefined) {
      data.outreachStatus = updates.outreachStatus;
      // Update outcome and closedAt based on status
      if (updates.outreachStatus === 'CLOSED_WON') {
        data.outcome = 'CLOSED_WON';
        data.closedAt = new Date();
      } else if (updates.outreachStatus === 'CLOSED_LOST' || updates.outreachStatus === 'DISQUALIFIED') {
        data.outcome = updates.outreachStatus === 'CLOSED_LOST' ? 'CLOSED_LOST' : 'DISQUALIFIED';
        data.closedAt = new Date();
      }
    }
    if (updates.touchCount !== undefined) data.touchCount = updates.touchCount;
    if (updates.lastTouchDate !== undefined) data.lastTouchDate = updates.lastTouchDate ? new Date(updates.lastTouchDate) : null;
    if (updates.nextAction !== undefined) data.nextAction = updates.nextAction;
    if (updates.nextActionDate !== undefined) data.nextActionDate = updates.nextActionDate ? new Date(updates.nextActionDate) : null;
    if (updates.notes !== undefined) data.notes = updates.notes;
    if (updates.dealSize !== undefined) data.dealSize = updates.dealSize ? Math.round(updates.dealSize * 100) : null;
    if (updates.outcome !== undefined) data.outcome = updates.outcome;

    const target = await prisma.marketingTarget.update({ where: { id: targetId }, data });

    // Recalculate plan close stats if outcome changed
    if (updates.outreachStatus) {
      const planId = target.planId;
      const all = await prisma.marketingTarget.findMany({ where: { planId } });
      const won = all.filter(t => t.outcome === 'CLOSED_WON').length;
      await prisma.marketingPlan.update({
        where: { id: planId },
        data: { convertedLeads: won },
      });
    }

    return NextResponse.json({ success: true, target });
  } catch (error: any) {
    console.error('PATCH target error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/marketing-plans/targets — Remove target
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const targetId = searchParams.get('targetId');
    if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 });

    const target = await prisma.marketingTarget.findUnique({ where: { id: targetId } });
    if (!target) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.marketingTarget.delete({ where: { id: targetId } });

    // Update plan totalLeads
    const count = await prisma.marketingTarget.count({ where: { planId: target.planId } });
    await prisma.marketingPlan.update({
      where: { id: target.planId },
      data: { totalLeads: count },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE target error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
