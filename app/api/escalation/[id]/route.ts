import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/escalation/[id] - Get single escalation
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
    
    const escalation = await prisma.escalation.findUnique({
      where: { id },
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
    });
    
    if (!escalation) {
      return NextResponse.json({ error: 'Escalation not found' }, { status: 404 });
    }
    
    return NextResponse.json(escalation);
  } catch (error: any) {
    console.error('GET /api/escalation/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/escalation/[id] - Update escalation (status, assignment, resolution)
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
    
    const updateData: any = {};
    if (body.status) updateData.status = body.status;
    if (body.assignedTo) updateData.assignedTo = body.assignedTo;
    if (body.priority) updateData.priority = body.priority;
    if (body.resolution !== undefined) {
      updateData.resolution = body.resolution;
      if (body.resolution) {
        updateData.resolvedAt = new Date();
        if (!body.status) updateData.status = 'RESOLVED';
      }
    }
    
    const escalation = await prisma.escalation.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(escalation);
  } catch (error: any) {
    console.error('PATCH /api/escalation/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
