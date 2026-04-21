import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendOnboardingEmail } from '@/lib/email'

const WEBHOOK_SECRET = process.env.INTAKE_WEBHOOK_SECRET

function generateToken(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
}

// POST /api/webhooks/intake — receives intake form submissions
// Called by dist-intake-src after successful support email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Optional secret verification
    if (WEBHOOK_SECRET) {
      const secret = request.headers.get('x-webhook-secret')
      if (secret !== WEBHOOK_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const { client, event } = body

    // Validate it's an intake_submitted event
    if (event !== 'intake_submitted' || !client) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    const { name, email, phone, company, services = [], notes } = client

    if (!email || !name) {
      return NextResponse.json({ error: 'Missing required fields: name and email' }, { status: 400 })
    }

    // Parse full name
    const nameParts = name.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    // Check for duplicate email
    const existing = await prisma.lead.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({
        success: true,
        message: 'Lead already exists',
        leadId: existing.id,
        duplicate: true,
      })
    }

    // Generate token for onboarding link
    const token = generateToken()

    // Determine initial status based on services
    const hasTaxService = services.some((s: string) =>
      /tax|1099|payroll|irs|filing|return/i.test(s)
    )

    // Create lead
    const lead = await prisma.lead.create({
      data: {
        token,
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        status: 'NEW',
        onboardingCompleted: false,
        onboardingStep: 0,
        notes: notes || null,
        serviceCategories: services.join(', ') || null,
      },
    })

    // Assign services if they exist in our Service table
    if (services.length > 0) {
      for (const svc of services) {
        const matched = await prisma.service.findFirst({
          where: {
            OR: [
              { name: { contains: svc, mode: 'insensitive' } },
              { description: { contains: svc, mode: 'insensitive' } },
            ],
            isActive: true,
          },
          select: { id: true },
        })
        if (matched) {
          await prisma.leadService.create({
            data: { leadId: lead.id, serviceId: matched.id },
          }).catch(() => {/* ignore dupes */})
        }
      }
    }

    // Send onboarding invite email to client
    const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com'
    const onboardLink = `${baseUrl}/onboard/${token}`
    const leadWithServices = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: { leadServices: { include: { service: true } } },
    })
    const servicesList = leadWithServices?.leadServices.map(ls => ({
      name: ls.service.name,
      description: ls.service.description || undefined,
      priceDisplay: ls.service.priceDisplay || undefined,
    })) || []

    await sendOnboardingEmail({
      to: email,
      firstName,
      onboardLink,
      companyName: 'ALBS',
      clientCompany: company || undefined,
      services: servicesList,
    })

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      token,
      onboardLink,
      emailSent: true,
    })
  } catch (error: any) {
    console.error('Intake webhook error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
