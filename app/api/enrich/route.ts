import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { enrichLeadFromLinkedin, enrichLeadByEmail } from '@/lib/enrichment';

// POST /api/enrich - Enrich a lead with Apollo data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { linkedinUrl, email, generateToken } = body;

    // Determine enrichment method
    const identifier = linkedinUrl || email;
    if (!identifier) {
      return NextResponse.json(
        { error: 'LinkedIn URL or email is required' },
        { status: 400 }
      );
    }

    // Call Apollo API
    let enrichedData;
    if (linkedinUrl) {
      enrichedData = await enrichLeadFromLinkedin(linkedinUrl);
    } else if (email) {
      enrichedData = await enrichLeadByEmail(email);
    }

    if (!enrichedData) {
      return NextResponse.json(
        { error: 'Failed to enrich lead data' },
        { status: 500 }
      );
    }

    // Generate unique token if requested
    const token = generateToken 
      ? `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`
      : null;

    // Save to database
    const lead = await prisma.lead.upsert({
      where: { 
        email: enrichedData.email || undefined 
      },
      update: {
        firstName: enrichedData.firstName,
        lastName: enrichedData.lastName,
        phone: enrichedData.phone,
        linkedinUrl: enrichedData.linkedinUrl,
      },
      create: {
        token: token || undefined,
        email: enrichedData.email,
        firstName: enrichedData.firstName,
        lastName: enrichedData.lastName,
        phone: enrichedData.phone,
        linkedinUrl: enrichedData.linkedinUrl,
      },
    });

    // Save work history positions
    if (enrichedData.positions?.length > 0) {
      // Delete existing positions to avoid duplicates
      await prisma.position.deleteMany({ where: { leadId: lead.id } });

      // Create new positions
      await prisma.position.createMany({
        data: enrichedData.positions.map((pos: any) => ({
          leadId: lead.id,
          companyName: pos.companyName,
          companyLogo: pos.companyLogo,
          title: pos.title,
          startDate: pos.startDate,
          endDate: pos.endDate,
          isCurrent: pos.isCurrent,
        })),
      });
    }

    // Fetch the complete lead with positions
    const completeLead = await prisma.lead.findUnique({
      where: { id: lead.id },
      include: { positions: true },
    });

    return NextResponse.json({
      success: true,
      lead: completeLead,
      token: lead.token,
    });
  } catch (error: any) {
    console.error('Enrichment error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to enrich lead' },
      { status: 500 }
    );
  }
}

// GET /api/enrich?token=xxx - Fetch lead by token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token && !email) {
      return NextResponse.json(
        { error: 'Token or email is required' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findFirst({
      where: token ? { token } : { email: email || undefined },
      include: { 
        positions: true,
        availability: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ lead });
  } catch (error: any) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}
