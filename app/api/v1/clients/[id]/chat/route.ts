import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/clients/[id]/chat - Get chat messages for client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Check if client exists
    const client = await prisma.lead.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    const [messages, total] = await Promise.all([
      prisma.clientRequest.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.clientRequest.count({ where: { leadId: id } }),
    ]);
    
    // Get unread count
    const unreadCount = await prisma.clientRequest.count({
      where: { leadId: id, status: 'OPEN' },
    });
    
    return NextResponse.json({
      messages: messages.reverse(), // Return oldest first
      pagination: {
        limit,
        offset,
        total,
        hasMore: offset + messages.length < total,
      },
      unreadCount,
    });
  } catch (error: any) {
    console.error('GET /api/v1/clients/[id]/chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/v1/clients/[id]/chat - Send message as admin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { subject, message, sendToClient } = body;
    
    // Validation
    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    // Check if client exists
    const client = await prisma.lead.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Create message (client request)
    const chatMessage = await prisma.clientRequest.create({
      data: {
        leadId: id,
        subject: subject || 'Message from All Lines Business Solutions',
        message: message.trim(),
        status: 'OPEN',
      },
    });
    
    // If sendToClient is true, could trigger email notification (not implemented)
    // For now just return success
    
    return NextResponse.json({
      id: chatMessage.id,
      subject: chatMessage.subject,
      message: chatMessage.message,
      status: chatMessage.status,
      createdAt: chatMessage.createdAt,
      clientEmail: client.email,
      // Client can view at this URL
      clientViewUrl: `/onboard/${client.token}?tab=messages`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/v1/clients/[id]/chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/v1/clients/[id]/chat - Update message status (mark read/resolved)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { messageId, status, markAllRead } = body;
    
    // Check if client exists
    const client = await prisma.lead.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // If markAllRead, update all messages
    if (markAllRead) {
      await prisma.clientRequest.updateMany({
        where: { leadId: id, status: 'OPEN' },
        data: { status: 'RESOLVED' },
      });
      
      return NextResponse.json({
        success: true,
        updatedCount: await prisma.clientRequest.count({
          where: { leadId: id, status: 'RESOLVED' },
        }),
      });
    }
    
    // Update specific message
    if (messageId) {
      const updated = await prisma.clientRequest.update({
        where: { id: messageId },
        data: { status: status as any },
      });
      
      return NextResponse.json({
        id: updated.id,
        status: updated.status,
        updatedAt: updated.updatedAt,
      });
    }
    
    return NextResponse.json(
      { error: 'messageId or markAllRead is required' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('PATCH /api/v1/clients/[id]/chat error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}