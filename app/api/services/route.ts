import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      token, 
      // AI Services
      aiAssessment,
      processRedesign,
      automationBuild,
      knowledgeSystems,
      customWorkflows,
      fullImplementation,
      // Tax Services
      taxPreparation,
      taxPreparation1120,
      taxPreparation1041,
      // Payroll Setup
      payroll15,
      payroll619,
      payroll20plus,
      // Payroll & Bookkeeping
      payrollBookkeeping15,
      payrollBookkeeping619,
      payrollBookkeeping20Plus,
      standaloneBookkeeping,
      // Marketing
      seoOptimization,
      websiteRedesign,
      websiteDeployment,
      landingPages,
      marketingCampaigns,
      leadGeneration,
      // Notes
      notes,
      // AI Intake fields
      aiLookingFor,
      aiHasAutomation,
      aiAutomationDetails,
      aiPainPoints,
      aiCurrentTools,
      aiAdditionalDetails
    } = body;

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the lead by token
    const lead = await prisma.lead.findUnique({
      where: { token },
      include: { serviceSelection: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Upsert service selection
    const updatedSelection = await prisma.serviceSelection.upsert({
      where: { leadId: lead.id },
      update: {
        aiAssessment: aiAssessment ?? false,
        processRedesign: processRedesign ?? false,
        automationBuild: automationBuild ?? false,
        knowledgeSystems: knowledgeSystems ?? false,
        customWorkflows: customWorkflows ?? false,
        fullImplementation: fullImplementation ?? false,
        taxPreparation: taxPreparation ?? false,
        taxPreparation1120: taxPreparation1120 ?? false,
        taxPreparation1041: taxPreparation1041 ?? false,
        payroll15: payroll15 ?? false,
        payroll619: payroll619 ?? false,
        payroll20plus: payroll20plus ?? false,
        notes: notes ?? null,
        status: 'pending',
      },
      create: {
        leadId: lead.id,
        aiAssessment: aiAssessment ?? false,
        processRedesign: processRedesign ?? false,
        automationBuild: automationBuild ?? false,
        knowledgeSystems: knowledgeSystems ?? false,
        customWorkflows: customWorkflows ?? false,
        fullImplementation: fullImplementation ?? false,
        taxPreparation: taxPreparation ?? false,
        taxPreparation1120: taxPreparation1120 ?? false,
        taxPreparation1041: taxPreparation1041 ?? false,
        payroll15: payroll15 ?? false,
        payroll619: payroll619 ?? false,
        payroll20plus: payroll20plus ?? false,
        notes: notes ?? null,
        status: 'pending',
      },
    });

    // Also update AI intake fields on the Lead record
    if (aiLookingFor || aiHasAutomation || aiPainPoints || aiCurrentTools || aiAdditionalDetails) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          aiLookingFor: aiLookingFor ?? null,
          aiHasAutomation: aiHasAutomation ?? null,
          aiAutomationDetails: aiAutomationDetails ?? null,
          aiPainPoints: aiPainPoints ?? null,
          aiCurrentTools: aiCurrentTools ?? null,
          aiAdditionalDetails: aiAdditionalDetails ?? null,
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      serviceSelection: updatedSelection 
    });
  } catch (error) {
    console.error('Error saving service selection:', error);
    return NextResponse.json(
      { error: 'Failed to save service selection' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch service selection for a lead
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { token },
      include: { serviceSelection: true },
    });

    if (!lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      lead: {
        id: lead.id,
        firstName: lead.firstName,
        lastName: lead.lastName,
      },
      serviceSelection: lead.serviceSelection 
    });
  } catch (error) {
    console.error('Error fetching service selection:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service selection' },
      { status: 500 }
    );
  }
}
