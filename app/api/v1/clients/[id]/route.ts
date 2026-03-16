import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/clients/[id] - Get single client details
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
    
    const client = await prisma.lead.findUnique({
      where: { id },
      include: {
        positions: true,
        availability: true,
        leadServices: {
          include: { service: true },
        },
        contracts: {
          orderBy: { createdAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
        projectTimeline: true,
        clientRequests: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Calculate progress based on data
    const completedSteps: string[] = [];
    let currentStep = 'welcome';
    
    if (client.firstName && client.lastName && client.email) {
      completedSteps.push('welcome');
    }
    if (client.leadServices && client.leadServices.length > 0) {
      completedSteps.push('services');
      currentStep = 'services';
    }
    if (client.availability) {
      completedSteps.push('availability');
      currentStep = 'contract';
    }
    const signedContract = client.contracts.find(c => c.signedAt);
    if (signedContract) {
      completedSteps.push('contract');
      currentStep = 'payment';
    }
    const paidPayment = client.payments.find(p => p.status === 'PAID');
    if (paidPayment) {
      completedSteps.push('payment');
      currentStep = 'complete';
    }
    if (client.status === 'ACTIVE' || client.status === 'COMPLETE') {
      completedSteps.push('complete');
      currentStep = 'complete';
    }
    
    return NextResponse.json({
      ...client,
      completedSteps,
      currentStep,
      onboardingUrl: `/onboard/${client.token}`,
    });
  } catch (error: any) {
    console.error('GET /api/v1/clients/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/v1/clients/[id] - Update client info or status
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
    const { 
      firstName, lastName, email, company, phone, title, notes,
      serviceCategories, status, aiLookingFor, aiHasAutomation,
      aiAutomationDetails, aiPainPoints, aiCurrentTools, aiAdditionalDetails
    } = body;
    
    // Check if client exists
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Check for duplicate email if changing
    if (email && email !== existing.email) {
      const duplicate = await prisma.lead.findFirst({ where: { email } });
      if (duplicate) {
        return NextResponse.json(
          { error: 'A client with this email already exists' },
          { status: 409 }
        );
      }
    }
    
    // Build update data
    const updateData: any = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (company !== undefined) updateData.company = company;
    if (phone !== undefined) updateData.phone = phone;
    if (title !== undefined) updateData.title = title;
    if (notes !== undefined) updateData.notes = notes;
    if (serviceCategories !== undefined) {
      updateData.serviceCategories = serviceCategories.join(',');
    }
    if (status !== undefined) updateData.status = status;
    
    // AI intake fields
    if (aiLookingFor !== undefined) updateData.aiLookingFor = aiLookingFor;
    if (aiHasAutomation !== undefined) updateData.aiHasAutomation = aiHasAutomation;
    if (aiAutomationDetails !== undefined) updateData.aiAutomationDetails = aiAutomationDetails;
    if (aiPainPoints !== undefined) updateData.aiPainPoints = aiPainPoints;
    if (aiCurrentTools !== undefined) updateData.aiCurrentTools = aiCurrentTools;
    if (aiAdditionalDetails !== undefined) updateData.aiAdditionalDetails = aiAdditionalDetails;
    
    const client = await prisma.lead.update({
      where: { id },
      data: updateData,
    });
    
    return NextResponse.json(client);
  } catch (error: any) {
    console.error('PATCH /api/v1/clients/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/v1/clients/[id] - Soft delete (archive) client
export async function DELETE(
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
    const existing = await prisma.lead.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Soft delete - change status to ARCHIVED (need to add to enum first, or use existing)
    // For now, we'll set status to a terminal state
    // If ARCHIVED doesn't exist in enum, we can add note instead
    const client = await prisma.lead.update({
      where: { id },
      data: { 
        status: 'COMPLETE', // Using COMPLETE as archive proxy
        notes: (existing.notes || '') + '\n[ARCHIVED DELETION]',
      },
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Client archived',
      id: client.id,
    });
  } catch (error: any) {
    console.error('DELETE /api/v1/clients/[id] error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}