import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/clients - List all clients/leads with pagination and filtering
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    // Filtering
    const status = searchParams.get('status');
    const search = searchParams.get('search'); // Search by name or email
    const serviceCategory = searchParams.get('serviceCategory');
    
    // Build where clause
    const where: any = {};
    
    if (status) {
      where.status = status;
    }
    
    if (serviceCategory) {
      where.serviceCategories = {
        contains: serviceCategory,
      };
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    // Query with counts
    const [clients, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          token: true,
          firstName: true,
          lastName: true,
          email: true,
          company: true,
          phone: true,
          title: true,
          status: true,
          serviceCategories: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              leadServices: true,
              contracts: true,
              payments: true,
            },
          },
        },
      }),
      prisma.lead.count({ where }),
    ]);
    
    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('GET /api/v1/clients error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/v1/clients - Create a new client/lead
export async function POST(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { firstName, lastName, email, company, phone, serviceCategories, notes, title } = body;
    
    // Validation
    if (!firstName && !lastName && !email && !company) {
      return NextResponse.json(
        { error: 'At least one of firstName, lastName, email, or company is required' },
        { status: 400 }
      );
    }
    
    // Check for duplicate email if provided
    if (email) {
      const existing = await prisma.lead.findFirst({
        where: { email },
      });
      
      if (existing) {
        return NextResponse.json(
          { error: 'A client with this email already exists', existingId: existing.id },
          { status: 409 }
        );
      }
    }
    
    // Generate unique token for onboarding
    const token = randomBytes(32).toString('hex');
    
    // Create the lead
    const client = await prisma.lead.create({
      data: {
        token,
        firstName,
        lastName,
        email,
        company,
        phone,
        title,
        notes,
        serviceCategories: serviceCategories ? serviceCategories.join(',') : null,
        status: 'NEW',
      },
    });
    
    // If serviceCategories provided, also create empty service selections
    if (serviceCategories && serviceCategories.length > 0) {
      // We'll leave this empty - services will be selected during onboarding
    }
    
    return NextResponse.json({
      id: client.id,
      token: client.token,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      company: client.company,
      phone: client.phone,
      title: client.title,
      status: client.status,
      serviceCategories: client.serviceCategories,
      createdAt: client.createdAt,
      // Onboarding URL for the client
      onboardingUrl: `/onboard/${client.token}`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/v1/clients error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A client with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}