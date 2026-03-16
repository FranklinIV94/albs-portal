# Known Issues & Technical Debt

## March 16, 2026

### 1. Calendar → Outlook Sync Not Working (IN PROGRESS)
- **Status:** No Microsoft Graph integration exists
- **Current:** Calendar events only stored in database, no Outlook sync
- **Need:** Add MS Graph API integration with OAuth for Franklin's Outlook calendar
- **Effort:** Medium-High - requires OAuth flow and Graph API calls

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