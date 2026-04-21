import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOnboardingEmail } from '@/lib/email';

// POST /api/admin/leads/approve - Approve a pending lead
export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json();
    if (!leadId) {
      return NextResponse.json({ error: 'leadId required' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    if (lead.aiiPipelineStage !== 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Lead is not in PENDING_APPROVAL stage' }, { status: 400 });
    }

    // Move to NOT_STARTED (active pipeline)
    await prisma.lead.update({
      where: { id: leadId },
      data: { aiiPipelineStage: 'NOT_STARTED' },
    });

    // Send welcome/onboarding email if lead has an email address
    if (lead.email) {
      try {
        const onboardLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://onboarding.simplifyingbusinesses.com'}/onboard/${lead.token}`;
        await sendOnboardingEmail({
          to: lead.email,
          firstName: lead.firstName || 'there',
          onboardLink,
          companyName: 'ALBS',
          clientCompany: lead.company || undefined,
        });
      } catch (emailErr) {
        console.error('Failed to send onboarding email:', emailErr);
        // Don't fail the approval if email fails
      }
    }

    return NextResponse.json({ success: true, leadId });
  } catch (error: any) {
    console.error('Error approving lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}