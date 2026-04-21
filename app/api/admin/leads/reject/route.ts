import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/leads/reject - Reject a pending lead
export async function POST(request: NextRequest) {
  try {
    const { leadId, reason } = await request.json();
    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update data: set stage to REJECTED and optionally log reason
    const updateData: any = { aiiPipelineStage: 'REJECTED' };

    if (reason) {
      // Append rejection reason to operational signals
      const existingSignals = lead.aiiOperationalSignals || '';
      const separator = existingSignals ? ' | ' : '';
      updateData.aiiOperationalSignals = `${existingSignals}${separator}REJECTED: ${reason}`;
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: updateData,
    });

    return NextResponse.json({ success: true, leadId });
  } catch (error: any) {
    console.error('Error rejecting lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}