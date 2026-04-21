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

const OPSEC_SERVICES = [
  {
    id: 'opsec-discovery-report',
    name: 'Digital Footprint Discovery',
    category: 'OPSEC' as ServiceCategory,
    description: 'Comprehensive OSINT scan of your digital presence. We identify exposed emails, phone numbers, addresses, social accounts, breach exposures, and data broker listings — before adversaries do. Includes actionable report.',
    priceDisplay: '$1,499',
    basePrice: 149900,
    icon: '🔍',
    sortOrder: 50,
    isActive: true,
  },
  {
    id: 'opsec-hardening',
    name: 'Account Hardening',
    category: 'OPSEC' as ServiceCategory,
    description: 'We audit and secure your critical accounts (email, banking, social, cloud storage). 2FA enforcement, privacy setting lockdown, recovery phone/email cleanup, and suspicious access review.',
    priceDisplay: '$999',
    basePrice: 99900,
    icon: '🔐',
    sortOrder: 51,
    isActive: true,
  },
  {
    id: 'opsec-breach-response',
    name: 'Breach Exposure Remediation',
    category: 'OPSEC' as ServiceCategory,
    description: 'Your data appeared in a breach or data broker listing. We initiate removal requests across top 20 data broker sites, monitor for exposure changes, and provide ongoing suppression.',
    priceDisplay: '$799',
    basePrice: 79900,
    icon: '🛡️',
    sortOrder: 52,
    isActive: true,
  },
  {
    id: 'opsec-executive',
    name: 'Executive Protection Bundle',
    category: 'OPSEC' as ServiceCategory,
    description: 'Discovery + Hardening + Breach Response, plus deep-dive social engineering assessment, family member exposure review, and 90 days of monitoring. For high-value individuals.',
    priceDisplay: '$4,999',
    basePrice: 499900,
    icon: '🛡️',
    sortOrder: 53,
    isActive: true,
  },
  {
    id: 'opsec-monthly',
    name: 'Ongoing Monitoring',
    category: 'OPSEC' as ServiceCategory,
    description: 'Monthly OSINT monitoring. We alert you when new exposures appear, new breach data surfaces, or your information shows up in new data broker listings.',
    priceDisplay: '$299/mo',
    basePrice: 29900,
    icon: '👁️',
    sortOrder: 54,
    isActive: true,
  },
];

const ALL_SERVICES = [...CONSULTING_SERVICES, ...OPSEC_SERVICES];

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');

    if (secret !== 'albs-admin-2026') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = [];
    for (const service of ALL_SERVICES) {
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
