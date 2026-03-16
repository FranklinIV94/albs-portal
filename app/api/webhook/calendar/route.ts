import { NextRequest, NextResponse } from 'next/server'

const CALENDAR_HUB_URL = process.env.CALENDAR_HUB_URL || 'https://vercel-app-sooty-nu.vercel.app'

export async function POST(request) {
  try {
    const body = await request.json()
    const { action, event } = body

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 })
    }

    if (action === 'schedule_event') {
      // Schedule a new event on Calendar Hub
      if (!event || !event.title || !event.start_time || !event.end_time) {
        return NextResponse.json({ error: 'Event data is incomplete' }, { status: 400 })
      }

      const calendarHubEvent = {
        title: event.title,
        start_time: event.start_time,
        end_time: event.end_time,
        source: 'onboarding',
        event_type: event.event_type || 'consultation',
        location: event.location || '',
        custom_fields: {
          lead_id: event.lead_id,
          service_type: event.service_type,
          notes: event.notes
        }
      }

      const res = await fetch(`${CALENDAR_HUB_URL}/api/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calendarHubEvent)
      })

      const data = await res.json()

      if (data.success) {
        return NextResponse.json({ 
          success: true, 
          event_id: data.event.id,
          message: 'Event scheduled on Calendar Hub' 
        })
      } else {
        return NextResponse.json({ error: 'Failed to schedule event' }, { status: 500 })
      }
    }

    if (action === 'cancel_event') {
      // Cancel an event
      if (!event?.id) {
        return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
      }

      const res = await fetch(`${CALENDAR_HUB_URL}/api/events?id=${event.id}`, {
        method: 'DELETE'
      })

      return NextResponse.json({ success: true, message: 'Event cancelled' })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET - Health check
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    calendar_hub: CALENDAR_HUB_URL,
    message: 'Calendar Hub webhook endpoint'
  })
}