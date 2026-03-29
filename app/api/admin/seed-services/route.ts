import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ServiceCategory } from '@prisma/client';

const CONSULTING_SERVICES = [
  {
    id: 'consulting-30min',
    name: '30-Minute Consultation',
    category: 'CONSULTING' as ServiceCategory,
    description: 'Free 30-minute discovery call to discuss your business needs and explore how ALBS can help. No obligation, no pressure — just a conversation.',
    priceDisplay: 'FREE',
    basePrice: 0,
    icon: '💬',
    sortOrder: 27,
    isActive: true,
  },
  {
    id: 'consulting-hourly',
    name: 'Consulting (Hourly)',
    category: 'CONSULTING' as ServiceCategory,
    description: 'One-on-one consulting sessions at $125/hour. General business consulting, process improvement, automation strategy, and technical guidance tailored to your needs.',
    priceDisplay: '$125/hr',
    basePrice: 12500,
    icon: '⏱️',
    sortOrder: 28,
    isActive: true,
  },
];

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'albs-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = [];
    for (const service of CONSULTING_SERVICES) {
      const created = await prisma.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
      results.push(created);
    }

    return NextResponse.json({
      success: true,
      seeded: results.length,
      services: results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
