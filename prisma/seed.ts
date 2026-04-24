// prisma/seed.ts - Seed ALBS Services (Updated March 2026)
import { PrismaClient, ServiceCategory } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding ALBS Services...')

  // Delete related records first, then services
  await prisma.leadService.deleteMany({})
  await prisma.service.deleteMany({})
  console.log('Cleared existing services and lead services')

  const services = [
    // AI Services
    {
      id: 'ai-tools-assessment',
      name: 'AI Tools Assessment',
      category: 'AI_SERVICES' as ServiceCategory,
      description: 'Comprehensive 45-minute discovery call to evaluate your current tech stack, followed by a custom AI readiness report with actionable recommendations and a 30-minute walkthrough session.',
      priceDisplay: '$999',
      basePrice: 99900,
      icon: '🤖',
      sortOrder: 1,
    },
    {
      id: 'process-redesign',
      name: 'Process Redesign',
      category: 'AI_SERVICES' as ServiceCategory,
      description: 'End-to-end workflow analysis: we map your current processes, identify bottlenecks and inefficiencies, design an optimized future state, and deliver an implementation roadmap.',
      priceDisplay: '$3,000-5,000',
      basePrice: 300000,
      icon: '📊',
      sortOrder: 2,
    },
    {
      id: 'automation-build',
      name: 'Automation Build',
      category: 'AI_SERVICES' as ServiceCategory,
      description: 'Custom Zapier/Make.com integrations connecting your existing tools — CRM, email, scheduling, invoicing — into seamless automated workflows that save hours weekly.',
      priceDisplay: '$1,000-3,000',
      basePrice: 100000,
      icon: '⚡',
      sortOrder: 3,
    },
    {
      id: 'knowledge-systems',
      name: 'Knowledge Systems',
      category: 'AI_SERVICES' as ServiceCategory,
      description: 'Custom-trained AI assistant built on your company\'s data — SOPs, policies, client FAQs — giving your team instant access to institutional knowledge 24/7.',
      priceDisplay: '$3,000+',
      basePrice: 300000,
      icon: '🧠',
      sortOrder: 4,
    },
    {
      id: 'custom-workflows',
      name: 'Custom Workflows',
      category: 'AI_SERVICES' as ServiceCategory,
      description: 'Tailored AI prompt libraries, templates, and workflow automations designed specifically for your industry and business processes.',
      priceDisplay: '$3,000-5,000',
      basePrice: 300000,
      icon: '🔧',
      sortOrder: 5,
    },
    {
      id: 'full-implementation',
      name: 'Full Implementation',
      category: 'AI_SERVICES' as ServiceCategory,
      description: 'Complete AI transformation: custom agents managing entire workflows from lead intake to client delivery, with ongoing optimization and support.',
      priceDisplay: '$5,000-10,000+',
      basePrice: 500000,
      icon: '🚀',
      sortOrder: 6,
    },
    // Tax & Business Services
    {
      id: '1040-individual',
      name: '1040 Tax Return (with Schedule C/E)',
      category: 'TAX_BUSINESS' as ServiceCategory,
      description: 'Individual tax return with Schedule C (self-employment) or Schedule E (rental income). Starting price covers standard 1040 with one schedule. Additional schedules may incur extra fees.',
      priceDisplay: '$695',
      basePrice: 59500,
      icon: '📄',
      sortOrder: 7,
    },
    {
      id: '1065-partnerships',
      name: '1065 Partnerships',
      category: 'TAX_BUSINESS' as ServiceCategory,
      description: 'Partnership tax return (Form 1065) including Schedule K-1 preparation, partnership agreement compliance, and multi-member allocation reporting.',
      priceDisplay: '$695',
      basePrice: 69500,
      icon: '🤝',
      sortOrder: 8,
    },
    {
      id: '1120-s-+-bookkeeping',
      name: '1120-S + Bookkeeping',
      category: 'TAX_BUSINESS' as ServiceCategory,
      description: 'Complete S-Corporation tax preparation (Form 1120-S) paired with year-round monthly bookkeeping, reconciliation, and financial reporting for small businesses.',
      priceDisplay: '$999',
      basePrice: 99900,
      icon: '📋',
      sortOrder: 9,
    },
    {
      id: '1120-(c-corporation)',
      name: '1120 (C-Corporation)',
      category: 'TAX_BUSINESS' as ServiceCategory,
      description: 'Full C-Corporation tax return filing (Form 1120) including all supporting schedules, K-1 preparation, estimated tax planning, and multi-state filing coordination.',
      priceDisplay: '$1,595',
      basePrice: 159500,
      icon: '🏢',
      sortOrder: 10,
    },
    {
      id: '1041-(trusts-&-estates)',
      name: '1041 (Trusts & Estates)',
      category: 'TAX_BUSINESS' as ServiceCategory,
      description: 'Trust and estate tax return filing (Form 1041) with complex trust accounting, beneficiary K-1 preparation, fiduciary income allocation, and estate distribution reporting.',
      priceDisplay: '$1,595',
      basePrice: 159500,
      icon: '🏛️',
      sortOrder: 11,
    },
    // PAYROLL SETUP (Keep existing - one-time setup fees)
    {
      id: 'payroll-setup-(1-5-employees)',
      name: 'Payroll Setup (1-5 Employees)',
      category: 'PAYROLL' as ServiceCategory,
      description: 'One-time setup: complete payroll system configuration for 1-5 employees/contractors including direct deposit, tax withholding, W-4/I-9 processing.',
      priceDisplay: '$999',
      basePrice: 99900,
      icon: '👥',
      sortOrder: 10,
    },
    {
      id: 'payroll-setup-(6-19-employees)',
      name: 'Payroll Setup (6-19 Employees)',
      category: 'PAYROLL' as ServiceCategory,
      description: 'One-time setup: full payroll implementation for 6-19 employees/contractors with multi-state tax compliance, benefits deductions, and dedicated support.',
      priceDisplay: '$1,595',
      basePrice: 159500,
      icon: '👥👥',
      sortOrder: 11,
    },
    {
      id: 'payroll-setup-(20+-employees)',
      name: 'Payroll Setup (20+ Employees)',
      category: 'PAYROLL' as ServiceCategory,
      description: 'One-time setup: enterprise payroll onboarding for 20+ employees with department reporting, custom pay schedules, and compliance auditing.',
      priceDisplay: '$2,095',
      basePrice: 209500,
      icon: '🏢👥',
      sortOrder: 12,
    },
    // TASK 1: PAYROLL & BOOKKEEPING (NEW - Monthly bundles)
    {
      id: 'payroll-bookkeeping-1-5',
      name: 'Payroll & Bookkeeping (1-5 Employees)',
      category: 'PAYROLL_BOOKKEEPING' as ServiceCategory,
      description: '⭐ RECOMMENDED - Monthly service: Up to 400 transactions, covers contractors + employees + full bookkeeping. Includes monthly reconciliation, financial reports, payroll processing.',
      priceDisplay: '$695/mo',
      basePrice: 69500,
      icon: '⭐',
      sortOrder: 13,
      isActive: true,
    },
    {
      id: 'payroll-bookkeeping-6-19',
      name: 'Payroll & Bookkeeping (6-19 Employees)',
      category: 'PAYROLL_BOOKKEEPING' as ServiceCategory,
      description: 'Monthly service: Any transaction volume, covers contractors + employees + full bookkeeping. Includes monthly reconciliation, financial reports, payroll processing, priority support.',
      priceDisplay: '$895/mo',
      basePrice: 89500,
      icon: '💼',
      sortOrder: 14,
      isActive: true,
    },
    {
      id: 'payroll-bookkeeping-20-plus',
      name: 'Payroll & Bookkeeping (20+ Employees)',
      category: 'PAYROLL_BOOKKEEPING' as ServiceCategory,
      description: 'Enterprise monthly service: Unlimited transactions, full bookkeeping + payroll + dedicated account manager. Includes custom reporting, multi-entity support, strategic financial planning.',
      priceDisplay: '$1,095/mo',
      basePrice: 109500,
      icon: '🏢',
      sortOrder: 15,
      isActive: true,
    },
    {
      id: 'standalone-bookkeeping',
      name: 'Standalone Bookkeeping',
      category: 'BOOKKEEPING' as ServiceCategory,
      description: 'Monthly bookkeeping only (no payroll). $495 setup fee + $125/hour with timecard tracking. Includes monthly reconciliation, P&L, balance sheet, financial reports.',
      priceDisplay: '$495 + $125/hr',
      basePrice: 49500,
      icon: '📒',
      sortOrder: 16,
      isActive: true,
    },
    // TASK 2: MARKETING (NEW Category)
    {
      id: 'seo-optimization',
      name: 'SEO Optimization',
      category: 'MARKETING' as ServiceCategory,
      description: 'Search engine optimization to improve your website visibility and organic traffic. Includes keyword research, on-page optimization, technical SEO audit.',
      priceDisplay: 'Contact for pricing',
      basePrice: 0,
      icon: '🔍',
      sortOrder: 17,
      isActive: true,
    },
    {
      id: 'website-redesign',
      name: 'Website Redesign',
      category: 'MARKETING' as ServiceCategory,
      description: 'Complete website redesign with modern UI/UX. Includes mobile-responsive design, CMS integration, SEO-friendly structure, and analytics setup.',
      priceDisplay: 'Contact for pricing',
      basePrice: 0,
      icon: '🎨',
      sortOrder: 18,
      isActive: true,
    },
    {
      id: 'website-deployment',
      name: 'Website Deployment',
      category: 'MARKETING' as ServiceCategory,
      description: 'Professional website deployment and hosting setup. Includes domain configuration, SSL certificate, performance optimization, and ongoing maintenance.',
      priceDisplay: 'Contact for pricing',
      basePrice: 0,
      icon: '🌐',
      sortOrder: 19,
      isActive: true,
    },
    {
      id: 'landing-pages',
      name: 'Landing Pages',
      category: 'MARKETING' as ServiceCategory,
      description: 'High-converting landing page design and development. A/B testing optimized, lead capture forms, integration with your CRM and email marketing.',
      priceDisplay: 'Contact for pricing',
      basePrice: 0,
      icon: '🎯',
      sortOrder: 20,
      isActive: true,
    },
    {
      id: 'marketing-campaigns',
      name: 'Marketing Campaigns',
      category: 'MARKETING' as ServiceCategory,
      description: 'Full-service digital marketing campaigns. Strategy, creative development, ad spend management, and performance reporting across Google, Facebook, LinkedIn.',
      priceDisplay: 'Contact for pricing',
      basePrice: 0,
      icon: '📢',
      sortOrder: 21,
      isActive: true,
    },
    {
      id: 'lead-generation',
      name: 'Lead Generation',
      category: 'MARKETING' as ServiceCategory,
      description: 'Inbound lead generation system. Content marketing, email sequences, lead magnets, CRM integration, and lead scoring to maximize conversion.',
      priceDisplay: 'Contact for pricing',
      basePrice: 0,
      icon: '🎣',
      sortOrder: 22,
      isActive: true,
    },
    // CONSULTING SERVICES (NEW - March 2026)
    {
      id: 'consulting-30min',
      name: '30-Minute Consultation',
      category: 'CONSULTING' as ServiceCategory,
      description: 'Free 30-minute discovery call to discuss your business needs and explore how ALBS can help. No obligation, no pressure — just a conversation.',
      priceDisplay: 'FREE',
      basePrice: 0,
      icon: '💬',
      sortOrder: 27,
      isActive: true,
    },
    {
      id: 'consulting-hourly',
      name: 'Consulting (Hourly)',
      category: 'CONSULTING' as ServiceCategory,
      description: 'One-on-one consulting sessions at $125/hour. General business consulting, process improvement, automation strategy, and technical guidance tailored to your needs.',
      priceDisplay: '$125/hr',
      basePrice: 12500,
      icon: '⏱️',
      sortOrder: 28,
      isActive: true,
    },
    // INSURANCE SERVICES (NEW - March 2026)
    {
      id: 'u65-health-enrollment',
      name: 'Under 65 Health Insurance',
      category: 'INSURANCE' as ServiceCategory,
      description: 'FREE - Marketplace health insurance enrollment for individuals and families under 65. We assist with plan selection, enrollment, and ongoing support at no cost (commissions paid by carriers).',
      priceDisplay: 'FREE',
      basePrice: 0,
      icon: '🏥',
      sortOrder: 23,
      isActive: true,
    },
    {
      id: 'medicare-enrollment',
      name: 'Medicare Enrollment',
      category: 'INSURANCE' as ServiceCategory,
      description: 'FREE - Medicare Part A, B, C (Advantage), and D enrollment assistance. We help navigate initial enrollment, SEP opportunities, and annual election periods at no cost (commissions paid by carriers).',
      priceDisplay: 'FREE',
      basePrice: 0,
      icon: '👵',
      sortOrder: 24,
      isActive: true,
    },
    {
      id: 'insurance-appeal',
      name: 'Insurance Appeal / Grievance',
      category: 'INSURANCE' as ServiceCategory,
      description: '$125/hour - Representation and advocacy for insurance denials, coverage disputes, and appeals. Includes document review, strategy development, and appeal letter preparation.',
      priceDisplay: '$125/hr',
      basePrice: 12500,
      icon: '⚖️',
      sortOrder: 25,
      isActive: true,
    },
    {
      id: 'employer-benefits-consultation',
      name: 'Employer Benefits Consultation',
      category: 'INSURANCE' as ServiceCategory,
      description: '$500 booking fee - Strategic consultation for employers on designing and implementing employee benefits packages. Includes health, dental, vision, life, and 401(k) planning.',
      priceDisplay: '$500',
      basePrice: 50000,
      icon: '💼',
      sortOrder: 26,
      isActive: true,
    },
  ]

  for (const service of services) {
    try {
      await prisma.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
    } catch (e) {
      console.log(`Error creating service ${service.id}:`, e);
    }
  }

  console.log(`✅ Seeded ${services.length} services (including 4 new Insurance services)`)

  // AIIO Services
  const AIIO_SERVICES = [
    {
      id: 'aiio-assessment',
      name: 'Technical Infrastructure Assessment',
      category: 'AIIO' as ServiceCategory,
      description: 'A 2-week diagnostic that maps your current tech stack, identifies automation opportunities, and delivers a full AI implementation roadmap. $2,500 credited toward any implementation.',
      priceDisplay: '$2,500',
      basePrice: 250000,
      icon: '🔍',
      sortOrder: 40,
      isActive: true,
    },
    {
      id: 'aiio-foundation',
      name: 'Foundation Implementation',
      category: 'AIIO' as ServiceCategory,
      description: 'Full AI operating system build: document processing, workflow automation, CRM/PM integration, team training. 8-week delivery plus 3-month support. Credited $2,500 from assessment.',
      priceDisplay: '$25,000–40,000',
      basePrice: 2500000,
      icon: '🏗️',
      sortOrder: 41,
      isActive: true,
    },
    {
      id: 'aiio-growth',
      name: 'Growth Implementation',
      category: 'AIIO' as ServiceCategory,
      description: 'Foundation plus 2–3 custom AI agents, advanced analytics, and industry-specific optimization. 8-week delivery plus 6-month support.',
      priceDisplay: '$40,000–70,000',
      basePrice: 4000000,
      icon: '📈',
      sortOrder: 42,
      isActive: true,
    },
    {
      id: 'aiio-enterprise',
      name: 'Enterprise Implementation',
      category: 'AIIO' as ServiceCategory,
      description: 'Growth tier plus 5+ custom AI agents, executive dashboards, enterprise security, and org change management. 8-week delivery plus 12-month support.',
      priceDisplay: '$70,000+',
      basePrice: 7000000,
      icon: '🏢',
      sortOrder: 43,
      isActive: true,
    },
    {
      id: 'aiio-essential-monthly',
      name: 'Essential Monthly Management',
      category: 'AIIO_MONTHLY' as ServiceCategory,
      description: 'Month-to-month performance review, AI system optimization, 2hr/month training, and priority support. For Foundation tier clients.',
      priceDisplay: '$3,500/mo',
      basePrice: 350000,
      icon: '⚙️',
      sortOrder: 44,
      isActive: true,
    },
    {
      id: 'aiio-growth-monthly',
      name: 'Growth Monthly Management',
      category: 'AIIO_MONTHLY' as ServiceCategory,
      description: 'Essential plus bi-weekly optimization, up to 8hr/month custom development, and advanced analytics reporting. For Growth tier clients.',
      priceDisplay: '$6,000/mo',
      basePrice: 600000,
      icon: '🚀',
      sortOrder: 45,
      isActive: true,
    },
    {
      id: 'aiio-enterprise-monthly',
      name: 'Enterprise Monthly Management',
      category: 'AIIO_MONTHLY' as ServiceCategory,
      description: 'Growth plus dedicated account manager, 16+hr/month custom development, weekly strategy sessions, and executive reporting. For Enterprise tier clients.',
      priceDisplay: '$10,000+/mo',
      basePrice: 1000000,
      icon: '🎯',
      sortOrder: 46,
      isActive: true,
    },
  ]

  for (const service of AIIO_SERVICES) {
    try {
      await prisma.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
    } catch (e) {
      console.log(`Error creating AIIO service ${service.id}:`, e);
    }
  }
  console.log(`✅ Seeded ${AIIO_SERVICES.length} AIIO services`)

  // AI Chatbot Services
  const CHATBOT_SERVICES = [
    {
      id: 'chatbot-restaurant-salon',
      name: 'AI Chatbot — Restaurants & Salons',
      category: 'AI_CHATBOT' as ServiceCategory,
      description: `24/7 AI chatbot for restaurants, salons, and retail businesses.

WHAT'S INCLUDED IN SETUP:
• Full conversation flow design (hours, menu, reservations, pricing, dietary questions, cancellation policy)
• Booking integration with your scheduling system (Calendly, Acuity, or Google Calendar) — or we'll build one from scratch for you (add-on)
• After-hours auto-response with next-day follow-up
• Brand voice customization (tone, greetings, response style)
• Deployment on up to 2 platforms (website + Facebook or Instagram)
• Testing and quality assurance across all flows
• Staff training walkthrough (30 min)

WHAT'S INCLUDED MONTHLY:
• Unlimited automated conversations (no per-message fees)
• Conversation flow updates (up to 2 revisions/month)
• Monthly performance report (conversations handled, bookings captured, response rates)
• Platform monitoring and uptime management
• Bug fixes and technical support
• Response time: 48 hours for revisions and updates (critical issues same business day)

NOT INCLUDED (client responsibility or add-on):
• Third-party platform costs (website hosting, Facebook/Instagram ad spend)
• SMS/text messaging add-on: $25/mo
• Custom booking system build (available as add-on)
• Menu or service changes — submit via monthly revision request
• Content creation for social media posts
• White-label branding: client-branded available for additional fee

CONTRACT:
90-day minimum commitment

PLATFORMS SUPPORTED:
Website widget (Tidio or Intercom), Facebook Messenger, Instagram DM

IDEAL FOR:
Restaurants, salons, barbershops, nail studios, retail shops, cafes, food trucks — any local business that gets the same 60 questions every week.`,
      priceDisplay: '$600 setup + $200/mo',
      basePrice: 60000,
      icon: '🍽️',
      sortOrder: 50,
      isActive: true,
    },
    {
      id: 'chatbot-medical-dental',
      name: 'AI Chatbot — Medical & Dental',
      category: 'AI_CHATBOT' as ServiceCategory,
      description: `HIPAA-aware AI chatbot for medical and dental practices.

WHAT'S INCLUDED IN SETUP:
• Full conversation flow design (new patient intake, appointment booking, insurance FAQ, prescription refill requests, after-hours triage, staff routing)
• HIPAA-aware phrasing and privacy-compliant language throughout all flows
• Appointment booking integration with your practice management system (Dentrix, Open Dental, Eaglesoft, Calendly, or custom — we can build from scratch as add-on)
• Automated appointment reminder sequence (24hr + 2hr before appointment)
• After-hours emergency triage flow with escalation to on-call staff
• New patient intake form collection (insurance, medical history, demographics)
• Deployment on up to 3 platforms (website + Facebook + Google Business)
• Testing and quality assurance across all flows
• Staff training walkthrough (30 min)

WHAT'S INCLUDED MONTHLY:
• Unlimited automated conversations (no per-message fees)
• Conversation flow updates (up to 3 revisions/month)
• Monthly performance report (appointments booked, no-show rate before/after, after-hours capture rate)
• Appointment reminder monitoring and delivery confirmation
• Platform monitoring and uptime management
• Bug fixes and technical support
• No-show rate tracking and optimization recommendations
• Response time: 48 hours for revisions and updates (critical issues same business day)

NOT INCLUDED (client responsibility or add-on):
• Third-party platform costs (practice management software, website hosting)
• SMS/text messaging add-on: $50/mo (includes SMS + appointment reminder channel)
• Custom booking system build (available as add-on)
• Insurance verification or claims processing
• Medical advice or diagnosis (bot explicitly redirects to provider)
• Compliance audit or legal review of bot responses
• White-label branding: client-branded available for additional fee

CONTRACT:
90-day minimum commitment

PLATFORMS SUPPORTED:
Website widget, Facebook Messenger, Instagram DM, Google Business Messages

ROI CONTEXT:
Average dental practice loses $105,000/year to no-shows (15-30% no-show rate). At $400/month, this service pays for itself with just 2-3 recovered appointments per month.`,
      priceDisplay: '$1,700 setup + $400/mo',
      basePrice: 170000,
      icon: '🦷',
      sortOrder: 51,
      isActive: true,
    },
    {
      id: 'chatbot-real-estate',
      name: 'AI Chatbot — Real Estate',
      category: 'AI_CHATBOT' as ServiceCategory,
      description: `AI chatbot for real estate agents and brokerages.

WHAT'S INCLUDED IN SETUP:
• Full conversation flow design (buyer/seller qualification, showing scheduling, property inquiry, neighborhood info, mortgage FAQ, CRM lead capture)
• Proactive lead qualification — bot asks first question immediately, never waits for user to lead
• Lead scoring and routing (hot leads flagged for immediate callback)
• Showing scheduling integration with your calendar (Google Calendar, Calendly, or custom — we can build from scratch as add-on)
• CRM integration via Zapier (HubSpot, Follow Up Boss, LionDesk, KVCore, or custom)
• After-hours lead capture with next-day callback scheduling
• Deployment on up to 3 platforms (website + Facebook + Zillow/Realtor.com where supported)
• Testing and quality assurance across all flows
• Agent training walkthrough (30 min)

WHAT'S INCLUDED MONTHLY:
• Unlimited automated conversations (no per-message fees)
• Conversation flow updates (up to 3 revisions/month)
• Monthly performance report (leads captured, qualification rates, showing conversions, callback rates)
• Lead quality monitoring and flow optimization
• CRM sync monitoring and error handling
• Platform monitoring and uptime management
• Bug fixes and technical support
• Response time: 48 hours for revisions and updates (critical issues same business day)

NOT INCLUDED (client responsibility or add-on):
• Third-party platform costs (CRM subscription, website hosting, Zillow/Realtor.com fees)
• SMS/text messaging add-on: $35/mo
• Custom booking system build (available as add-on)
• MLS listing data feeds (available as add-on)
• Property photography, virtual tours, or listing content
• Direct response on behalf of the agent (bot qualifies, agent closes)
• White-label branding: client-branded available for additional fee

CONTRACT:
90-day minimum commitment

PLATFORMS SUPPORTED:
Website widget, Facebook Messenger, Instagram DM
CRM INTEGRATIONS: HubSpot, Follow Up Boss, LionDesk, KVCore (via Zapier)

ROI CONTEXT:
One closed deal = $5,000-$20,000 in commission. The bot captures 8-25 leads/month depending on traffic. One closed lead pays for 2+ years of service.`,
      priceDisplay: '$1,200 setup + $320/mo',
      basePrice: 120000,
      icon: '🏠',
      sortOrder: 52,
      isActive: true,
    },
    {
      id: 'chatbot-custom',
      name: 'AI Chatbot — Custom Business',
      category: 'AI_CHATBOT' as ServiceCategory,
      description: `Custom AI chatbot built for your industry and business type.

WHAT'S INCLUDED IN SETUP:
• Discovery call to map your specific FAQ, booking flow, lead qualification, and customer service needs
• Full conversation flow design tailored to your business and brand voice
• Booking/scheduling integration with your existing systems (or we'll build one from scratch as an add-on)
• After-hours auto-response with next-day follow-up
• Deployment on up to 2 platforms (website + social media)
• Testing and quality assurance across all flows
• Staff training walkthrough (30 min)

WHAT'S INCLUDED MONTHLY:
• Unlimited automated conversations (no per-message fees)
• Conversation flow updates (up to 2 revisions/month)
• Monthly performance report
• Platform monitoring and uptime management
• Bug fixes and technical support
• Response time: 48 hours for revisions and updates (critical issues same business day)

NOT INCLUDED (client responsibility or add-on):
• Third-party platform costs (website hosting, social media ad spend)
• SMS/text messaging add-on: pricing varies by volume
• Custom booking system build (available as add-on)
• Industry-specific compliance review (legal, financial, medical — available as add-on)
• Content creation for marketing materials
• White-label branding: client-branded available for additional fee

CONTRACT:
90-day minimum commitment

PLATFORMS SUPPORTED:
Website widget (Tidio, Intercom, or custom), Facebook Messenger, Instagram DM, WhatsApp (add-on)

PRICING:
Setup fee varies by complexity ($600-$3,000). Monthly retainer starts at $200/mo. Contact us for a custom quote based on your industry, number of platforms, and integration requirements.

PERFECT FOR:
Legal practices, accounting firms, HVAC/plumbing/electrical, auto dealerships, fitness studios, veterinary clinics, property management, and any business that answers the same questions repeatedly.`,
      priceDisplay: 'Contact for pricing',
      basePrice: 0,
      icon: '💬',
      sortOrder: 53,
      isActive: true,
    },
  ]

  for (const service of CHATBOT_SERVICES) {
    try {
      await prisma.service.upsert({
        where: { id: service.id },
        update: service,
        create: service,
      });
    } catch (e) {
      console.log(`Error creating chatbot service ${service.id}:`, e)
    }
  }
  console.log(`✅ Seeded ${CHATBOT_SERVICES.length} AI Chatbot services`)

  // Client Tiers
  const CLIENT_TIERS = [
    { id: 'TIER_A', name: 'Tier A - Enterprise', description: 'Full-service client with dedicated account manager, priority support, and custom solutions.' },
    { id: 'TIER_B', name: 'Tier B - Growth', description: 'Active client with standard support and quarterly reviews.' },
    { id: 'TIER_C', name: 'Tier C - Starter', description: 'Entry-level client with self-service and basic support.' },
  ]

  console.log(`✅ Client tiers defined: ${CLIENT_TIERS.map(t => t.id).join(', ')}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
