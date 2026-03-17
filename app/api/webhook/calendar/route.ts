import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client';
import { sendBookingConfirmationEmail } from '@/lib/email';
import { createOutlookEvent } from '@/lib/graph';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, event } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    if (action === 'schedule_event') {
      if (!event || !event.title || !event.start_time || !event.end_time) {
        return NextResponse.json({ error: 'Event data is incomplete' }, { status: 400 })
      }

      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      
      // Create in local DB
      await prisma.calendarEvent.create({
        data: {
          title: event.title,
          description: event.notes || '',
          startTime: startDate,
          endTime: endDate,
          eventType: event.event_type || 'consultation',
          status: 'confirmed',
          location: event.location || 'Virtual',
          attendees: JSON.stringify([event.lead_email].filter(Boolean)),
          createdBy: 'portal',
        }
      });

      // Sync to Outlook calendar
      let outlookEventId = null;
      const outlookResult = await createOutlookEvent({
        subject: event.title,
        body: event.notes,
        start: startDate,
        end: endDate,
        attendeeEmail: event.lead_email,
        attendeeName: event.lead_name,
        location: event.location,
      });
      
      if (outlookResult.success) {
        outlookEventId = outlookResult.eventId;
        console.log('Outlook event created:', outlookEventId);
      }

      // Send confirmation email to client
      if (event.lead_email) {
        const firstName = event.lead_name?.split(' ')[0] || 'Client';
        const formattedDate = startDate.toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const formattedTime = startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          timeZoneName: 'short'
        });
        
        await sendBookingConfirmationEmail({
          to: event.lead_email,
          firstName,
          date: formattedDate,
          time: formattedTime,
          timezone: 'Eastern Time',
          notes: event.notes,
        });
      }

      return NextResponse.json({ 
        success: true, 
        outlookEventId,
        message: 'Event scheduled with Outlook sync' 
      })
    }

    if (action === 'cancel_event') {
      if (!event?.id) {
        return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
      }

      await prisma.calendarEvent.delete({
        where: { id: event.id }
      });

      return NextResponse.json({ success: true, message: 'Event cancelled' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err: any) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message || 'Unknown error' }, { status: 500 })
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    message: 'Calendar webhook endpoint with Outlook sync'
  })
}