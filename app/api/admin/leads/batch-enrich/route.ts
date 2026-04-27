import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parsePhoneNumberFromString } from 'libphonenumber-js';

// POST /api/admin/leads/batch-enrich - Batch enrich all OUTREACH leads with phone + company data
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { force = false } = body; // force = re-enrich even if already enriched

    // Fetch all OUTREACH leads
    const leads = await prisma.lead.findMany({
      where: { status: 'OUTREACH' },
      include: { leadServices: { include: { service: true } } },
    });

    if (!leads.length) {
      return NextResponse.json({ success: true, enriched: 0, message: 'No OUTREACH leads found' });
    }

    const results = [];
    const errors = [];

    for (const lead of leads) {
      try {
        const updates: any = {};
        const enrichment: any = lead.enrichedData ? { ...(lead.enrichedData as object) } : {};

        // 1. Phone validation
        if (lead.phone) {
          try {
            const parsed = parsePhoneNumberFromString(lead.phone, 'US');
            if (parsed) {
              enrichment.phoneValidation = {
                valid: parsed.isValid(),
                possible: parsed.isPossible(),
                formatted: parsed.formatInternational(),
                type: getPhoneType(parsed.getType() ?? -1),
              };
            }
          } catch (e) {
            // Phone parsing failed
          }
        }

        // 2. Industry context - add operational signals based on industry
        if (lead.aiiIndustry) {
          enrichment.industryContext = getIndustryContext(lead.aiiIndustry);
        }

        // 3. Market signals - what we know from the source data
        enrichment.sourceData = {
          digitalGaps: lead.aiiOperationalSignals || null,
          opportunityScore: lead.aiiScore,
          tier: lead.aiiTier,
        };

        // 4. Company metadata (static enrichment based on what we know)
        updates.enrichedData = enrichment;

        // 5. Update last touched
        updates.aiiLastTouched = new Date();

        await prisma.lead.update({
          where: { id: lead.id },
          data: { ...updates },
        });

        results.push({
          id: lead.id,
          company: lead.company,
          phoneValid: enrichment.phoneValidation?.valid,
          phoneType: enrichment.phoneValidation?.type,
          phoneFormatted: enrichment.phoneValidation?.formatted,
          industryContext: enrichment.industryContext,
        });
      } catch (err: any) {
        errors.push({ id: lead.id, company: lead.company, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      enriched: results.length,
      errors: errors.length,
      results,
      errorsList: errors,
    });
  } catch (error: any) {
    console.error('Batch enrich error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function getPhoneType(type: number): string {
  const map: Record<number, string> = {
    0: 'FIXED_LINE',
    1: 'MOBILE',
    2: 'FIXED_LINE_OR_MOBILE',
    3: 'TOLL_FREE',
    4: 'PREMIUM_RATE',
    5: 'SHARED_COST',
    6: 'VOIP',
    7: 'PERSONAL_NUMBER',
    8: 'PAGER',
    9: 'UAN',
    10: 'UNKNOWN',
  };
  return map[type] || 'UNKNOWN';
}

function getIndustryContext(industry: string): any {
  const contexts: Record<string, any> = {
    electrical: {
      label: 'Electrical Trade',
      commonServices: ['Panel upgrades', 'Rewiring', 'Service calls', 'Lighting installation', 'Code inspections'],
      avgDealSize: '$2,000 - $15,000',
      salesCycle: '1-4 weeks',
      keyPainPoints: ['Scheduling dispatch', 'Parts inventory', 'Code compliance documentation', 'Insurance claims'],
      marketingAngles: ['Get found online when people search "electrician near me"', 'Online booking for service calls', 'Google Business Profile for 5-star reviews'],
      competitorsPerZip: '8-15 avg',
    },
    pool_service: {
      label: 'Pool Service',
      commonServices: ['Weekly cleaning', 'Chemical balancing', 'Equipment repair', 'Opening/closing', 'Leak detection'],
      avgDealSize: '$150 - $500/month',
      salesCycle: '1-2 weeks',
      keyPainPoints: ['Route optimization', 'Chemical cost tracking', 'Customer retention', 'Equipment upsells'],
      marketingAngles: ['Route management', 'Customer portal for service history', 'Automated service reminders'],
      competitorsPerZip: '5-12 avg',
    },
    plumbing: {
      label: 'Plumbing Trade',
      commonServices: ['Drain cleaning', 'Water heater', 'Leak repair', 'Fixture installation', 'Sewer line'],
      avgDealSize: '$150 - $2,500',
      salesCycle: '1-7 days',
      keyPainPoints: ['Emergency availability', 'Parts sourcing', 'Drain camera equipment', 'Licensing'],
      marketingAngles: ['24/7 online booking', 'Google Maps presence', 'Review management', 'Service reminders'],
      competitorsPerZip: '10-20 avg',
    },
    hvac: {
      label: 'HVAC Trade',
      commonServices: ['AC repair', 'Maintenance plans', 'Installation', 'Ductwork', 'Refrigerant'],
      avgDealSize: '$150 - $8,000',
      salesCycle: '1-2 weeks',
      keyPainPoints: ['Seasonal spikes', 'EPA compliance', 'Technician certification', 'Inventory'],
      marketingAngles: ['Preventive maintenance contracts', 'Google Ads for emergency searches', 'SEO for "AC repair near me"'],
      competitorsPerZip: '6-15 avg',
    },
    roofing: {
      label: 'Roofing Trade',
      commonServices: ['Inspection', 'Repair', 'Replacement', 'Storm damage', 'Gutters'],
      avgDealSize: '$5,000 - $25,000',
      salesCycle: '2-8 weeks',
      keyPainPoints: ['Insurance claims', 'Weather dependency', 'Permit navigation', 'Large upfront material costs'],
      marketingAngles: ['Storm damage specialization', 'Insurance claim assistance', 'Before/after galleries', 'Warranty documentation'],
      competitorsPerZip: '6-12 avg',
    },
    carpentry: {
      label: 'Carpentry Trade',
      commonServices: ['Finish carpentry', 'Cabinetry', 'Deck building', 'Trim work', 'Custom builds'],
      avgDealSize: '$500 - $15,000',
      salesCycle: '1-3 weeks',
      keyPainPoints: ['Material costs', 'Project bidding', 'Specialty tool requirements', 'Custom quotes'],
      marketingAngles: ['Portfolio website', 'Before/after project galleries', 'Referral program', 'Angie\'s List presence'],
      competitorsPerZip: '8-20 avg',
    },
    lawn: {
      label: 'Lawn Care / Landscaping',
      commonServices: ['Mowing', 'Landscaping design', 'Irrigation', 'Tree trimming', 'Fertilization'],
      avgDealSize: '$100 - $2,000/month',
      salesCycle: '1-5 days',
      keyPainPoints: ['Seasonal revenue', 'Equipment maintenance', 'Fuel costs', 'Route efficiency'],
      marketingAngles: ['Route optimization', 'Online quoting', 'Customer portal', 'Package deals'],
      competitorsPerZip: '10-25 avg',
    },
    handyman: {
      label: 'Handyman Services',
      commonServices: ['General repairs', 'Furniture assembly', 'Drywall', 'Painting', 'Multi-trade'],
      avgDealSize: '$75 - $500/job',
      salesCycle: '1-3 days',
      keyPainPoints: ['Tool variety', 'Liability coverage', 'Wide skill range', 'Pricing uncertainty'],
      marketingAngles: ['Online booking', 'Service packages', 'Google Guaranteed', 'Reviews management'],
      competitorsPerZip: '15-30 avg',
    },
  };
  return contexts[industry] || contexts['handyman'];
}
