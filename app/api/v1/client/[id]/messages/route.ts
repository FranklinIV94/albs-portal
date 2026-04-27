import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/client/:id/messages - Get client message history
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = params;

    const requests = await prisma.clientRequest.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        status: true,
        adminResponse: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ requests });
  } catch (error: any) {
    console.error('GET /api/v1/client/:id/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/v1/client/:id/messages - Post a message to client (Zo sending as admin)
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { content, isAdmin = true } = body;

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Verify lead exists
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const clientRequest = await prisma.clientRequest.create({
      data: {
        leadId: id,
        content: content.trim(),
        status: 'OPEN',
        isFromAdmin: isAdmin,
      },
    });

    return NextResponse.json({ success: true, request: clientRequest });
  } catch (error: any) {
    console.error('POST /api/v1/client/:id/messages error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
