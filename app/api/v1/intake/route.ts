import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

// POST /api/v1/intake - Public lead intake (no auth required)
// Called by portfolio site to create lead + send notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, company } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'firstName, lastName, and email are required' },
        { status: 400 }
      );
    }

    // Generate portal token
    const token = randomBytes(32).toString('hex');

    // Create lead in portal DB
    const lead = await prisma.lead.create({
      data: {
        token,
        firstName,
        lastName,
        email,
        phone: phone || null,
        company: company || null,
        status: 'NEW',
      },
    });

    // Send notification to support
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: 'ALBS Onboarding <onboarding@simplifyingbusinesses.com>',
        to: ['support@simplifyingbusinesses.com'],
        subject: `New Lead: ${firstName} ${lastName} from ${company || 'Unknown'}`,
        html: `
          <h2>New Lead Captured</h2>
          <p><strong>Name:</strong> ${firstName} ${lastName}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
          <p><strong>Business:</strong> ${company || 'Not provided'}</p>
          <hr/>
          <p><a href="https://onboarding.simplifyingbusinesses.com/admin">View in Admin →</a></p>
        `,
      });
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ token, leadId: lead.id });
  } catch (error) {
    console.error('Intake error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}