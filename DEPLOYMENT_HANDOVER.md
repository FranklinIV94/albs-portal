# ALBS Onboarding Portal - Deployment Handoff

## Overview
A lead enrichment and onboarding portal that:
1. Takes a LinkedIn URL or email → enriches via Apollo.io API
2. Generates a unique onboarding link
3. Sends email to lead with their pre-filled work history
4. Lead completes availability form → saved to database

**Live URL Goal:** `simplifyingbusinesses.com/onboarding/[token]`

---

## Project Location
`/home/franklin-bryant/.openclaw/workspace/albs-portal/`

---

## Files Created

### Database Schema
- **`prisma/schema.prisma`** - Complete schema with Lead, Position, Availability models

### API Routes
- **`app/api/enrich/route.ts`** - POST (enrich lead) / GET (fetch by token)
- **`app/api/availability/route.ts`** - POST/GET availability

### Frontend
- **`app/admin/page.tsx`** - Dashboard to add LinkedIn URLs & copy onboard links
- **`app/onboard/[token]/page.tsx`** - Multi-step onboarding flow
- **`components/AvailabilityForm.tsx`** - Day/time picker form

### Utilities
- **`lib/enrichment.ts`** - Apollo.io API wrapper
- **`lib/email.ts`** - Resend email templates (onboarding + confirmation)

### Config
- **`.env`** - Local env with API keys
- **`.env.example`** - Template for team

---

## Environment Variables Required

Add these in **Vercel Dashboard → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `APOLLO_API_KEY` | `EoF8r9_QnIGETsvfhPczgw` |
| `RESEND_API_KEY` | `re_FPbAV8xv_14RZhkQKgnnQDDhrZSim7T3f` |
| `DATABASE_URL` | (Supabase Postgres connection string) |
| `NEXTAUTH_SECRET` | (generate: `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `https://simplifyingbusinesses.com` |

---

## Deployment Steps

### 1. Set up Supabase
```bash
# Create project at supabase.com
# Get connection string from Settings → Database → Connection string
# Format: postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### 2. Push Database Schema
```bash
cd albs-portal
npx prisma db push
```

### 3. Configure Vercel
- Import project to Vercel
- Add all environment variables above
- Deploy

### 4. Route Configuration (Key Decision Needed)

**Option A:** Deploy as separate project → `onboard.simplifyingbusinesses.com`
- Simplest setup
- No route conflicts with existing intake form

**Option B:** Add to existing Vercel project
- Need to merge routes
- Ensure `/intake` still works while adding `/onboarding`

**Recommendation:** Option A for now — faster to ship, can merge later.

---

## Workflow

1. **Admin** goes to `/admin`
2. Pastes LinkedIn URL → clicks "Enrich"
3. Apollo enriches → DB stores lead + work history
4. Admin copies onboard link: `simplifyingbusinesses.com/onboarding/[token]`
5. Admin sends link to lead (or use `sendOnboardingEmail()` function)
6. **Lead** opens link → sees pre-filled work history cards
7. Lead fills availability form → submits
8. Lead sees confirmation screen

---

## Resend Domain Verification

The email sender is currently `onboarding@simplifyingbusinesses.com`. This requires:
1. Add domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Wait for verification

**Fallback while unverified:** Use `onboarding@resend.dev` (works but shows Resend branding)

To switch: edit `lib/email.ts` and update the `from` field.

---

## Testing

```bash
# Local development
cd albs-portal
npm run dev

# Test enrichment
curl -X POST http://localhost:3000/api/enrich \
  -H "Content-Type: application/json" \
  -d '{"linkedinUrl": "https://linkedin.com/in/someone", "generateToken": true}'
```

---

## Support

- Apollo docs: https://apollo.io/api
- Resend docs: https://resend.com/docs
- Prisma docs: https://prisma.io/docs