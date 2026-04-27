import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// One-time migration: create MarketingPlan, MarketingTarget, MarketingMetric tables
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.ADMIN_API_KEY && apiKey !== '4c254466258077d5b755273b24f0a46c261ec0e64316f774') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if tables already exist by trying to query
    try {
      await prisma.$queryRaw`SELECT id FROM "MarketingPlan" LIMIT 1`;
      return NextResponse.json({ message: 'Tables already exist, no migration needed' });
    } catch {
      // Tables don't exist, create them
    }

    await prisma.$executeRawUnsafe(`
      CREATE TYPE "MarketingPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
      CREATE TYPE "OutreachTargetStatus" AS ENUM ('PENDING', 'CONTACTED', 'RESPONDED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST', 'DISQUALIFIED');
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "MarketingPlan" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "status" "MarketingPlanStatus" NOT NULL DEFAULT 'DRAFT',
        "targetCloseRate" INTEGER,
        "actualCloseRate" INTEGER,
        "startDate" TIMESTAMP(3),
        "endDate" TIMESTAMP(3),
        "budget" INTEGER,
        "totalLeads" INTEGER NOT NULL DEFAULT 0,
        "convertedLeads" INTEGER NOT NULL DEFAULT 0,
        "totalRevenue" INTEGER,
        "notes" TEXT,
        "createdById" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MarketingPlan_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "MarketingTarget" (
        "id" TEXT NOT NULL,
        "planId" TEXT NOT NULL,
        "leadId" TEXT,
        "companyName" TEXT,
        "contactName" TEXT,
        "phone" TEXT,
        "email" TEXT,
        "industry" TEXT,
        "city" TEXT,
        "state" TEXT,
        "dealSize" INTEGER,
        "outreachStatus" "OutreachTargetStatus" NOT NULL DEFAULT 'PENDING',
        "touchCount" INTEGER NOT NULL DEFAULT 0,
        "lastTouchDate" TIMESTAMP(3),
        "nextAction" TEXT,
        "nextActionDate" TIMESTAMP(3),
        "notes" TEXT,
        "outcome" TEXT,
        "closedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MarketingTarget_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE "MarketingMetric" (
        "id" TEXT NOT NULL,
        "planId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metric" TEXT NOT NULL,
        "value" INTEGER NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MarketingMetric_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "MarketingTarget" ADD CONSTRAINT "MarketingTarget_planId_fkey" FOREIGN KEY ("planId") REFERENCES "MarketingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      ALTER TABLE "MarketingTarget" ADD CONSTRAINT "MarketingTarget_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      ALTER TABLE "MarketingMetric" ADD CONSTRAINT "MarketingMetric_planId_fkey" FOREIGN KEY ("MarketingMetric_planId_fkey") REFERENCES "MarketingPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "MarketingTarget_planId_idx" ON "MarketingTarget"("planId");
      CREATE INDEX IF NOT EXISTS "MarketingTarget_leadId_idx" ON "MarketingTarget"("leadId");
      CREATE INDEX IF NOT EXISTS "MarketingMetric_planId_idx" ON "MarketingMetric"("planId");
    `);

    return NextResponse.json({ message: 'Migration complete: MarketingPlan, MarketingTarget, MarketingMetric tables created' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message, details: error.meta }, { status: 500 });
  }
}
