import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { createOutlookEvent, deleteOutlookEvent } from '@/lib/graph';

const prisma = new PrismaClient();

// GET /api/calendar/events - Get all events
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');

    const where: any = {};
    
    if (start || end) {
      where.startTime = {};
      if (start) where.startTime.gte = new Date(start);
      if (end) where.startTime.lte = new Date(end);
    }

    const events = await prisma.calendarEvent.findMany({
      where,
      orderBy: { startTime: 'asc' },
    });

    return NextResponse.json({
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        start: e.startTime.toISOString(),
        end: e.endTime.toISOString(),
        type: e.eventType,
        status: e.status,
        location: e.location,
        attendees: e.attendees ? JSON.parse(e.attendees) : [],
      })),
    });
  } catch (error: any) {
    console.error('Get events error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/calendar/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, start, end, type, description, location, attendeeEmail, attendees } = body;

    // Validate required fields
    if (!title || !start || !end) {
      return NextResponse.json({ error: 'Title, start, and end are required' }, { status: 400 });
    }

    const event = await prisma.calendarEvent.create({
      data: {
        title,
        description: description || '',
        startTime: new Date(start),
        endTime: new Date(end),
        eventType: type || 'consultation',
        status: 'confirmed',
        location: location || 'Virtual',
        attendees: attendees ? JSON.stringify(attendees) : JSON.stringify([attendeeEmail].filter(Boolean)),
        createdBy: 'portal',
      },
    });

    // Create event in Franklin's Outlook calendar
    let outlookEventId: string | null = null;
    try {
      const outlookResult = await createOutlookEvent({
        subject: title,
        body: description || undefined,
        start: new Date(start),
        end: new Date(end),
        attendeeEmail: attendeeEmail || (attendees ? JSON.parse(attendees)[0] : undefined),
        location: location || 'Virtual',
      });
      
      if (outlookResult.success) {
        outlookEventId = outlookResult.eventId || null;
        console.log('Created Outlook event:', outlookEventId);
      }
    } catch (outlookError: any) {
      console.error('Outlook sync failed (non-fatal):', outlookError.message);
      // Continue - don't fail the booking if Outlook fails
    }

    return NextResponse.json({
      success: true,
      event: {
        id: event.id,
        title: event.title,
        start: event.startTime.toISOString(),
        end: event.endTime.toISOString(),
        type: event.eventType,
        status: event.status,
        outlookEventId,
      },
    });
  } catch (error: any) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/calendar/events - Delete an event
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const outlookEventId = searchParams.get('outlookEventId');

    if (!id) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Get the event first to check for Outlook ID
    const existingEvent = await prisma.calendarEvent.findUnique({
      where: { id },
    });

    // Delete from Outlook if we have the event ID
    const outlookId = outlookEventId || (existingEvent as any)?.outlookEventId;
    if (outlookId) {
      try {
        await deleteOutlookEvent(outlookId);
        console.log('Deleted Outlook event:', outlookId);
      } catch (outlookError: any) {
        console.error('Outlook delete failed (non-fatal):', outlookError.message);
      }
    }

    await prisma.calendarEvent.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Event deleted' });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}