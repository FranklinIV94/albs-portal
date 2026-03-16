import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/admin/leads/[leadId]/messages - Get all messages for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    
    const messages = await prisma.clientRequest.findMany({
      where: { leadId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/leads/[leadId]/messages - Create a new message for a lead
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const body = await request.json();
    const { subject, message, status } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    const clientRequest = await prisma.clientRequest.create({
      data: {
        leadId,
        subject,
        message,
        status: status || 'OPEN',
      },
    });

    return NextResponse.json({ success: true, message: clientRequest });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/leads/[leadId]/messages - Update a message (status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params;
    const body = await request.json();
    const { messageId, status } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const clientRequest = await prisma.clientRequest.update({
      where: { id: messageId },
      data: {
        ...(status && { status: status as any }),
      },
    });

    return NextResponse.json({ success: true, message: clientRequest });
  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}