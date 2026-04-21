import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST /api/admin/leads/import - Bulk import leads from CSV
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { leads } = body;

    if (!leads || !Array.isArray(leads)) {
      return NextResponse.json({ error: 'leads array required' }, { status: 400 });
    }

    const results = { success: 0, errors: 0, skipped: 0, created: [] as any[], errorsList: [] as any[] };

    // Deduplicate: build a set of existing (company+website) pairs
    const existingLeads = await prisma.lead.findMany({
      where: { aiiScore: { not: null } },
      select: { id: true, company: true, aiiWebsite: true },
    });
    const existingKeys = new Set(
      existingLeads
        .map(l => [l.company || '', l.aiiWebsite || ''])
        .filter(([c, w]) => c || w)
        .map(([c, w]) => `${c.trim().toLowerCase()}||${(w || '').trim().toLowerCase()}`)
    );

    for (const row of leads) {
      // Skip duplicates by company + website
      const companyKey = (row.company || row['Business Name'] || '').trim().toLowerCase();
      const websiteKey = (row.aiiWebsite || row.Website || '').trim().replace(/^https?:\/\//, '').toLowerCase();
      const dedupKey = `${companyKey}||${websiteKey}`;
      if (companyKey && existingKeys.has(dedupKey)) {
        results.skipped = (results.skipped || 0) + 1;
        continue;
      }

      try {
        const token = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
        const lead = await prisma.lead.create({
          data: {
            token,
            company: row.company || row['Business Name'] || null,
            firstName: row.firstName || null,
            lastName: row.lastName || null,
            email: row.email || null,
            phone: row.phone || row.Phone || null,
            aiiTier: row.aiiTier || row.Tier || null,
            aiiScore: row.aiiScore != null ? parseInt(row.aiiScore) : row.Score != null ? parseInt(row.Score) : null,
            aiiOutreachHook: row.aiiOutreachHook || row['Outreach Hook'] || null,
            aiiIndustry: row.aiiIndustry || row.Industry || null,
            aiiCity: row.aiiCity || row.City || null,
            aiiState: row.aiiState || row.State || null,
            aiiWebsite: row.aiiWebsite || row.Website || null,
            aiiOperationalSignals: row.aiiOperationalSignals || row['Top Gap / Operational Signals'] || null,
            aiiAssignedTo: row.aiiAssignedTo || row['Assigned To'] || null,
            aiiPipelineStage: row.aiiPipelineStage || row.Stage || null,
            aiiProduct: row.aiiProduct || row.Product || null,
            aiiFee: row.aiiFee != null ? parseInt(row.aiiFee) : row.Fee != null ? Math.round(parseFloat(row.Fee) * 100) : null,
            aiiProbability: row.aiiProbability != null ? parseInt(row.aiiProbability) : row.Probability != null ? parseInt(row.Probability) : null,
            status: 'NEW',
          },
        });

        // Calculate weighted value if fee and probability exist
        if (lead.aiiFee && lead.aiiProbability != null) {
          const weightedValue = Math.round((lead.aiiFee * lead.aiiProbability) / 100);
          await prisma.lead.update({
            where: { id: lead.id },
            data: { aiiWeightedValue: weightedValue },
          });
        }

        results.success++;
        results.created.push(lead);
      } catch (err: any) {
        results.errors++;
        results.errorsList.push({ row, error: err.message });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('Error importing leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
