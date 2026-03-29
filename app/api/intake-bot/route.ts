import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Resend } from 'resend';
import { PrismaClient } from '@prisma/client';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Map intake service names to ALBS service catalog values
// This needs to match the service names in dist-intake constants.tsx
const SERVICE_CATEGORY_MAP: Record<string, string> = {
  '1040 Tax Prep': 'tax_prep',
  '1040 Tax Prep + Schedule C': 'tax_prep',
  '1120s / 1065': 'tax_prep',
  '1120 / 1041': 'tax_prep',
  'Bookkeeping': 'bookkeeping',
  '941 + 940 Payroll': 'payroll',
  'Payroll Services': 'payroll',
  'AI as a Service (AIIO)': 'aiio',
};

export async function POST(req: NextRequest) {
  if (req.method !== 'POST') {
    return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    const body = await req.json();
    const { event, timestamp, client } = body;

    // Validate we got an intake submission
    if (event !== 'intake_submitted') {
      return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    console.log(`[intake-bot] Processing intake for: ${client?.email}`);

    // 1. Parse client name
    const nameParts = (client?.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 2. Create lead in portal database
    // Generate a secure random token for onboarding
    const token = crypto.randomUUID();

    const lead = await prisma.lead.create({
      data: {
        token,
        firstName,
        lastName,
        email: client?.email || '',
        phone: client?.phone || null,
        company: client?.company || null,
        status: 'NEW',
        onboardingCompleted: false,
        onboardingStep: 0,
        notes: client?.notes || `Intake submitted: ${timestamp}\nServices: ${(client?.services || []).join(', ')}`,
      }
    });

    console.log(`[intake-bot] Lead created: ${lead.id} for ${lead.email}`);

    // 3. Generate onboarding URL
    const onboardingUrl = `https://onboarding.simplifyingbusinesses.com/onboard/${lead.token}`;

    // 4. Send welcome email to client
    try {
      if (resend) {
        await resend.emails.send({
          from: 'All Lines Business Solutions <onboarding@simplifyingbusinesses.com>',
          to: [client?.email],
          subject: 'Welcome to All Lines Business Solutions — Your Onboarding Portal',
          html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #0073bc; margin: 0;">All Lines</h1>
              <p style="color: #666; margin: 5px 0;">Business Solutions</p>
            </div>

            <p>Good evening,</p>

            <p>We are thrilled to welcome you to All Lines Business Solutions! We look
            forward to partnering with you to help streamline your operations and
            support your business goals.</p>

            <p>To get started, please use the link below to access our onboarding
            portal. Through this link, you can set up your official Client Portal
            and select the specific services you are interested in:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${onboardingUrl}" style="background-color: #0073bc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">Access Your Onboarding Portal</a>
            </div>

            <h2 style="color: #333;">A Quick Note on Pricing</h2>
            <p>As you browse our service options, please keep in mind that the prices
            listed are baselines and guidelines. We believe in providing solutions
            tailored to your unique needs; therefore, final pricing will be
            discussed and agreed upon with you directly before any invoices are
            generated.</p>

            <h2 style="color: #333;">Next Steps</h2>
            <ol>
              <li><strong>Register:</strong> Create your account via the link above.</li>
              <li><strong>Select Services:</strong> Check off the areas where you need support.</li>
              <li><strong>Consultation:</strong> Once submitted, we will reach out to
              review your selections and finalize a plan that works for you.</li>
            </ol>

            <p>If you have any questions while setting up your portal, please don't
            hesitate to reach out.</p>

            <p>Thank you,<br>The ALBS Team</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">All Lines Business Solutions | Simplifying Small Business</p>
          </div>
        `
        });
        console.log(`[intake-bot] Welcome email sent to: ${client?.email}`);
      }
    } catch (emailError) {
      // Email failure shouldn't fail the whole request — lead is created
      console.error(`[intake-bot] Email send failed for ${client?.email}:`, emailError);
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      leadId: lead.id,
      token: lead.token,
      onboardingUrl
    });

  } catch (error: any) {
    console.error('[intake-bot] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
