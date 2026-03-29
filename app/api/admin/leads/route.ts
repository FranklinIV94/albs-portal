import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOnboardingEmail } from '@/lib/email';

// GET /api/admin/leads - List all leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const createdAfter = searchParams.get('createdAfter');
    const email = searchParams.get('email');
    const search = searchParams.get('search');
    const serviceCategories = searchParams.get('serviceCategories');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const where: any = {};
    if (status) where.status = status;
    if (email) where.email = { contains: email, mode: 'insensitive' };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (createdAfter) {
      where.createdAt = { gte: new Date(createdAfter) };
    }
    if (serviceCategories) {
      where.serviceCategories = { contains: serviceCategories };
    }

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        include: {
          positions: true,
          leadServices: { include: { service: true } },
          contracts: true,
          clientRequests: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.lead.count({ where }),
    ]);

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ leads, services, total, limit, offset });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, company, title, phone, linkedinUrl, serviceCategories, serviceIds, status, onboardingCompleted, onboardingStep, sendWelcomeEmail } = body;

    const token = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

    const lead = await prisma.lead.create({
      data: {
        token,
        firstName,
        lastName,
        email,
        company,
        title,
        phone,
        linkedinUrl,
        status: status || 'NEW',
        onboardingCompleted: onboardingCompleted || false,
        onboardingStep: onboardingStep || 0,
        ...(serviceCategories && { serviceCategories }),
      },
    });

    // Assign services to lead if serviceIds provided
    if (serviceIds && Array.isArray(serviceIds) && serviceIds.length > 0) {
      // Validate serviceIds exist
      const validServices = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true },
      });
      const validServiceIds = validServices.map(s => s.id);

      for (const serviceId of serviceIds) {
        if (validServiceIds.includes(serviceId)) {
          await prisma.leadService.create({
            data: { leadId: lead.id, serviceId },
          });
        }
      }
    }

    // Send welcome email with onboarding link automatically (unless sendWelcomeEmail is explicitly false)
    let emailResult = null;
    if (email && sendWelcomeEmail !== false) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com';
      const onboardLink = `${baseUrl}/onboard/${token}`;
      const leadWithServices = await prisma.lead.findUnique({
        where: { id: lead.id },
        include: { leadServices: { include: { service: true } } },
      });
      const services = leadWithServices?.leadServices.map(ls => ({
        name: ls.service.name,
        description: ls.service.description || undefined,
        priceDisplay: ls.service.priceDisplay || undefined,
      })) || [];
      emailResult = await sendOnboardingEmail({
        to: email,
        firstName: firstName || '',
        onboardLink,
        companyName: 'ALBS',
        clientCompany: company || undefined,
        services,
      });
    }

    // Return updated lead with services
    const leadWithServices = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: { leadServices: { include: { service: true } } },
    });

    return NextResponse.json({ success: true, lead: leadWithServices, token, emailResult });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/leads - Update lead status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status, notes, serviceCategories, firstName, lastName } = body;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(status && { status: status as any }),
        ...(notes !== undefined && { notes }),
        ...(serviceCategories !== undefined && { serviceCategories }),
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/leads - Delete a lead
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Delete related records first (cascade should handle this, but being explicit)
    await prisma.clientRequest.deleteMany({ where: { leadId } });
    await prisma.projectTimeline.deleteMany({ where: { leadId } });
    await prisma.payment.deleteMany({ where: { leadId } });
    await prisma.contract.deleteMany({ where: { leadId } });
    await prisma.leadService.deleteMany({ where: { leadId } });
    await prisma.availability.deleteMany({ where: { leadId } });
    await prisma.position.deleteMany({ where: { leadId } });

    // Delete the lead
    await prisma.lead.delete({
      where: { id: leadId },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
