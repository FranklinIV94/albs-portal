---
created: 2026-03-28
updated: 2026-03-28
status: 📋 In Progress
project: ALBS Client Portal
priority: Critical / High / Medium / Low
source: Franklin J Bryant IV — Portal Review Notes
---

# ALBS Client Portal — Product Requirements & Improvement Roadmap

> [!abstract] Document Purpose
> This document captures the full assessment of the ALBS Client Portal following a thorough review of all sections: dashboard, all 8 client tabs, service catalog, lead creation flows, invoicing, analytics, and filter views.
> Last updated: March 28, 2026

---

## CRITICAL BUGS — Fix Immediately

### BUG 1: Invoice Filtering Broken 🔴 ~~CRITICAL~~ → ✅ FIXED (Mar 28, 2026)
**Issue:** When opening Matt Cosci's Billing tab, it displayed Renee Bryant's invoices. Invoices appeared to show globally or from the last-viewed client — not scoped to the individual client record.

**Root cause:** Tab switch to Billing (v === 5) called `fetchSubscriptions()` but never called `fetchInvoices()`.

**Fix:** Added `fetchInvoices(selectedLead.id)` in the tab change handler. Now invoices are fetched alongside subscriptions when opening the Billing tab.

**File changed:** `app/admin/page.tsx`

---

### BUG 2: Analytics "Invalid Date" on All Payouts 🔴 ~~CRITICAL~~ → ✅ FIXED (Mar 28, 2026)
**Issue:** Every entry in the Recent Payouts table showed "Invalid Date" in the Date column.

**Root cause:** API converted Stripe Unix timestamps to ISO strings, then frontend tried to multiply by 1000 again → NaN.

**Fix:** API now returns raw Unix timestamps. Frontend handles `new Date(p.created * 1000)` correctly.

**File changed:** `app/api/admin/analytics/route.ts`

---

### BUG 3: Total Revenue Shows $0 Despite Existing Invoices 🔴 ~~CRITICAL~~ → ✅ FIXED (Mar 28, 2026)
**Issue:** Total Revenue and Avg per Client both read $0, even though invoices existed and payouts were visible.

**Root cause (two issues):**
1. Analytics only summed `Payment` table records — invoice payments weren't creating corresponding `Payment` records
2. Analytics didn't include `Invoice` records that were marked PAID but had no Payment record

**Fix (two parts):**
1. `checkout/route.ts` now creates a `Payment` record (status=PENDING) when a Stripe checkout session is created for an invoice
2. `analytics/route.ts` now queries both `Payment` and `Invoice` tables and combines PAID records for revenue calculation

**Files changed:**
- `app/api/invoices/checkout/route.ts`
- `app/api/admin/analytics/route.ts`

---

## HIGH PRIORITY — Next Sprint

### IMPROVEMENT 1: Search/Filter Bar on Leads Table
**Issue:** With 15+ clients and growing, there's no way to search by name, email, company, or status.

**Fix:** Add a search input above the leads table plus clickable column header sorting. Also consider a status dropdown filter.

---

### IMPROVEMENT 2: Clickable Status Cards as Filters
**Issue:** The six status cards (New, Onboarding, Contract, Payment, Active, Work in Progress, Complete) display counts but don't filter the leads table.

**Fix:** Make clicking "4 NEW" filter the table to show only New leads — same behavior as tab filters.

---

### IMPROVEMENT 3: "Last Activity" Column on Leads Table
**Issue:** Only "Created" date is visible. No visibility into when you last interacted with a client.

**Fix:** Add a "Last Activity" column showing the most recent of: last chat message, last task update, last note added, last status change. Helps identify clients who need attention.

---

### IMPROVEMENT 4: Editable Info Tab Fields
**Issue:** Contact info (email, company, title, phone) is display-only.

**Fix:** Make all Info tab fields inline-editable. Add new fields:
- Address/location
- Website
- Referral source (how did they find you?)
- Tag/label system for categorizing clients
- Assigned team member

---

### IMPROVEMENT 5: Invoice Status Lifecycle
**Issue:** Invoices only show "SENT" or "DRAFT" — no full lifecycle tracking.

