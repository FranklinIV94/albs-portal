import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/escalation - List escalations (with filters)
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // OPEN, IN_PROGRESS, RESOLVED, CLOSED
    const priority = searchParams.get('priority'); // STANDARD, HIGH, URGENT
    const assignedTo = searchParams.get('assignedTo');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedTo) where.assignedTo = assignedTo;
    
    const [escalations, total] = await Promise.all([
      prisma.escalation.findMany({
        where,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
        include: {
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              company: true,
              phone: true,
            }
          }
        }
      }),
      prisma.escalation.count({ where })
    ]);
    
    return NextResponse.json({
      escalations,
      total,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('GET /api/escalation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/escalation - Create new escalation (for Zo)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.reason || !body.summary) {
      return NextResponse.json(
        { error: 'reason and summary are required' },
        { status: 400 }
      );
    }
    
    // Generate alert ID
    const count = await prisma.escalation.count();
    const alertId = `ESC-2026-${String(count + 1).padStart(5, '0')}`;
    
    // Determine assignment based on reason/priority
    let assignedTo = body.assignedTo || null;
    if (!assignedTo) {
      if (body.reason === 'CANCELLATION' || body.reason === 'COMPLAINT') {
        assignedTo = 'FRANKLIN';
      } else {
        assignedTo = 'NADESHA';
      }
    }
    
    const escalation = await prisma.escalation.create({
      data: {
        alertId,
        clientName: body.clientName,
        clientPhone: body.clientPhone,
        clientEmail: body.clientEmail,
        leadId: body.leadId,
        priority: body.priority || 'STANDARD',
        reason: body.reason,
        summary: body.summary,
        conversationHistory: body.conversationHistory 
          ? JSON.stringify(body.conversationHistory) 
          : null,
        metadata: body.metadata,
        assignedTo,
        status: 'OPEN',
        source: body.source || 'ZO_BOT',
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        }
      }
    });
    
    return NextResponse.json(escalation, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/escalation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
