import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendConfirmationEmail } from '@/lib/email';

// GET /api/onboard/[token] - Get lead by token
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    
    const lead = await prisma.lead.findUnique({
      where: { token },
      include: {
        positions: true,
        availability: true,
        leadServices: {
          include: { service: true }
        },
        contracts: true,
        subscriptions: true,
        payments: { orderBy: { createdAt: 'desc' }, take: 10 },
        clientRequests: true,
        proposals: {
          where: { status: { in: ['SENT', 'VIEWED', 'ACCEPTED'] } },
          include: { services: { include: { service: true } } },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
    });

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Get services for this lead
    let services: any[] = [];
    const categoriesFilter = lead.serviceCategories 
      ? lead.serviceCategories.split(',').map((c: string) => c.trim())
      : null;
    
    // Check if there's an active proposal
    const activeProposal = lead.proposals && lead.proposals.length > 0 ? lead.proposals[0] : null;
    
    if (activeProposal && activeProposal.services.length > 0) {
      // Use proposal-specific services with custom pricing
      services = activeProposal.services.map(ps => ({
        ...ps.service,
        customPrice: ps.customPrice,
        discountType: ps.discountType,
        discountValue: ps.discountValue,
        serviceNotes: ps.notes,
        proposalId: activeProposal.id
      }));
    } else if (lead.leadServices && lead.leadServices.length > 0) {
      // Only show services assigned to this lead
      services = lead.leadServices.map(ls => ls.service);
    } else {
      // Filter by allowed categories if set, otherwise show all
      const whereClause: any = { isActive: true };
      if (categoriesFilter && categoriesFilter.length > 0) {
        whereClause.category = { in: categoriesFilter };
      }
      services = await prisma.service.findMany({
        where: whereClause,
        orderBy: { sortOrder: 'asc' },
      });
    }

    // Include AI intake fields
    const aiIntake = {
      aiLookingFor: lead.aiLookingFor,
      aiHasAutomation: lead.aiHasAutomation,
      aiAutomationDetails: lead.aiAutomationDetails,
      aiPainPoints: lead.aiPainPoints,
      aiCurrentTools: lead.aiCurrentTools,
      aiAdditionalDetails: lead.aiAdditionalDetails,
    };

    return NextResponse.json({ lead, services, aiIntake, activeProposal: activeProposal || null });
  } catch (error: any) {
    console.error('Error fetching lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/onboard/[token] - Update lead during onboarding
export async function POST(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    const body = await request.json();
    const { 
      firstName, lastName, email, company, title, phone, 
      serviceIds, notes, availability,
      aiLookingFor, aiHasAutomation, aiAutomationDetails,
      aiPainPoints, aiCurrentTools, aiAdditionalDetails,
      onboardingStep
    } = body;

    // Track onboarding progress
    const progressData: any = {};
    if (onboardingStep !== undefined) {
      progressData.onboardingStep = onboardingStep;
    }

    // Update lead basic info
    const lead = await prisma.lead.update({
      where: { token },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(email && { email }),
        ...(company && { company }),
        ...(title && { title }),
        ...(phone && { phone }),
        ...(notes !== undefined && { notes }),
        // AI intake fields
        ...(aiLookingFor !== undefined && { aiLookingFor }),
        ...(aiHasAutomation !== undefined && { aiHasAutomation }),
        ...(aiAutomationDetails !== undefined && { aiAutomationDetails }),
        ...(aiPainPoints !== undefined && { aiPainPoints }),
        ...(aiCurrentTools !== undefined && { aiCurrentTools }),
        ...(aiAdditionalDetails !== undefined && { aiAdditionalDetails }),
        // Progress tracking
        status: 'ONBOARDING',
        ...progressData,
      },
    });

    // Handle service selections
    if (serviceIds && serviceIds.length > 0) {
      // Validate all serviceIds exist first (BUG-001 fix)
      const validServices = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true },
      });
      const validServiceIds = validServices.map(s => s.id);
      const invalidServiceIds = serviceIds.filter((id: string) => !validServiceIds.includes(id));
      
      if (invalidServiceIds.length > 0) {
        return NextResponse.json({ 
          error: 'Invalid service(s) selected', 
          invalidIds: invalidServiceIds 
        }, { status: 400 });
      }
      
      // Remove existing selections
      await prisma.leadService.deleteMany({ where: { leadId: lead.id } });
      
      // Add new selections
      await prisma.leadService.createMany({
        data: serviceIds.map((serviceId: string) => ({
          leadId: lead.id,
          serviceId,
        })),
      });
    }

    // Handle availability
    if (availability) {
      await prisma.availability.upsert({
        where: { leadId: lead.id },
        update: availability,
        create: { ...availability, leadId: lead.id },
      });
    }

    // Send confirmation email to lead
    if (lead.email) {
      try {
        await sendConfirmationEmail({
          to: lead.email,
          firstName: lead.firstName || 'there',
        });
        console.log('Confirmation email sent to:', lead.email);
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }
    }

    // Return updated lead
    const updatedLead = await prisma.lead.findUnique({
      where: { token },
      include: {
        positions: true,
        availability: true,
        leadServices: { include: { service: true } },
      },
    });

    return NextResponse.json({ success: true, lead: updatedLead });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/onboard/[token]/complete - Complete onboarding (sign contract)
