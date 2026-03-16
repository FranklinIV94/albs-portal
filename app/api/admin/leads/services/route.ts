import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// PUT /api/admin/leads/services - Update lead's available services (and optional custom prices)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, serviceIds, customPrices } = body;

    if (!leadId || !serviceIds) {
      return NextResponse.json({ error: 'Lead ID and service IDs required' }, { status: 400 });
    }

    // Get current services for this lead
    const currentServices = await prisma.leadService.findMany({
      where: { leadId },
    });

    const currentServiceIds = currentServices.map(s => s.serviceId);
    const newServiceIds = serviceIds;

    // Find services to add (in new but not in current)
    const toAdd = newServiceIds.filter((id: string) => !currentServiceIds.includes(id));

    // Find services to remove (in current but not in new)
    const toRemove = currentServiceIds.filter((id: string) => !newServiceIds.includes(id));

    // Remove deselected services
    if (toRemove.length > 0) {
      await prisma.leadService.deleteMany({
        where: {
          leadId,
          serviceId: { in: toRemove },
        },
      });
    }

    // Handle custom-* service IDs by creating them on-the-fly
    const customServiceIds = toAdd.filter((id: string) => id.startsWith('custom-'));
    const regularServiceIds = toAdd.filter((id: string) => !id.startsWith('custom-'));
    
    // Create custom services in the database if needed
    if (customServiceIds.length > 0) {
      for (const customId of customServiceIds) {
        // Get custom price from payload - THIS IS THE SOURCE OF TRUTH
        const customPrice = customPrices?.[customId];
        
        // Check if this custom service already exists in Service table
        const existingCustomService = await prisma.service.findUnique({
          where: { id: customId },
        });
        
        if (!existingCustomService) {
          // Create new custom service with the price from payload
          const priceToUse = customPrice || 0; // Default to 0 if not provided
          const priceDollars = priceToUse / 100;
          await prisma.service.create({
            data: {
              id: customId,
              name: `Custom Service #${customId.slice(-6)}`,
              description: 'Custom service tailored to client',
              basePrice: priceToUse,
              priceDisplay: `$${priceDollars.toFixed(2)}`,
              category: 'CONSULTING',
              icon: '🎯',
              isActive: true,
            },
          });
        } else if (customPrice && customPrice !== existingCustomService.basePrice) {
          // Update existing custom service with new price if different
          await prisma.service.update({
            where: { id: customId },
            data: { 
              basePrice: customPrice,
              priceDisplay: `$${(customPrice / 100).toFixed(2)}`
            },
          });
        }
      }
    }

    // Add new services (with optional custom prices) - validate serviceId exists first
    if (regularServiceIds.length > 0) {
      // Verify all regular serviceIds exist in the Service table
      const validServices = await prisma.service.findMany({
        where: { id: { in: regularServiceIds } },
        select: { id: true },
      });
      const validServiceIds = validServices.map(s => s.id);
      const invalidServiceIds = regularServiceIds.filter((id: string) => !validServiceIds.includes(id));
      
      if (invalidServiceIds.length > 0) {
        return NextResponse.json({ 
          error: 'Invalid service(s) selected', 
          invalidIds: invalidServiceIds 
        }, { status: 400 });
      }
    }

    // Now add all services (including the newly created custom services)
    // IMPORTANT: customPrice from payload is the source of truth, not Service.basePrice
    for (const serviceId of toAdd) {
      // Get customPrice directly from payload - this overrides any Service.basePrice
      const customPrice = customPrices?.[serviceId];
      
      await prisma.leadService.upsert({
        where: {
          leadId_serviceId: { leadId, serviceId },
        },
        create: {
          leadId,
          serviceId,
          // Explicitly save custom price if provided, otherwise use null
          customPrice: customPrice !== undefined ? customPrice : null,
        },
        update: {
          // Only update customPrice if explicitly provided in payload
          ...(customPrice !== undefined && { customPrice }),
        },
      });
    }

    // Update custom prices for existing services
    if (customPrices && typeof customPrices === 'object') {
      const priceEntries = Object.entries(customPrices) as [string, number][];
      for (const [serviceId, price] of priceEntries) {
        if (newServiceIds.includes(serviceId)) {
          await prisma.leadService.update({
            where: {
              leadId_serviceId: { leadId, serviceId },
            },
            data: {
              customPrice: price || null,
            },
          }).catch(() => {
            // Service might not exist yet, create it
            if (price) {
              prisma.leadService.create({
                data: {
                  leadId,
                  serviceId,
                  customPrice: price,
                },
              }).catch(() => {});
            }
          });
        }
      }
    }

    // Return updated lead with services
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        leadServices: {
          include: { service: true },
        },
      },
    });

    return NextResponse.json({ 
      success: true, 
      lead,
      changes: { added: toAdd.length, removed: toRemove.length }
    });
  } catch (error: any) {
    console.error('Error updating lead services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/admin/leads/services?leadId=xxx - Get lead's services
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    const leadServices = await prisma.leadService.findMany({
      where: { leadId },
      include: { service: true },
    });

    return NextResponse.json({ leadServices });
  } catch (error: any) {
    console.error('Error fetching lead services:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}