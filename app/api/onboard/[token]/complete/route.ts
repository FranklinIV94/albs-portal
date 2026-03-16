import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

// PUT /api/onboard/[token]/complete - Complete onboarding (sign contract or set PIN)
export async function PUT(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    const body = await request.json();
    const { portalPin, onboardingStep, onboardingCompleted } = body;

    // Find lead
    const existingLead = await prisma.lead.findUnique({ where: { token } });
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Handle PIN-only update (no signature needed)
    if (portalPin) {
      const lead = await prisma.lead.update({
        where: { token },
        data: { 
          portalPin,
          onboardingStep: onboardingStep ?? 4,
          onboardingCompleted: onboardingCompleted ?? true,
          status: 'ACTIVE',
        },
      });
      return NextResponse.json({ success: true, lead });
    }

    // If no PIN, return error
    return NextResponse.json({ error: 'PIN is required' }, { status: 400 });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}