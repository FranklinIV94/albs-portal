import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST /api/admin/leads/[leadId]/outreach — Log an outreach touch
// leadId comes from the URL segment
export async function POST(request: NextRequest) {
  try {
    const urlParts = request.url.split('/')
    const leadIdFromUrl = urlParts[urlParts.length - 2] // .../leads/[leadId]/outreach
    const { channel, outcome, notes, nextAction, nextDate } = await request.json()

    if (!leadIdFromUrl) return NextResponse.json({ error: 'Lead ID required' }, { status: 400 })

    // Get current touch count for this lead
    const count = await prisma.aiiOutreachLog.count({ where: { leadId: leadIdFromUrl } })

    const log = await prisma.aiiOutreachLog.create({
      data: {
        leadId: leadIdFromUrl,
        channel,
        touchNum: count + 1,
        outcome: outcome || null,
        notes: notes || null,
        nextAction: nextAction || null,
        nextDate: nextDate ? new Date(nextDate) : null,
      },
    })

    // Update lead's lastTouched and nextAction
    await prisma.lead.update({
      where: { id: leadIdFromUrl },
      data: {
        aiiLastTouched: new Date(),
        ...(nextAction && { aiiNextAction: nextAction }),
        ...(nextDate && { aiiNextActionDate: new Date(nextDate) }),
      },
    })

    return NextResponse.json({ success: true, log })
  } catch (error: any) {
    console.error('Error logging outreach:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}