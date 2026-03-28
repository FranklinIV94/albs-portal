import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Lazy load Stripe
function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Stripe is not configured');
  }
  const Stripe = require('stripe');
  return new Stripe(key);
}

// GET /api/admin/analytics - Get revenue analytics and payout data
export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    
    // Get payment data
    const payments = await prisma.payment.findMany({
      where: { status: 'PAID' },
      include: {
        lead: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          }
        }
      },
      orderBy: { paidAt: 'desc' },
    });

    // Also get PAID invoices (for revenue from invoices that may not have Payment records)
    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'PAID' },
      select: {
        id: true,
        total: true,
        paidAt: true,
        lead: {
          select: {
            firstName: true,
            lastName: true,
            company: true,
          }
        }
      },
      orderBy: { paidAt: 'desc' },
    });

    // Combine payment and invoice data for revenue calculation
    const allPaidRecords = [
      ...payments.map(p => ({ id: p.id, amount: p.amount, paidAt: p.paidAt, source: 'payment', lead: p.lead })),
      ...paidInvoices.map(i => ({ id: i.id, amount: i.total, paidAt: i.paidAt, source: 'invoice', lead: i.lead })),
    ].filter(r => r.paidAt);

    // Calculate revenue from combined data (amounts stored in cents, convert to dollars)
    const monthRevenue = Math.round(
      allPaidRecords
        .filter(r => r.paidAt && new Date(r.paidAt) >= startOfMonth)
        .reduce((sum, r) => sum + r.amount, 0) / 100
    );

    const yearRevenue = Math.round(
      allPaidRecords
        .filter(r => r.paidAt && new Date(r.paidAt) >= startOfYear)
        .reduce((sum, r) => sum + r.amount, 0) / 100
    );

    // Get active clients count
    const activeClients = await prisma.lead.count({
      where: { status: { in: ['ACTIVE', 'WORK_IN_PROGRESS'] } },
    });

    // Get leads by status
    const leadsByStatus = await prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    // Get recent payments (last 10, combined from payments and invoices)
    const recentPayments = allPaidRecords.slice(0, 10).map(p => ({
      id: p.id,
      amount: p.amount,
      paidAt: p.paidAt,
      leadName: p.lead ? `${p.lead.firstName} ${p.lead.lastName}` : 'Unknown',
      company: p.lead?.company || '',
      source: p.source,
    }));

    // Get monthly revenue for the last 6 months (for chart)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthRevenue = payments
        .filter(p => {
          if (!p.paidAt) return false;
          const paidDate = new Date(p.paidAt);
          return paidDate >= monthStart && paidDate <= monthEnd;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      monthlyData.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        revenue: Math.round(monthRevenue / 100), // Convert to dollars
      });
    }

    // Get Stripe payouts (if configured)
    let stripePayouts: any[] = [];
    try {
      const stripe = getStripe();
      const payouts = await stripe.payouts.list({ limit: 20 });
      stripePayouts = payouts.data.map((p: any) => ({
        id: p.id,
        amount: Math.round(p.amount / 100), // Convert cents to dollars
        status: p.status,
        created: p.created, // Return Unix timestamp in seconds (Stripe default)
        arrivalDate: p.arrival_date || null, // Unix timestamp or null
      }));
    } catch (stripeError: any) {
      console.log('Stripe payouts not available:', stripeError.message);
    }

    // Goals
    const GOAL_AVG = 20000; // $20K average
    const GOAL_TARGET = 35000; // $35K target

    return NextResponse.json({
      revenue: {
        thisMonth: monthRevenue,
        thisYear: yearRevenue,
        goalAvg: GOAL_AVG * 100,
        goalTarget: GOAL_TARGET * 100,
        thisMonthVsGoal: Math.round((monthRevenue / (GOAL_AVG * 100)) * 100),
        thisMonthVsTarget: Math.round((monthRevenue / (GOAL_TARGET * 100)) * 100),
      },
      activeClients,
      leadsByStatus: leadsByStatus.reduce((acc, s) => {
        acc[s.status] = s._count.status;
        return acc;
      }, {} as Record<string, number>),
      recentPayments,
      monthlyData,
      stripePayouts,
    });
  } catch (error: any) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}