**Fix:** Implement full invoice lifecycle:
- **Draft** → **Sent** → **Viewed** → **Paid** | **Overdue**
- Auto-mark overdue when past `dueDate`
- Visual indicators (red highlighting) for overdue invoices

---

### IMPROVEMENT 6: Revenue by Client Analytics View
**Issue:** Analytics only show aggregate totals and recent payouts. No per-client breakdowns.

**Fix:** Add to Analytics:
- Revenue by client (per-client breakdown table)
- Monthly revenue trending (chart)
- Revenue by service category
- Outstanding/overdue invoice totals as a KPI card

---

## MEDIUM PRIORITY — Next Phase

### IMPROVEMENT 7: Documents/Files Tab
**Issue:** No dedicated place to view, manage, or track uploaded documents.

**Fix:** Create a Documents tab showing:
- All document requests sent (with status: pending, received, reviewed)
- Uploaded files from client
- Files shared with client (contracts, deliverables, reports)
- Ability to upload files directly (not just request)

---

### IMPROVEMENT 8: Enhanced Tasks Tab
**Issue:** Tasks only have title, optional description, and priority. Missing critical fields.

**Fix:** Expand task model:
- Due dates
- Assignee (you, team member, or client)
- Status tracking (Not Started → In Progress → Blocked → Complete)
- Relationship to specific service / Custom Workflows engagement
- Subtasks/checklists for multi-step work

---

### IMPROVEMENT 9: Enhanced Notes Tab
**Issue:** Internal notes are a single plain-text field with no categorization.

**Fix:** Upgrade notes:
- Note categories/tags (call notes, meeting notes, research, action items)
- Timestamps and author attribution
- Pin important notes to top
- Rich text or markdown support

---

### IMPROVEMENT 10: Client Requests Tab — Admin-Side Initiation
**Issue:** Tab only shows client-submitted requests. No way for admin to create requests.

**Fix:** Allow admin to create requests on behalf of clients. Add status workflow: **Open → In Review → Completed** with response tracking.

---

### IMPROVEMENT 11: Bulk Actions on Leads Table
**Issue:** Cannot select multiple clients for batch operations.

**Fix:** Add checkboxes on each row plus bulk action toolbar enabling:
- Change status (batch)
- Send group message
- Export selected to CSV

---

### IMPROVEMENT 12: Chat Tab Enhancements
**Issue:** Chat is bare text-only messenger.

**Fix:** Add:
- File/image attachment support
- Message read receipts / delivery status
- Canned/template responses for common messages
- @mention or tag messages as action items
- Email notification indicators

---

### IMPROVEMENT 13: Recurring Invoices / Subscription Billing
**Issue:** Billing tab has empty Subscriptions section. Monthly services (Payroll & Bookkeeping at $695-$1,095/month) need recurring billing.

**Fix:** Add recurring billing setup:
- Configure auto-generated invoices on schedule (monthly/yearly)
- Stripe subscription integration for automated charging
- Subscription status tracking (Active, Cancelled, Past Due)

---

### IMPROVEMENT 14: Partial Payment Tracking
**Issue:** No way to record partial payments or track payment history on invoices.

**Fix:** For large engagements (Full Implementation at $5,000-$10,000+):
- Record partial payments against invoice
- Payment history log per invoice
- Show balance remaining

---

## LOW PRIORITY — Future Versions

### IMPROVEMENT 15: Client Activity Timeline / Log
**Issue:** No unified view of everything that happened with a client.

**Fix:** Add an activity feed per client aggregating in chronological order:
- Status changes
- Messages sent/received
- Invoices created
- Documents requested
- Notes added
- Tasks completed

---

### IMPROVEMENT 16: Proposal Workflow — Preview and Tracking
**Issue:** "Create Proposal" button exists but no way to track sent proposals, view status, or see acceptance.

**Fix:** Build a Proposals section showing:
- Proposal history per client
- Status: Draft → Sent → Viewed → Accepted / Declined
- Ability to revise and resend

---

### IMPROVEMENT 17: Contract / E-Signature Integration
**Issue:** Onboarding has "Contract Signing" step but no visible contract management.

**Fix:** Add:
- Generate contracts from selected services
- Send for electronic signature
- Track signing status
- All tied back to client record

---

### IMPROVEMENT 18: Configurable Onboarding Templates Per Service
**Issue:** 7-step onboarding flow appears identical for every client. Tax client vs. AI implementation client have very different needs.

