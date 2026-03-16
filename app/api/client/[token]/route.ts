import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/client/[token] - Get client data for portal access
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    
    const lead = await prisma.lead.findUnique({
      where: { token },
      include: {
        leadServices: {
          include: {
            service: true,
          },
        },
      },
    });

    if (!lead) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    // Get all services for the services display
    const services = await prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      success: true,
      lead,
      services,
    });
  } catch (error: any) {
    console.error('Error fetching client:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}