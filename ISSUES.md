# Known Issues & Technical Debt

## March 16, 2026

### 1. Calendar → Outlook Sync (COMPLETED ✓)
- **Status:** DEPLOYED 2026-03-16
- **Changes:** 
  - Added Microsoft Graph API integration (lib/graph.ts)
  - Events now sync to Franklin's Outlook calendar on booking
  - Added outlookEventId field to track synced events
- **Config:** Azure AD app credentials set in Vercel

### 2. Resend Email Sending Failed (FIXED ✓)
- **Status:** FIXED 2026-03-16
- **Changes:** Updated all `from:` addresses to `Franklintaxpros@gmail.com`
- **Files modified:** 
  - `lib/email.ts` (3 occurrences)
  - `app/api/chat/route.ts` (3 occurrences)
  - `app/api/documents/route.ts` (1 occurrence)

### 3. Client Portal PIN (COMPLETED ✓)
- PIN authentication working on /client/[token]
- Book a Meeting button linked to /calendar
- Ready for production

---

## Previous Issues (Resolved)

- PIN save failure → Fixed API endpoint
- PIN input visibility → Fixed white text styling
- Client portal login → Added PIN verification flow