**Fix:** Build onboarding templates per service category:
- Different step sequences per service type
- Template selection at lead creation
- Per-service SLA milestones

---

### IMPROVEMENT 19: Time-Based Automation Triggers
**Issue:** No automation visible.

**Fix:** Add automation rules:
- Auto-send reminder emails when client stuck on onboarding step for X days
- Auto-move "New" to "Stale Lead" after inactivity threshold
- Auto-generate invoice when onboarding reaches Payment step
- Auto-notify when task is due or overdue

---

### IMPROVEMENT 20: Role-Based Access / Team Support
**Issue:** Portal appears single-user.

**Fix:** Add team member accounts with permission levels:
- Admin (full access)
- Staff (assigned clients, limited data)
- Read-only (view-only access)
- Assign clients/tasks to specific team members

---

### IMPROVEMENT 21: Email / Notification Log Per Client
**Issue:** Emails are triggered (document requests, invoices, payment links) but no log of what was sent and when.

**Fix:** Add notification history per client:
- All emails/messages sent with timestamps
- Delivery status
- Prevents duplicate sends
- Verification of delivery

---

### IMPROVEMENT 22: Client-Facing Portal Dashboard
**Issue:** Client portal requires navigation through separate sections.

**Fix:** Single-page client dashboard showing:
- Onboarding progress
- Outstanding tasks/requests
- Pending invoices with payment links
- Uploaded documents
- Recent messages

---

### IMPROVEMENT 23: Data Export Capability
**Issue:** No way to export client data, invoices, or analytics.

**Fix:** Add export options:
- CSV/Excel export for leads, invoices, tasks
- PDF export for client records, invoices, contracts
- Analytics report generation

---

## Recommended Sprint Order

| Sprint | Items | Focus |
|--------|-------|-------|
| **Sprint 1** | BUG 1, BUG 2, BUG 3, IMPROVEMENT 1, IMPROVEMENT 2 | Critical bugs + search/filter |
| **Sprint 2** | IMPROVEMENT 4, IMPROVEMENT 5, IMPROVEMENT 6, IMPROVEMENT 11 | Info tab + billing |
| **Sprint 3** | IMPROVEMENT 7, IMPROVEMENT 8, IMPROVEMENT 9, IMPROVEMENT 10 | Client record depth |
| **Sprint 4** | IMPROVEMENT 12, IMPROVEMENT 13, IMPROVEMENT 14 | Billing + chat |
| **Sprint 5** | IMPROVEMENT 15, IMPROVEMENT 16, IMPROVEMENT 17 | Client timeline + proposals |
| **Sprint 6** | IMPROVEMENT 18, IMPROVEMENT 19 | Onboarding + automation |
| **Sprint 7** | IMPROVEMENT 20, IMPROVEMENT 21, IMPROVEMENT 22, IMPROVEMENT 23 | Team + export |

---

## Notes

- This assessment was performed on March 28, 2026 by Franklin J Bryant IV
- Three critical bugs affect daily usability and data integrity — prioritize in Sprint 1
- Portal location: `albs-portal/` in workspace
- Production URL: https://onboarding.simplifyingbusinesses.com

---

## AI Chatbot Services — Added April 23, 2026

New service category (AI_CHATBOT) added to portal with 4 tiers:

| Service | Setup Fee | Monthly | Icon | ID |
|---------|-----------|---------|------|----|
| Restaurants & Salons | $600 | $200/mo | 🍽️ | chatbot-restaurant-salon |
| Medical & Dental | $1,700 | $400/mo | 🦷 | chatbot-medical-dental |
| Real Estate | $1,200 | $320/mo | 🏠 | chatbot-real-estate |
| Custom Business | Contact | Varies | 💬 | chatbot-custom |

- Schema: Added AI_CHATBOT to ServiceCategory enum
- Seed: Added 4 services to prisma/seed.ts
- Frontend: Added category label to onboarding + admin pages
- Source: @anatolikopadze article on AI chatbot pricing for local businesses
- Pricing model: Setup fee + monthly retainer (matches industry standard)
- Key differentiator: ALBS bundles chatbot with full back-office services (tax, bookkeeping, payroll)
