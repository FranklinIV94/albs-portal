# ALBS Portal — API Reference for Zo Agent Integration

**Portal:** `https://onboarding.simplifyingbusinesses.com`
**Auth:** `x-api-key` header — store your key in Zo Settings → Advanced → Secrets as `PORTAL_API_KEY_ZO`

---

## Core Endpoints for Lead/Pipeline Tracking

### 1. List All Leads (with filters)
```
GET /api/admin/leads?status=NEW&limit=50
GET /api/admin/leads?createdAfter=2026-03-29
GET /api/admin/leads?status=ACTIVE&limit=50
```

**Query params:**
| Param | Example | Description |
|---|---|---|
| `status` | `NEW`, `CONTACTED`, `QUALIFIED`, `PROPOSAL`, `NEGOTIATION`, `ACTIVE`, `INACTIVE` | Lead status filter |
| `serviceCategories` | `TAX_BUSINESS`, `AI_SERVICES`, `PAYROLL_BOOKKEEPING` | Comma-separated |
| `createdAfter` | `2026-03-29T00:00:00Z` | ISO date — leads created after this time |
| `search` | `Collins` | Search by name or company |
| `email` | `polaris@gmail.com` | Filter by email (partial match) |
| `limit` | `50` | Max results (default 50) |
| `offset` | `0` | Pagination offset |

**Returns:** `{ leads: [...], total, limit, offset }`
Each lead includes: `id, firstName, lastName, email, phone, company, status, serviceCategories, onboardingCompleted, createdAt, updatedAt, leadServices`

---

### 2. Get Single Lead (full detail + services)
```
GET /api/admin/leads/:leadId
```

**Returns:** Lead object with nested `leadServices` array (each includes `service.name`, `service.priceDisplay`, `customPrice`).

---

### 3. Get Lead Onboarding Progress
```
GET /api/progress?leadId=:leadId
```
Returns: `{ onboardingStep, onboardingCompleted, stepNames[], updatedAt }`

Steps: Information → Services → Contract → Calendar → Payment → Review → Complete

---

### 4. Get Lead Services
```
GET /api/admin/leads/services?leadId=:leadId
```
Returns: `{ leadServices: [{ id, serviceId, customPrice, service: { name, priceDisplay, description } }] }`

---

### 5. Get Lead Messages
```
GET /api/admin/leads/:leadId/messages
```

---

### 6. Get Lead Notes
```
GET /api/admin/leads/:leadId/notes
```

---

### 7. Get Lead Tasks
```
GET /api/admin/leads/:leadId/tasks
```

---

### 8. Get Lead Activity Log
```
GET /api/admin/leads/:leadId/activity
```

---

### 9. Update Lead Status
```
PATCH /api/admin/leads
Content-Type: application/json
{ "leadId": "...", "status": "QUALIFIED", "notes": "..." }
```

---

## Analytics

### 10. Revenue Analytics
```
GET /api/admin/analytics?startDate=2026-01-01&endDate=2026-03-31
```
Returns: `{ totalRevenue, payouts, payments[], invoices[], revenueByMonth }`

---

## Onboarding Tokens

Each lead has a `token` field — use this to build the onboarding URL:
```
https://onboarding.simplifyingbusinesses.com/onboard/:token
```

---

## Common Query Patterns

### "What new clients came in today?"
```javascript
GET /api/admin/leads?createdAfter=2026-03-29T00:00:00Z
```
Filter results for `status: "NEW"` to see brand new leads.

### "What's the status of [client name]?"
```javascript
GET /api/admin/leads?search=:clientName
// or
GET /api/admin/leads?email=:email
```
Then call `GET /api/progress?leadId=:id` for onboarding stage.

### "Show all active clients"
```javascript
GET /api/admin/leads?status=ACTIVE
```

### "Show all leads by service type"
```javascript
GET /api/admin/leads?serviceCategories=TAX_BUSINESS
```

---

## Error Responses
| Code | Meaning |
|---|---|
| `401` | Invalid or missing API key |
| `400` | Bad request (missing params) |
| `404` | Lead/resource not found |
| `500` | Server error |

---

## Authentication
All admin endpoints require:
```
x-api-key: YOUR_API_KEY
```
Header. The portal API key is the same one you use for the admin dashboard.

Store it in Zo at: **Settings → Advanced → Secrets → `PORTAL_API_KEY_ZO`**
