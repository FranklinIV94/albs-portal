import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { validateApiKey } from '@/lib/auth';

// GET /api/v1/clients/[id]/progress - Get client onboarding progress
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
        leadServices: { include: { service: true } },
        availability: true,
        contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
        payments: { orderBy: { createdAt: 'desc' }, take: 1 },
        projectTimeline: true,
      },
    });
    
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Determine completed steps based on data
    const completedSteps: string[] = [];
    let currentStep = 'welcome';
    
    // Step 0: Welcome - has basic info
    if (client.firstName && client.lastName && client.email) {
      completedSteps.push('welcome');
    }
    
    // Step 1: Services - has services selected
    if (client.leadServices && client.leadServices.length > 0) {
      completedSteps.push('services');
      currentStep = 'services';
    }
    
    // Step 2: Availability - has availability set
    if (client.availability) {
      completedSteps.push('availability');
      currentStep = 'contract';
    }
    
    // Step 3: Contract - has signed contract
    const signedContract = client.contracts?.find(c => c.signedAt);
    if (signedContract) {
      completedSteps.push('contract');
      currentStep = 'payment';
    }
    
    // Step 4: Payment - has successful payment
    const paidPayment = client.payments?.find(p => p.status === 'PAID');
    if (paidPayment) {
      completedSteps.push('payment');
      currentStep = 'complete';
    }
    
    // Step 5: Complete - status is ACTIVE or COMPLETE
    if (client.status === 'ACTIVE' || client.status === 'COMPLETE') {
      completedSteps.push('complete');
      currentStep = 'complete';
    }
    
    // Get milestones from timeline if exists
    let milestones: any[] = [];
    if (client.projectTimeline?.milestones) {
      try {
        milestones = typeof client.projectTimeline.milestones === 'string' 
          ? JSON.parse(client.projectTimeline.milestones) 
          : client.projectTimeline.milestones;
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    return NextResponse.json({
      clientId: client.id,
      status: client.status,
      currentStep,
      completedSteps,
      progress: {
        welcome: completedSteps.includes('welcome'),
        services: completedSteps.includes('services'),
        availability: completedSteps.includes('availability'),
        contract: completedSteps.includes('contract'),
        payment: completedSteps.includes('payment'),
        complete: completedSteps.includes('complete'),
      },
      milestones,
      onboardingUrl: `/onboard/${client.token}`,
    });
  } catch (error: any) {
    console.error('GET /api/v1/clients/[id]/progress error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/v1/clients/[id]/progress - Update progress or milestones
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
    const { status, milestone, removeMilestone } = body;
    
    // Check if client exists
    const client = await prisma.lead.findUnique({ where: { id } });
    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }
    
    // Update client status if provided
    if (status) {
      await prisma.lead.update({
        where: { id },
        data: { status: status as any },
      });
    }
    
    // Handle milestones
    const existingTimeline = await prisma.projectTimeline.findUnique({
      where: { leadId: id },
    });
    
    let milestones: any[] = [];
    if (existingTimeline?.milestones) {
      try {
        milestones = typeof existingTimeline.milestones === 'string'
          ? JSON.parse(existingTimeline.milestones)
          : existingTimeline.milestones;
      } catch (e) {
        milestones = [];
      }
    }
    
    // Add new milestone
    if (milestone) {
      milestones.push({
        ...milestone,
        createdAt: new Date().toISOString(),
      });
    }
    
    // Remove milestone by title
    if (removeMilestone) {
      milestones = milestones.filter((m: any) => m.title !== removeMilestone);
    }
    
    // Upsert timeline
    await prisma.projectTimeline.upsert({
      where: { leadId: id },
      update: { milestones },
      create: { leadId: id, milestones },
    });
    
    return NextResponse.json({
      success: true,
      status: status || client.status,
      milestones,
    });
  } catch (error: any) {
    console.error('PATCH /api/v1/clients/[id]/progress error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}