import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOnboardingEmail } from '@/lib/email';

// GET /api/admin/leads - List all leads
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const leads = await prisma.lead.findMany({
      where: status ? { status: status as any } : undefined,
      include: {
        positions: true,
        leadServices: {
          include: { service: true }
        },
        contracts: true,
        clientRequests: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ leads, services });
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/leads - Create new lead
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, company, title, phone, linkedinUrl, serviceCategories, status, onboardingCompleted, onboardingStep, sendWelcomeEmail } = body;

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

    // Send welcome email with onboarding link automatically (unless sendWelcomeEmail is explicitly false)
    let emailResult = null;
    if (email && sendWelcomeEmail !== false) {
      const baseUrl = process.env.NEXTAUTH_URL || 'https://onboarding.simplifyingbusinesses.com';
      const onboardLink = `${baseUrl}/onboard/${token}`;
      emailResult = await sendOnboardingEmail({
        to: email,
        firstName: firstName || 'there',
        onboardLink,
        companyName: 'ALBS',
      });
    }

    return NextResponse.json({ success: true, lead, token, emailResult });
  } catch (error: any) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/admin/leads - Update lead status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status, notes, serviceCategories } = body;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(status && { status: status as any }),
        ...(notes !== undefined && { notes }),
        ...(serviceCategories !== undefined && { serviceCategories }),
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
