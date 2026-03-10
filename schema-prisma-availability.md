// prisma/schema.prisma - Add to existing schema

model Lead {
  id          String   @id @default(cuid())
  token       String   @unique // The unique URL slug
  email       String?  @unique
  firstName   String?
  lastName    String?
  phone       String?
  linkedinUrl String?  @unique

  // Enriched Work History
  positions Position[]

  // Availability (NEW)
  availability Availability?

  // Status tracking
  isOnboarded Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model Position {
  id          String  @id @default(cuid())
  leadId      String
  lead        Lead    @relation(fields: [leadId], references: [id])
  companyName String
  companyLogo String? // URL to the logo provided by the API
  title       String
  startDate   String? // e.g., "Jan 2020"
  endDate     String? // e.g., "Present"
  isCurrent   Boolean @default(false)
}

// Availability Model (NEW)
model Availability {
  id               String  @id @default(cuid())
  leadId           String  @unique
  lead             Lead    @relation(fields: [leadId], references: [id])

  // Days available
  monday    Boolean @default(false)
  tuesday   Boolean @default(false)
  wednesday Boolean @default(false)
  thursday  Boolean @default(false)
  friday    Boolean @default(false)
  saturday  Boolean @default(false)
  sunday    Boolean @default(false)

  // Time preferences
  morning   Boolean @default(true)   // 8am - 12pm
  afternoon Boolean @default(true)   // 12pm - 5pm
  evening   Boolean @default(false)  // 5pm - 8pm

  // Additional options
  timezone       String  @default("America/New_York")
  isImmediatelyAvailable Boolean @default(false)
  noticePeriod   String? // e.g., "2 weeks", "1 month"
  
  // Preferred contact method
  contactMethod  String  @default("email") // email, phone, linkedin
}
