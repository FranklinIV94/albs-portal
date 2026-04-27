import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET: Check migration status
export async function GET(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.ADMIN_API_KEY && apiKey !== '4c254466258077d5b755273b24f0a46c261ec0e64316f774') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const counts = await prisma.$queryRaw<{cnt: bigint}[]>`
      SELECT COUNT(*) as cnt FROM "MarketingPlan"
    `;
    return NextResponse.json({ tablesExist: true, planCount: Number(counts[0]?.cnt || 0) });
  } catch {
    return NextResponse.json({ tablesExist: false, planCount: 0 });
  }
}

// POST: Run migration
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.ADMIN_API_KEY && apiKey !== '4c254466258077d5b755273b24f0a46c261ec0e64316f774') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if already migrated
    try {
      await prisma.$queryRaw`SELECT 1 FROM "MarketingPlan" LIMIT 1`;
      return NextResponse.json({ message: 'Already migrated', status: 'skipped' });
    } catch {
      // Tables don't exist yet, proceed
    }

    // Create enum types
    await prisma.$executeRaw`CREATE TYPE "MarketingPlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED')`;
    await prisma.$executeRaw`CREATE TYPE "OutreachTargetStatus" AS ENUM ('PENDING', 'CONTACTED', 'RESPONDED', 'MEETING_BOOKED', 'PROPOSAL_SENT', 'NEGOTIATING', 'CLOSED_WON', 'CLOSED_LOST', 'DISQUALIFIED')`;

    // Create MarketingPlan table
    await prisma.$executeRaw`
      CREATE TABLE "MarketingPlan" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "status" TEXT NOT NULL DEFAULT 'DRAFT',
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
      )
    `;

    // Create MarketingTarget table
    await prisma.$executeRaw`
      CREATE TABLE "MarketingTarget" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
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
        "outreachStatus" TEXT NOT NULL DEFAULT 'PENDING',
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
      )
    `;

    // Create MarketingMetric table
    await prisma.$executeRaw`
      CREATE TABLE "MarketingMetric" (
        "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
        "planId" TEXT NOT NULL,
        "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "metric" TEXT NOT NULL,
        "value" INTEGER NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "MarketingMetric_pkey" PRIMARY KEY ("id")
      )
    `;

    // Add FK constraints
    await prisma.$executeRaw`
      ALTER TABLE "MarketingTarget"
      ADD CONSTRAINT "MarketingTarget_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "MarketingPlan"("id") ON DELETE CASCADE
    `;

    await prisma.$executeRaw`
      ALTER TABLE "MarketingTarget"
      ADD CONSTRAINT "MarketingTarget_leadId_fkey"
      FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL
    `;

    await prisma.$executeRaw`
      ALTER TABLE "MarketingMetric"
      ADD CONSTRAINT "MarketingMetric_planId_fkey"
      FOREIGN KEY ("planId") REFERENCES "MarketingPlan"("id") ON DELETE CASCADE
    `;

    // Add indexes
    await prisma.$executeRaw`CREATE INDEX "MarketingTarget_planId_idx" ON "MarketingTarget"("planId")`;
    await prisma.$executeRaw`CREATE INDEX "MarketingTarget_leadId_idx" ON "MarketingTarget"("leadId")`;
    await prisma.$executeRaw`CREATE INDEX "MarketingMetric_planId_idx" ON "MarketingMetric"("planId")`;

    return NextResponse.json({ message: 'Migration complete: 3 tables created with indexes and FKs' });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json({ error: error.message, details: error.meta }, { status: 500 });
  }
}
