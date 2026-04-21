import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/client/[token]/contract — Get contract data for the token-gated contract page
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;

    const lead = await prisma.lead.findUnique({
      where: { token },
      include: { client: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Invalid access link' }, { status: 401 });
    }

    const client = lead.client || (lead.convertedToClientId
      ? await prisma.client.findUnique({ where: { id: lead.convertedToClientId } })
      : null);

    if (!client) {
      return NextResponse.json({ error: 'No client record found' }, { status: 404 });
    }

    // Find the latest AIIO contract
    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ clientId: client.id }, { leadId: lead.id }],
        contractType: 'AIIO_SERVICE_AGREEMENT',
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract) {
      return NextResponse.json({ error: 'No contract found' }, { status: 404 });
    }

    const contractData = contract.terms ? JSON.parse(contract.terms) : null;

    return NextResponse.json({
      success: true,
      contract: {
        id: contract.id,
        signedAt: contract.signedAt,
        signatureName: contract.signatureName,
        contractType: contract.contractType,
        createdAt: contract.createdAt,
      },
      contractData,
      client: {
        id: client.id,
        company: client.company,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone,
      },
      lead: {
        id: lead.id,
        token: lead.token,
        aiiProduct: lead.aiiProduct,
        aiiFee: lead.aiiFee,
      },
    });
  } catch (error: any) {
    console.error('Error fetching contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/client/[token]/contract — Sign the contract
export async function PATCH(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const token = params.token;
    const { signatureName } = await request.json();

    if (!signatureName || signatureName.trim().length < 2) {
      return NextResponse.json({ error: 'Please enter your full legal name' }, { status: 400 });
    }

    const lead = await prisma.lead.findUnique({
      where: { token },
      include: { client: true },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Invalid access link' }, { status: 401 });
    }

    const client = lead.client || (lead.convertedToClientId
      ? await prisma.client.findUnique({ where: { id: lead.convertedToClientId } })
      : null);

    if (!client) {
      return NextResponse.json({ error: 'No client record found' }, { status: 404 });
    }

    // Find and sign the contract
    const contract = await prisma.contract.findFirst({
      where: {
        OR: [{ clientId: client.id }, { leadId: lead.id }],
        contractType: 'AIIO_SERVICE_AGREEMENT',
        signedAt: null, // Only sign unsigned contracts
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract) {
      return NextResponse.json({ error: 'No unsigned contract found' }, { status: 404 });
    }

    const signedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: {
        signedAt: new Date(),
        signatureName: signatureName.trim(),
      },
    });

    return NextResponse.json({ success: true, contract: signedContract });
  } catch (error: any) {
    console.error('Error signing contract:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}