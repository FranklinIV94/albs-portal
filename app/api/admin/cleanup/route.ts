import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// DELETE /api/admin/cleanup - Clean up duplicate services, old chat messages, etc.
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const days = parseInt(searchParams.get('days') || '30'); // Default 30 days for message retention

    if (type === 'services') {
      // Old duplicate IDs to remove
      const oldIds = [
        'tax-prep-business',
        '1120-c-corp',
        '1041-trusts',
        'payroll-1-5-emp',
        'payroll-6-19-emp',
        'payroll-20+-emp',
      ];

      // Keep only the 12 correct services, delete duplicates
      const validIds = [
        'ai-tools-assessment',
        'process-redesign',
        'automation-build',
        'knowledge-systems',
        'custom-workflows',
        'full-implementation',
        '1120-s-+-bookkeeping',
        '1120-(c-corporation)',
        '1041-(trusts-&-estates)',
        'payroll-setup-(1-5-employees)',
        'payroll-setup-(6-19-employees)',
        'payroll-setup-(20+-employees)',
      ];

      // Delete old duplicate IDs
      const deleted = await prisma.service.deleteMany({
        where: { id: { in: oldIds } },
      });

      // Also ensure only valid IDs remain (delete any others)
      await prisma.service.deleteMany({
        where: { NOT: { id: { in: validIds } } },
      });

      // Update remaining services with enhanced descriptions
      const descriptions: Record<string, string> = {
        'ai-tools-assessment': 'Comprehensive 45-minute discovery call to evaluate your current tech stack, followed by a custom AI readiness report with actionable recommendations and a 30-minute walkthrough session.',
        'process-redesign': 'End-to-end workflow analysis: we map your current processes, identify bottlenecks and inefficiencies, design an optimized future state, and deliver an implementation roadmap.',
        'automation-build': 'Custom Zapier/Make.com integrations connecting your existing tools — CRM, email, scheduling, invoicing — into seamless automated workflows that save hours weekly.',
        'knowledge-systems': 'Custom-trained AI assistant built on your company\'s data — SOPs, policies, client FAQs — giving your team instant access to institutional knowledge 24/7.',
        'custom-workflows': 'Tailored AI prompt libraries, templates, and workflow automations designed specifically for your industry and business processes.',
        'full-implementation': 'Complete AI transformation: custom agents managing entire workflows from lead intake to client delivery, with ongoing optimization and support.',
        '1120-s-+-bookkeeping': 'Complete S-Corporation tax preparation (Form 1120-S) paired with year-round monthly bookkeeping, reconciliation, and financial reporting for small businesses.',
        '1120-(c-corporation)': 'Full C-Corporation tax return filing (Form 1120) including all supporting schedules, K-1 preparation, estimated tax planning, and multi-state filing coordination.',
        '1041-(trusts-&-estates)': 'Trust and estate tax return filing (Form 1041) with complex trust accounting, beneficiary K-1 preparation, fiduciary income allocation, and estate distribution reporting.',
        'payroll-setup-(1-5-employees)': 'Complete payroll system setup for 1-5 employees/contractors including direct deposit configuration, tax withholding setup, W-4/I-9 processing, and quarterly tax filing.',
        'payroll-setup-(6-19-employees)': 'Full payroll implementation for 6-19 employees/contractors with multi-state tax compliance, benefits deduction setup, PTO tracking, and dedicated payroll support.',
        'payroll-setup-(20+-employees)': 'Enterprise payroll onboarding for 20+ employees/contractors featuring department-level reporting, custom pay schedules, compliance auditing, and priority support.',
      };

      for (const [id, description] of Object.entries(descriptions)) {
        await prisma.service.update({
          where: { id },
          data: { description },
        });
      }

      const remaining = await prisma.service.findMany({ orderBy: { sortOrder: 'asc' } });

      return NextResponse.json({ 
        deleted: deleted.count, 
        services: remaining 
      });
    }

    if (type === 'leads') {
      // Delete test/duplicate leads
      const deleted = await prisma.lead.deleteMany({
        where: {
          OR: [
            { email: { contains: 'test' } },
            { email: { contains: 'example' } },
          ],
        },
      });
      return NextResponse.json({ 
        message: `Deleted ${deleted.count} test leads` 
      });
    }

    // NEW: Chat/message cleanup - delete old chat messages (ALL messages, not just resolved)
    if (type === 'messages' || type === 'chat') {
      // Default to 1 day if days parameter is provided, otherwise use the value
      const retentionDays = days > 0 ? days : 1;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      // Delete ALL messages older than X days (not just resolved)
      const deleted = await prisma.clientRequest.deleteMany({
        where: {
          createdAt: { lt: cutoffDate },
        },
      });

      return NextResponse.json({ 
        message: `Deleted ${deleted.count} chat messages older than ${retentionDays} day(s)`,
        deletedCount: deleted.count,
        cutoffDate: cutoffDate.toISOString(),
        retentionDays,
      });
    }

    return NextResponse.json({ error: 'Invalid type. Use ?type=services, ?type=leads, or ?type=chat&days=30' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/admin/cleanup - Get cleanup status
export async function GET() {
  try {
    const serviceCount = await prisma.service.count();
    const leadCount = await prisma.lead.count();
    
    // Count messages older than 1 day that could be cleaned up
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const oldMessagesCount = await prisma.clientRequest.count({
      where: {
        createdAt: { lt: oneDayAgo },
      },
    });
    
    return NextResponse.json({
      services: serviceCount,
      leads: leadCount,
      oldMessages: oldMessagesCount,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
