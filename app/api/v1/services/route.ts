import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/services - List all available services from catalog
export async function GET(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(request.url);
    
    // Filtering
    const category = searchParams.get('category'); // AI_SERVICES, TAX_BUSINESS, etc.
    const activeOnly = searchParams.get('active') !== 'false'; // Default to true
    
    // Build where clause
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (activeOnly) {
      where.isActive = true;
    }
    
    const services = await prisma.service.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        priceDisplay: true,
        basePrice: true,
        icon: true,
        sortOrder: true,
        isActive: true,
        createdAt: true,
      },
    });
    
    // Group by category for easier consumption
    const servicesByCategory = services.reduce((acc, service) => {
      const cat = service.category;
      if (!acc[cat]) {
        acc[cat] = [];
      }
      acc[cat].push({
        id: service.id,
        name: service.name,
        description: service.description,
        priceDisplay: service.priceDisplay,
        basePrice: service.basePrice,
        icon: service.icon,
        sortOrder: service.sortOrder,
      });
      return acc;
    }, {} as Record<string, any[]>);
    
    return NextResponse.json({
      services,
      servicesByCategory,
      categories: Object.keys(servicesByCategory),
      total: services.length,
    });
  } catch (error: any) {
    console.error('GET /api/v1/services error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/v1/services - Update a service (admin only - for base price editing)
export async function PATCH(request: NextRequest) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { serviceId, name, description, priceDisplay, basePrice, icon, sortOrder, isActive } = body;

    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (priceDisplay !== undefined) updateData.priceDisplay = priceDisplay;
    if (basePrice !== undefined) updateData.basePrice = basePrice;
    if (icon !== undefined) updateData.icon = icon;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: updateData,
    });

    return NextResponse.json({ success: true, service });
  } catch (error: any) {
    console.error('PATCH /api/v1/services error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}