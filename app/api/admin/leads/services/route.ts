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

    // Add new services (with optional custom prices) - validate serviceId exists first
    if (toAdd.length > 0) {
      // Verify all serviceIds exist in the Service table
      const validServices = await prisma.service.findMany({
        where: { id: { in: toAdd } },
        select: { id: true },
      });
      const validServiceIds = validServices.map(s => s.id);
      const invalidServiceIds = toAdd.filter((id: string) => !validServiceIds.includes(id));
      
      if (invalidServiceIds.length > 0) {
        return NextResponse.json({ 
          error: 'Invalid service(s) selected', 
          invalidIds: invalidServiceIds 
        }, { status: 400 });
      }

      for (const serviceId of toAdd) {
        const customPrice = customPrices?.[serviceId];
        await prisma.leadService.upsert({
          where: {
            leadId_serviceId: { leadId, serviceId },
          },
          create: {
            leadId,
            serviceId,
            customPrice: customPrice || null,
          },
          update: {
            customPrice: customPrice || null,
          },
        });
      }
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