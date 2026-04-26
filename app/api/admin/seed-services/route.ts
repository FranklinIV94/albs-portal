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

const REPUTATION_SERVICES = [
  {
    id: 'reputation-monitoring',
    name: 'Reputation Monitoring & Response',
    category: 'REPUTATION_MANAGEMENT' as ServiceCategory,
    description: `Professional review monitoring and response management for your Google Business Profile and other review platforms.

WHAT'S INCLUDED:
• Daily monitoring of Google Maps, Yelp, and Facebook reviews
• Professional, personalized responses to every review within 24 hours (positive and negative)
• Review response strategy — human-sounding, never corporate
• Monthly reputation report with sentiment trends and response metrics
• Escalation alerts for negative reviews requiring owner attention
• Up to 50 review responses per month

HOW IT WORKS:
1. We monitor your review profiles daily
2. Every review gets a professional, personalized response
3. Negative reviews are addressed with care — acknowledged, apologized to, offered resolution
4. Monthly report shows your rating trend, response rate, and areas for improvement

CONTRACT: 90-day minimum commitment

PERFECT FOR: Local service businesses (HVAC, plumbing, electrical, roofing, pest control) with a Google Business Profile that has reviews going unanswered.`,
    priceDisplay: '$300/mo',
    basePrice: 30000,
    icon: '⭐',
    sortOrder: 60,
    isActive: true,
  },
  {
    id: 'reputation-growth',
    name: 'Reputation Growth Package',
    category: 'REPUTATION_MANAGEMENT' as ServiceCategory,
    description: `Full reputation management with proactive review generation — we don't just respond to reviews, we help you earn more 5-star reviews.

WHAT'S INCLUDED:
• Everything in Reputation Monitoring & Response
• Plus: Review request system — automated SMS/email to customers after service completion
• Review generation landing page — branded page making it easy for happy customers to leave reviews
• Quarterly review generation campaigns (email + SMS)
• Negative review recovery protocol — personalized outreach to unhappy customers
• Competitive analysis — how your ratings compare to the top 3 competitors in your area
• Up to 100 review responses per month

HOW IT WORKS:
1. After every job, your customer gets a short text/email asking how it went
2. Happy customers are directed to leave a Google review (1 tap)
3. Unhappy customers are directed to a private feedback form (not public)
4. All public reviews get professional responses within 24 hours
5. Your rating climbs from 3.8 to 4.5+ stars within 90 days

CONTRACT: 90-day minimum commitment

PERFECT FOR: Businesses with ratings below 4.2 stars that need both response management AND new review generation to climb the rankings.`,
    priceDisplay: '$500/mo',
    basePrice: 50000,
    icon: '📈',
    sortOrder: 61,
    isActive: true,
  },
  {
    id: 'reputation-dominance',
    name: 'Reputation Dominance',
    category: 'REPUTATION_MANAGEMENT' as ServiceCategory,
    description: `Complete online reputation domination — we manage your reviews, generate new ones, optimize your Google Business Profile, and protect your brand across all platforms.

WHAT'S INCLUDED:
• Everything in Reputation Growth Package
• Plus: Google Business Profile optimization — complete profile setup with photos, services, hours, and keywords
• Review responses across ALL platforms (Google, Yelp, Facebook, BBB, Angie's)
• Monthly competitor reputation report — track competitor ratings, review counts, and response rates
• Crisis management — if a negative review goes viral or a bad press article appears, we respond within hours
• Review request QR codes and printed materials for in-store/on-site use
• Unlimited review responses
• Priority response time: 4 hours for negative reviews, 24 hours for positive

THE RESULT: Your business becomes the most trusted, highest-rated option in your service area. When someone searches "HVAC near me" or "plumber in [city]," you're the first result with 4.8+ stars and 200+ reviews.

CONTRACT: 90-day minimum commitment

PERFECT FOR: Businesses that want to dominate their local market and be the obvious first choice for every customer searching online.`,
    priceDisplay: '$800/mo',
    basePrice: 80000,
    icon: '👑',
    sortOrder: 62,
    isActive: true,
  },
  {
    id: 'website-local-presence',
    name: 'Local Business Website + Reputation',
    category: 'REPUTATION_MANAGEMENT' as ServiceCategory,
    description: `For local businesses with no website or an outdated one — we build you a professional website AND manage your online reputation from day one.

WHAT'S INCLUDED:
• Professional 5-page website (Home, Services, About, Reviews, Contact)
• Mobile-responsive design optimized for local search
• Google Business Profile setup and optimization
• Review request system built into the website
• Professional review response management (up to 50 reviews/month)
• Monthly reputation report
• Website hosting and maintenance
• Local SEO basics (Google Business Profile, meta tags, schema markup)

HOW IT WORKS:
1. We review your current online presence (or lack thereof)
2. Build a professional website in 5-7 business days using your services, reviews, and branding
3. Set up your Google Business Profile and connect review generation
4. You start getting more calls within 2 weeks
5. Your rating climbs as we generate and respond to reviews

ONE-TIME SETUP: Website build $800-$1,500 (varies by complexity)
MONTHLY: Hosting, maintenance, and reputation management $500/mo

CONTRACT: 90-day minimum commitment on monthly services

PERFECT FOR: Local service businesses (HVAC, plumbing, roofing, electrical, pest control, landscaping) with no website or a website from 2015 that's costing them customers.`,
    priceDisplay: '$800-$1,500 setup + $500/mo',
    basePrice: 80000,
    icon: '🌐',
    sortOrder: 63,
    isActive: true,
  },
];

const ALL_SERVICES = [...CONSULTING_SERVICES, ...OPSEC_SERVICES, ...REPUTATION_SERVICES];

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