export async function PUT(request: NextRequest, { params }: { params: { token: string } }) {
  try {
    const token = params.token;
    const body = await request.json();
    const { signatureName, ipAddress, portalPin, onboardingStep, onboardingCompleted } = body;

    // Find lead
    const existingLead = await prisma.lead.findUnique({ where: { token } });
    if (!existingLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Early return for PIN-only update (no signature needed)
    if (portalPin && !signatureName) {
      const lead = await prisma.lead.update({
        where: { token },
        data: { 
          portalPin,
          onboardingStep: onboardingStep ?? 4,
          onboardingCompleted: onboardingCompleted ?? true,
          status: 'ACTIVE',
        },
      });
      return NextResponse.json({ success: true, lead });
    }

    // Get services for the agreement
    const leadServices = await prisma.leadService.findMany({
      where: { leadId: existingLead.id },
      include: { service: true },
    });

    // Build service list for agreement
    const serviceList = leadServices.map(ls => {
      const price = ls.customPrice || ls.service.basePrice;
      return `${ls.service.icon} ${ls.service.name} - $${(price / 100).toFixed(2)}`;
    }).join('\n');

    // Generate full agreement text with UPDATED TERMS (March 12, 2026)
    const agreementTerms = `MASTER SERVICE AGREEMENT

This Master Service Agreement (the "Agreement") is entered into as of ${new Date().toLocaleDateString()} (the "Effective Date) by and between Simplifying Businesses ("Provider") and the undersigned client ("Client").

1. SCOPE OF SERVICES
Provider agrees to perform the services selected by the Client during the onboarding process:

${serviceList}

2. COMPENSATION AND PAYMENT
Fees: Client agrees to pay the fees associated with the selected services as outlined above.
Payment Schedule: 
• One-time Projects: 100% due upfront unless otherwise specified.
• Monthly Recurring Services: Fees are billed in advance on the 1st of each month.
Late Payments: Payments not received within 7 days of the due date will incur a late fee of 1.5% per month.

3. PAYMENT TERMS & SERVICE INTERRUPTION (UPDATED MARCH 2026)
Payment is due upon receipt of invoice. If any invoice remains unpaid for more than seven (7) days, all non-payroll services will be suspended until payment is received in full.

Payroll Services Exception: Managed payroll services will continue uninterrupted until an account becomes thirty (30) days delinquent, at which time all services will be suspended.

Service resumption after suspension requires payment of all outstanding balances plus any applicable reactivation fees. Provider reserves the right to terminate services upon thirty (30) days of continuous non-payment.

4. CONFIDENTIALITY & PROPRIETARY INFORMATION (UPDATED MARCH 2026)
All methodologies, processes, templates, documents, and materials provided by Provider in connection with services rendered are proprietary and confidential. Client agrees not to disclose, reproduce, or distribute any materials received without prior written consent. Client acknowledges that unauthorized use or disclosure may cause irreparable harm for which legal remedies may be sought.

5. TERM AND TERMINATION
Term: This Agreement commences on the Effective Date and continues until completion of services.
Termination (Monthly Services): Either party may terminate with 30 days' written notice.
Termination for Cause: Either party may terminate immediately if the other party breaches and fails to cure within 10 days of notice.

6. CLIENT RESPONSIBILITIES
• Provide timely access to necessary accounts
• Appoint a primary point of contact for approvals
• Ensure all data provided is accurate

7. CONFIDENTIALITY & PROPRIETARY RIGHTS
Both parties agree to keep all non-public information strictly confidential.
Work Product: Upon full payment, Client shall own deliverables created specifically for them.
Provider retains ownership of pre-existing toolsets, "know-how," and generic methods.

8. LIMITATION OF LIABILITY
Provider's total liability shall not exceed the total amount paid during the three (3) months preceding any claim. Provider is not liable for indirect, incidental, or consequential damages.

9. TAX & COMPLIANCE DISCLAIMER
For Tax and Bookkeeping services, Provider relies on information provided by Client. Client is responsible for final accuracy. Provider does not provide legal advice.

10. GOVERNING LAW
This Agreement shall be governed by the laws of the State of Colorado.

SIGNATURES

Provider: Simplified Businesses LLC
Client: ${signatureName}
Date: ${new Date().toLocaleDateString()}`;

    // Create contract with full terms
    const contract = await prisma.contract.create({
      data: {
        leadId: existingLead.id,
        signatureName,
        ipAddress,
        signedAt: new Date(),
        contractType: 'Master Service Agreement',
        terms: agreementTerms,
      },
    });

    // Update lead status based on progress
    const updateData: any = { 
      status: onboardingCompleted ? 'ACTIVE' : 'CONTRACT',
    };
    
    // Update step if provided (for PIN setup)
    if (onboardingStep !== undefined) {
      updateData.onboardingStep = onboardingStep;
    }
    
    // Mark complete if PIN was set
    if (onboardingCompleted) {
      updateData.onboardingCompleted = true;
    }
    
    // Save PIN if provided
    if (portalPin) {
      updateData.portalPin = portalPin;
    }
    
    const lead = await prisma.lead.update({
      where: { token },
      data: updateData,
    });

    return NextResponse.json({ success: true, lead, contract });
  } catch (error: any) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}