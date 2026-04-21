import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/clients/[clientId]/convert - Convert a Lead to Client
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const clientId = params.clientId;
    const client = await prisma.client.findUnique({ where: { id: clientId } });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    if (!client.leadId) {
      return NextResponse.json({ error: 'Client has no associated lead to convert' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { id: client.leadId },
      include: {
        contracts: true,
        payments: true,
        subscriptions: true,
        invoices: true,
        proposals: true,
        projectTimeline: true,
        tasks: true,
        clientRequests: true,
        calendarEvents: true,
        bookingSlots: true,
        escalations: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Associated lead not found' }, { status: 404 });
    }

    if (lead.convertedToClientAt) {
      return NextResponse.json({ error: 'Lead already converted' }, { status: 400 });
    }

    // Migrate relations from Lead to Client
    const txResults = await prisma.$transaction(async (tx) => {
      // Mark lead as converted
      await tx.lead.update({
        where: { id: lead.id },
        data: {
          convertedToClientAt: new Date(),
          convertedToClientId: clientId,
          status: 'ACTIVE',
        },
      });

      // Migrate contracts
      for (const contract of lead.contracts) {
        await tx.contract.update({ where: { id: contract.id }, data: { clientId } });
      }
      // Migrate payments
      for (const payment of lead.payments) {
        await tx.payment.update({ where: { id: payment.id }, data: { clientId } });
      }
      // Migrate subscriptions
      for (const sub of lead.subscriptions) {
        await tx.subscription.update({ where: { id: sub.id }, data: { clientId } });
      }
      // Migrate invoices
      for (const inv of lead.invoices) {
        await tx.invoice.update({ where: { id: inv.id }, data: { clientId } });
      }
      // Migrate proposals
      for (const prop of lead.proposals) {
        await tx.proposal.update({ where: { id: prop.id }, data: { clientId } });
      }
      // Migrate project timeline
      if (lead.projectTimeline) {
        await tx.projectTimeline.update({ where: { id: lead.projectTimeline.id }, data: { clientId } });
      }
      // Migrate tasks
      for (const task of lead.tasks) {
        await tx.task.update({ where: { id: task.id }, data: { clientId } });
      }
      // Migrate client requests
      for (const req of lead.clientRequests) {
        await tx.clientRequest.update({ where: { id: req.id }, data: { clientId } });
      }
      // Migrate calendar events
      for (const evt of lead.calendarEvents) {
        await tx.calendarEvent.update({ where: { id: evt.id }, data: { clientId } });
      }
      // Migrate booking slots
      for (const slot of lead.bookingSlots) {
        await tx.bookingSlot.update({ where: { id: slot.id }, data: { clientId } });
      }
      // Migrate escalations
      for (const esc of lead.escalations) {
        await tx.escalation.update({ where: { id: esc.id }, data: { clientId } });
      }

      // Update client status
      await tx.client.update({
        where: { id: clientId },
        data: { status: 'ACTIVE', convertedAt: new Date() },
      });

      return { migrated: true };
    });

    const updatedClient = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        lead: true,
        contracts: true,
        payments: true,
        subscriptions: true,
        invoices: true,
        proposals: true,
        projectTimeline: true,
        tasks: true,
        clientRequests: true,
      },
    });

    return NextResponse.json({ success: true, client: updatedClient, migrated: txResults.migrated });
  } catch (error: any) {
    console.error('Error converting lead to client:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}