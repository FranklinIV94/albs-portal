import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, availability } = body;

    if (!token || !availability) {
      return NextResponse.json(
        { error: 'Token and availability are required' },
        { status: 400 }
      );
    }

    // Find the lead by token
    const lead = await prisma.lead.findUnique({
      where: { token },
      include: { availability: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Upsert availability
    const updatedAvailability = await prisma.availability.upsert({
      where: { leadId: lead.id },
      update: {
        monday: availability.monday ?? false,
        tuesday: availability.tuesday ?? false,
        wednesday: availability.wednesday ?? false,
        thursday: availability.thursday ?? false,
        friday: availability.friday ?? false,
        saturday: availability.saturday ?? false,
        sunday: availability.sunday ?? false,
        morning: availability.morning ?? true,
        afternoon: availability.afternoon ?? true,
        evening: availability.evening ?? false,
        timezone: availability.timezone ?? 'America/New_York',
        isImmediatelyAvailable: availability.isImmediatelyAvailable ?? false,
        noticePeriod: availability.noticePeriod ?? null,
        contactMethod: availability.contactMethod ?? 'email',
      },
      create: {
        leadId: lead.id,
        monday: availability.monday ?? false,
        tuesday: availability.tuesday ?? false,
        wednesday: availability.wednesday ?? false,
        thursday: availability.thursday ?? false,
        friday: availability.friday ?? false,
        saturday: availability.saturday ?? false,
        sunday: availability.sunday ?? false,
        morning: availability.morning ?? true,
        afternoon: availability.afternoon ?? true,
        evening: availability.evening ?? false,
        timezone: availability.timezone ?? 'America/New_York',
        isImmediatelyAvailable: availability.isImmediatelyAvailable ?? false,
        noticePeriod: availability.noticePeriod ?? null,
        contactMethod: availability.contactMethod ?? 'email',
      },
    });

    return NextResponse.json({ 
      success: true, 
      availability: updatedAvailability 
    });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json(
      { error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch availability for a lead
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { token },
      include: { availability: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      lead: {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
      },
      availability: lead.availability 
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}
