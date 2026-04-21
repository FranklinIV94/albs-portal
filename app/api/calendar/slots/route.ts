import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/calendar/slots?leadId=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 });
    }

    const slots = await prisma.bookingSlot.findMany({
      where: { leadId },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      slots: slots.map(s => ({
        id: s.id,
        leadId: s.leadId,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        status: s.status,
        bookedBy: s.bookedBy,
      })),
    });
  } catch (error: any) {
    console.error('Get slots error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/calendar/slots — Create or update a booking slot
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, date, startTime, endTime, status, bookedBy } = body;

    if (!leadId || !date || !startTime) {
      return NextResponse.json({ error: 'leadId, date, and startTime required' }, { status: 400 });
    }

    // Upsert — unique constraint on (leadId, date, startTime)
    const slot = await prisma.bookingSlot.upsert({
      where: {
        leadId_date_startTime: { leadId, date, startTime },
      },
      update: {
        endTime: endTime || startTime,
        status: status || 'available',
        bookedBy: bookedBy || null,
      },
      create: {
        leadId,
        date,
        startTime,
        endTime: endTime || startTime,
        status: status || 'available',
        bookedBy: bookedBy || null,
      },
    });

    return NextResponse.json({ success: true, slot });
  } catch (error: any) {
    console.error('Create slot error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}