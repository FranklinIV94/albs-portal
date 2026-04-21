import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// GET /api/admin/leads/outreach — Get all outreach logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('leadId')
    const channel = searchParams.get('channel')
    const outcome = searchParams.get('outcome')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: any = {}
    if (leadId) where.leadId = leadId
    if (channel) where.channel = channel
    if (outcome) where.outcome = outcome
    if (dateFrom || dateTo) {
      where.date = {}
      if (dateFrom) where.date.gte = new Date(dateFrom)
      if (dateTo) where.date.lte = new Date(dateTo)
    }

    const [logs, total] = await Promise.all([
      prisma.aiiOutreachLog.findMany({
        where,
        include: { lead: { select: { company: true, firstName: true, lastName: true } } },
        orderBy: { date: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.aiiOutreachLog.count({ where }),
    ])

    const enriched = logs.map(log => ({
      id: log.id,
      leadId: log.leadId,
      company: log.lead?.company || `${log.lead?.firstName || ''} ${log.lead?.lastName || ''}`.trim() || 'Unknown',
      date: log.date.toISOString(),
      channel: log.channel,
      touchNum: log.touchNum,
      outcome: log.outcome,
      notes: log.notes,
      nextAction: log.nextAction,
      nextDate: log.nextDate?.toISOString() || null,
    }))

    return NextResponse.json({ logs: enriched, total })
  } catch (error: any) {
    console.error('Error fetching outreach logs:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}