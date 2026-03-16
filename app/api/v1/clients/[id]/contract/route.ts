import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// POST /api/v1/clients/[id]/contract - Generate and send contract
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { contractType, terms, sendToClient } = body;
    
    // Check if client exists
    const client = await prisma.lead.findUnique({
      where: { id },
      include: { leadServices: { include: { service: true } } },
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Build contract content based on services
    let contractContent = terms || `
CONTRACT AGREEMENT

This Service Agreement is entered into between All Lines Business Solutions ("Provider")
and ${client.firstName || ''} ${client.lastName || ''} ${client.company ? `of ${client.company}` : ''} ("Client").

SERVICES:
${client.leadServices?.map(s => `- ${s.service.name}: ${s.service.description}`).join('\n') || 'Services as outlined in proposal'}

TERMS:
- Payment is due upon completion of services
- 30-day notice required for cancellation
- All intellectual property remains with Provider until full payment

SIGNATURES:

Client: ___________________________  Date: ___________

Provider: _________________________  Date: ___________
    `.trim();
    
    // Create contract record
    const contract = await prisma.contract.create({
      data: {
        leadId: id,
        contractType: contractType || 'Service Agreement',
        terms: contractContent,
      },
    });
    
    // If sendToClient is true, we could trigger an email (not implemented yet)
    // For now, just return the contract
    
    return NextResponse.json({
      id: contract.id,
      contractType: contract.contractType,
      status: contract.signedAt ? 'signed' : 'pending',
      signedAt: contract.signedAt,
      createdAt: contract.createdAt,
      terms: contract.terms,
      // Client can sign at this URL
      signingUrl: `/onboard/${client.token}?step=contract`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/v1/clients/[id]/contract error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/v1/clients/[id]/contract - Update contract status (sign, update terms)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const body = await request.json();
    const { signatureName, signed, terms, contractId } = body;
    
    // Check if client exists
    const client = await prisma.lead.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // If contractId provided, update that specific contract
    // Otherwise, get the most recent contract
    let contract;
    if (contractId) {
      contract = await prisma.contract.findUnique({ where: { id: contractId } });
    } else {
      const contracts = await prisma.contract.findMany({
        where: { leadId: id },
        orderBy: { createdAt: 'desc' },
        take: 1,
      });
      contract = contracts[0];
    }
    
    if (!contract) {
      return NextResponse.json({ error: 'No contract found to update' }, { status: 404 });
    }
    
    // Update contract
    const updateData: any = {};
    
    if (terms !== undefined) {
      updateData.terms = terms;
    }
    
    if (signed && signatureName) {
      updateData.signedAt = new Date();
      updateData.signatureName = signatureName;
      
      // Update client status to CONTRACT if they just signed
      await prisma.lead.update({
        where: { id },
        data: { status: 'CONTRACT' },
      });
    }
    
    const updatedContract = await prisma.contract.update({
      where: { id: contract.id },
      data: updateData,
    });
    
    // If signed, also check if we should move to payment step
    if (updatedContract.signedAt) {
      // Check if there's a payment - if not, client should proceed to payment
      const hasPayment = await prisma.payment.findFirst({
        where: { leadId: id, status: 'PAID' },
      });
      
      if (!hasPayment) {
        await prisma.lead.update({
          where: { id },
          data: { status: 'PAYMENT' },
        });
      }
    }
    
    return NextResponse.json({
      id: updatedContract.id,
      contractType: updatedContract.contractType,
      status: updatedContract.signedAt ? 'signed' : 'pending',
      signedAt: updatedContract.signedAt,
      signatureName: updatedContract.signatureName,
      updatedAt: updatedContract.updatedAt,
    });
  } catch (error: any) {
    console.error('PATCH /api/v1/clients/[id]/contract error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/v1/clients/[id]/contract - Get contracts for client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    
    // Check if client exists
    const client = await prisma.lead.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    const contracts = await prisma.contract.findMany({
      where: { leadId: id },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json({
      contracts: contracts.map(c => ({
        id: c.id,
        contractType: c.contractType,
        status: c.signedAt ? 'signed' : 'pending',
        signedAt: c.signedAt,
        signatureName: c.signatureName,
        createdAt: c.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('GET /api/v1/clients/[id]/contract error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}