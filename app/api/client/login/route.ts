import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/client/login - Verify PIN login
export async function POST(request: NextRequest) {
  try {
    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json({ error: 'Email and PIN are required' }, { status: 400 });
    }

    // Find lead by email and PIN
    const lead = await prisma.lead.findFirst({
      where: {
        email: email.toLowerCase(),
        portalPin: pin,
        onboardingCompleted: true,
      },
      select: {
        id: true,
        token: true,
        firstName: true,
        lastName: true,
        email: true,
        company: true,
        status: true,
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Invalid email or PIN' }, { status: 401 });
    }

    // Log successful login
    await prisma.activityLog.create({
      data: {
        leadId: lead.id,
        type: ActivityType.STATUS_CHANGED,
        description: 'Client logged in via PIN',
        metadata: { email, loginMethod: 'PIN' },
      },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}