import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/progress - Get onboarding progress for a lead
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const leadId = searchParams.get('leadId');
    const token = searchParams.get('token');

    let lead;
    if (leadId) {
      lead = await prisma.lead.findUnique({
        where: { id: leadId },
        include: {
          leadServices: { include: { service: true } },
          availability: true,
          contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          projectTimeline: true,
        },
      });
    } else if (token) {
      lead = await prisma.lead.findUnique({
        where: { token },
        include: {
          leadServices: { include: { service: true } },
          availability: true,
          contracts: { orderBy: { createdAt: 'desc' }, take: 1 },
          payments: { orderBy: { createdAt: 'desc' }, take: 1 },
          projectTimeline: true,
        },
      });
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Determine completed steps based on data
    // First check for explicit onboarding step - use if available
    const stepKeys = ['welcome', 'services', 'availability', 'contract', 'work_in_progress', 'payment', 'complete'];
    const completedSteps: string[] = [];
    let currentStep = 'welcome';

    // If lead has explicit onboardingStep and is completed, use those values
    if (lead.onboardingStep && typeof lead.onboardingStep === 'number') {
      const stepNum = Math.min(Math.max(lead.onboardingStep, 0), 7);
      // Mark all steps up to current as completed
      for (let i = 0; i < stepNum; i++) {
        if (stepKeys[i] && !completedSteps.includes(stepKeys[i])) {
          completedSteps.push(stepKeys[i]);
        }
      }
      currentStep = stepKeys[stepNum] || 'welcome';
      // If onboardingCompleted is true, mark complete
      if (lead.onboardingCompleted) {
        completedSteps.push('complete');
        currentStep = 'complete';
      }
    } else {
      // Fall back to inferred logic from data
      // Step 0: Welcome - has basic info
      if (lead.firstName && lead.lastName && lead.email) {
        completedSteps.push('welcome');
      }

      // Step 1: Services - has services selected
      if (lead.leadServices && lead.leadServices.length > 0) {
        completedSteps.push('services');
        currentStep = 'services';
      }

      // Step 2: Availability - has availability set
      if (lead.availability) {
        completedSteps.push('availability');
        currentStep = 'contract';
      }

      // Step 3: Contract - has signed contract
      const signedContract = lead.contracts?.find(c => c.signedAt);
      if (signedContract) {
        completedSteps.push('contract');
        // After contract signed, show "Work in Progress" step before payment
        currentStep = 'work_in_progress';
      }

      // Step 4: Work in Progress - Contract signed, before payment
      if (signedContract && !lead.payments?.find(p => p.status === 'PAID')) {
        completedSteps.push('work_in_progress');
        currentStep = 'payment';
      }

      // Step 5: Payment - has successful payment
      const paidPayment = lead.payments?.find(p => p.status === 'PAID');
      if (paidPayment) {
        completedSteps.push('payment');
        currentStep = 'complete';
      }

      // Step 6: Complete - status is ACTIVE or COMPLETE
      if (lead.status === 'ACTIVE' || lead.status === 'COMPLETE') {
        completedSteps.push('complete');
        currentStep = 'complete';
      }
    }

    // Get milestones from timeline if exists
    let milestones = [];
    if (lead.projectTimeline?.milestones) {
      try {
        milestones = typeof lead.projectTimeline.milestones === 'string' 
          ? JSON.parse(lead.projectTimeline.milestones) 
          : lead.projectTimeline.milestones;
      } catch (e) {
        // Ignore parse errors
      }
    }

    return NextResponse.json({
      leadId: lead.id,
      status: lead.status,
      currentStep,
      completedSteps,
      milestones,
    });
  } catch (error: any) {
    console.error('Progress API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/progress - Update lead status (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { leadId, status, milestone } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'Lead ID required' }, { status: 400 });
    }

    // Update lead status
    if (status) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { status: status as any },
      });
    }

    // Add/update milestone
    if (milestone) {
      const existing = await prisma.projectTimeline.findUnique({
        where: { leadId },
      });

      let milestones = [];
      if (existing?.milestones) {
        try {
          milestones = typeof existing.milestones === 'string'
            ? JSON.parse(existing.milestones)
            : existing.milestones;
        } catch (e) {}
      }

      milestones.push({
        ...milestone,
        createdAt: new Date().toISOString(),
      });

      await prisma.projectTimeline.upsert({
        where: { leadId },
        update: { milestones },
        create: { leadId, milestones },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Progress update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}