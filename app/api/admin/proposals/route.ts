import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/proposals - List all proposals
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    const where = leadId ? { leadId } : {};

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            status: true,
            token: true,
          }
        },
        services: {
          include: { service: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ proposals });
  } catch (error: any) {
    console.error('Error fetching proposals:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      leadId, 
      serviceSelections, // Array of { serviceId, customPrice, discountType, discountValue, notes }
      notes, // Overall proposal notes for client
      adminNotes, // Internal notes
      discountType, // PERCENT or FLAT
      discountValue,
    } = body;

    if (!leadId || !serviceSelections || serviceSelections.length === 0) {
      return NextResponse.json({ 
        error: 'Lead ID and at least one service are required' 
      }, { status: 400 });
    }

    // Check lead exists
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Create the proposal
    const proposal = await prisma.proposal.create({
      data: {
        leadId,
        status: 'DRAFT',
        notes,
        adminNotes,
        discountType,
        discountValue,
      },
    });

    // Create proposal services
    await prisma.proposalService.createMany({
      data: serviceSelections.map((sel: any) => ({
        proposalId: proposal.id,
        serviceId: sel.serviceId,
        customPrice: sel.customPrice,
        discountType: sel.discountType,
        discountValue: sel.discountValue,
        notes: sel.notes,
      })),
    });

    // Fetch the complete proposal
    const fullProposal = await prisma.proposal.findUnique({
      where: { id: proposal.id },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            company: true,
            token: true,
          }
        },
        services: {
          include: { service: true }
        }
      }
    });

    return NextResponse.json({ 
      success: true, 
      proposal: fullProposal,
      token: lead.token
    });
  } catch (error: any) {
    console.error('Error creating proposal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/proposals - Update proposal status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { proposalId, status } = body;

    if (!proposalId || !status) {
      return NextResponse.json({ 
        error: 'Proposal ID and status are required' 
      }, { status: 400 });
    }

    const proposal = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status },
    });

    return NextResponse.json({ success: true, proposal });
  } catch (error: any) {
    console.error('Error updating proposal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/proposals - Delete a proposal
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const proposalId = searchParams.get('proposalId');

    if (!proposalId) {
      return NextResponse.json({ error: 'Proposal ID is required' }, { status: 400 });
    }

    // Delete proposal services first
    await prisma.proposalService.deleteMany({ where: { proposalId } });
    
    // Delete proposal
    await prisma.proposal.delete({ where: { id: proposalId } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting proposal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}