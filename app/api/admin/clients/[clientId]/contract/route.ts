import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendContractEmail } from '@/lib/email';

// AIIO Service tier descriptions
const TIER_INFO: Record<string, { name: string; description: string; deliverables: string[]; timeline: string }> = {
  Assessment: {
    name: 'AIIO Assessment',
    description: 'Comprehensive AI opportunity assessment for your business operations.',
    deliverables: [
      'Full operational workflow audit',
      'AI opportunity identification report',
      'ROI projections and prioritized roadmap',
      'Executive summary with recommended next steps',
    ],
    timeline: '2–3 weeks from kickoff',
  },
  Foundation: {
    name: 'AIIO Foundation',
    description: 'End-to-end implementation of your first high-impact AI automation.',
    deliverables: [
      'Assessment deliverables included',
      'Custom AI workflow design and build',
      'Integration with existing tools and systems',
      'Team training and documentation',
      '30-day post-launch support',
    ],
    timeline: '4–6 weeks from kickoff',
  },
  Growth: {
    name: 'AIIO Growth',
    description: 'Scaled AI implementation across multiple business functions with ongoing optimization.',
    deliverables: [
      'Foundation deliverables included',
      'Multi-process automation rollout',
      'Advanced analytics and reporting dashboards',
      'Quarterly strategy reviews',
      'Priority support and ongoing optimization',
    ],
    timeline: '6–10 weeks from kickoff',
  },
  Enterprise: {
    name: 'AIIO Enterprise',
    description: 'Full-scale AI transformation with dedicated account management and continuous improvement.',
    deliverables: [
      'Growth deliverables included',
      'Dedicated AI strategist and account manager',
      'Custom model training and fine-tuning',
      'Unlimited process automation requests',
      'Monthly business reviews and KPI tracking',
      'SLA-backed response times',
    ],
    timeline: '8–12 weeks from kickoff (ongoing thereafter)',
  },
};

// POST - Generate contract and send email
export async function POST(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const clientId = params.clientId;
    const body = await request.json().catch(() => ({}));
    const { depositPercent = 50 } = body;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: { lead: true, contracts: true },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get fee from lead or use default
    const totalFee = client.lead?.aiiFee || 0;
    const depositAmount = Math.round(totalFee * (depositPercent / 100));
    const product = client.lead?.aiiProduct || 'Assessment';
    const tierInfo = TIER_INFO[product] || TIER_INFO.Assessment;

    if (totalFee === 0) {
      return NextResponse.json({ error: 'No fee set. Set aiiFee on the lead before generating a contract.' }, { status: 400 });
    }

    // Build contract terms
    const contractData = {
      albs: {
        name: 'All Lines Business Solutions LLC',
        address: 'Punta Gorda, FL',
        email: 'support@simplifyingbusinesses.com',
        phone: '(561) 589-8900',
      },
      client: {
        company: client.company || '',
        firstName: client.firstName || '',
        lastName: client.lastName || '',
        email: client.email || '',
        phone: client.phone || '',
        address: [client.billingAddress, client.billingCity, client.billingState, client.billingZip].filter(Boolean).join(', '),
      },
      service: {
        product,
        name: tierInfo.name,
        description: tierInfo.description,
        deliverables: tierInfo.deliverables,
        timeline: tierInfo.timeline,
      },
      pricing: {
        totalFee,
        depositPercent,
        depositAmount,
        remainingBalance: totalFee - depositAmount,
      },
      paymentTerms: 'Deposit due upon signing. Remaining balance due upon project completion or per agreed milestone schedule.',
      autoConvertClause: 'Upon execution of this agreement and receipt of deposit, Client is engaged for the Services described herein.',
      generatedAt: new Date().toISOString(),
    };

    // Create contract record
    const contract = await prisma.contract.create({
      data: {
        clientId,
        leadId: client.leadId,
        contractType: 'AIIO_SERVICE_AGREEMENT',
        terms: JSON.stringify(contractData),
        // Status tracked by signedAt being null = SENT
      },
    });

    // Get client token for URL — use lead token if available, or generate one
    const leadToken = client.lead?.token;
    if (!leadToken) {
      return NextResponse.json({ error: 'No token found for client. Lead token required.' }, { status: 400 });
    }

    // Send contract email
    const contractUrl = `${process.env.NEXT_PUBLIC_URL || 'https://onboarding.simplifyingbusinesses.com'}/client/${leadToken}/contract`;
    const clientName = [client.firstName, client.lastName].filter(Boolean).join(' ') || client.company || 'Client';

    await sendContractEmail({
      to: client.email || '',
      clientName,
      contractUrl,
      serviceName: tierInfo.name,
      totalFee,
      depositAmount,
    });

    return NextResponse.json({
      success: true,
      contract,
      contractData,
      contractUrl,
    });
  } catch (error: any) {
    console.error('Error generating contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH - Sign contract
export async function PATCH(
  request: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const clientId = params.clientId;
    const body = await request.json();
    const { contractId, signatureName } = body;

    if (!contractId || !signatureName) {
      return NextResponse.json({ error: 'contractId and signatureName required' }, { status: 400 });
    }

    const contract = await prisma.contract.update({
      where: { id: contractId },
      data: {
        signedAt: new Date(),
        signatureName,
      },
    });

    return NextResponse.json({ success: true, contract });
  } catch (error: any) {
    console.error('Error signing contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}