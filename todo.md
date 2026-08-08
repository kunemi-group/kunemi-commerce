# Kunemi Workspace — Project status & todo

**Last updated:** 2026-07-26  
**Product:** Kunemi Workspace under **Kunemi Commerce**  
**Repo:** https://github.com/kunemi-group/kunemi-commerce.git  
**Note:** `docs/` is gitignored (local confidential product docs only).

**Current state:** Multi-tenant NestJS API on Docker Postgres (JWT, orders, optional inventory, bank-transfer payments, deliveries, tracking, **quotations/invoices**, **Cloudflare R2 storage**, **ShopFlow public store catalog**, RLS) with Next.js UI largely wired via **Axios + TanStack Query**. Phase 1 commerce + documents + store backend ready; messaging and AI remain UI-only.

### Architecture lock (one backend)

- **One NestJS backend** for Kunemi Workspace + ShopFlow (no second commerce API).
- **Workspace** = independent **business store platform**. Sellers/business access **everything** here (catalog, products, orders, pay, team, analytics, chat inbox). Works without ShopFlow.
- **ShopFlow** = **buyer/users only** frontend (+ mobile later) on the same API.
  - **Sellers / businesses cannot log into ShopFlow** — no seller mode, no seller dashboard, no seller chat there.
  - Reason: all business operations live in Workspace; ShopFlow is the consumer surface only.
- **Chat:** buyers message in ShopFlow; sellers reply in Workspace (shared chat API).
- **Global (locked):**
  - Workspace is **not NGN-only** — per-business **ISO currency** + integer minor units; locale-aware display.
  - Payments are **pluggable**: default **bank transfer** (business account details); later **Stripe / Paystack** etc. behind the same order/payment state machine.
- Detail: `docs/Architecture_One_Backend.md` (local docs/).

### How to run

```bash
# API (NestJS) — Postgres via Docker
cd backend
docker compose up -d
# DATABASE_TYPE=postgres in .env
npm install
npm run start:dev   # http://localhost:3001/api/health
# seed: owner@lagosthreads.co / password123

# UI (Next.js) — live API for core commerce screens
cd frontend
pnpm install
pnpm dev            # http://localhost:3000
pnpm test           # Vitest (api layer + totals)
```

---

## Overall progress

| Layer | Status |
|-------|--------|
| Product docs (PRD + Phase 1 tech plan) | Done (local `docs/`, not in git) |
| NestJS + Postgres persistence | **Done** (+ SQLite fallback) |
| Postgres RLS + public pay/track definer paths | **Done** |
| Bank-transfer payments (default) | **Done** end-to-end |
| Frontend API layer (`frontend/api`) | **Done** — Axios + TanStack Query + Vitest |
| Wire core commerce UI → API | **Done** — auth, onboarding, orders, pay, payments, inventory, deliveries, track, settings, team |
| Dashboard KPIs (counts / revenue / review) | **Live** from orders/payments |
| Dashboard charts (revenue series, payment split) | **Live** (14-day revenue + payment methods) |
| Product create / edit / variant / restock / delete UI | **Done** |
| Sales team home widget | **Live roster** (no fake conversion metrics) |
| Quotations / invoices | **Done** — API + create/list/status + PDF preview |
| Cloudflare R2 storage | **Done** — uploads + media serve; local fallback |
| ShopFlow public catalog | **Done** — `GET /api/store/:slug/products` |
| Team invite / RBAC mutations | **Done** — invite, role change, remove + RolesGuard |
| AI agent runtime | **UI placeholder** |
| Integrations (WA/IG, card gateway, courier APIs) | **Not started** (ShopFlow store **read API** ready) |

**Rough completion:** backend Phase 1 ~**97%** · frontend live-wired ~**92%**

---

## Done

### Product model (decisions locked)

- [x] Social commerce OS (chat-first, not storefront-first)
- [x] **Sales Team** (humans + roles) vs **AI Agents** (tier-gated, separate nav)
- [x] Tier limits: team seats vs AI seats (Starter / Growth / Scale)
- [x] VAT: rate from settings; **products only** (never shipping); tax-free line exemption
- [x] Shipping as separate fee on orders / quotes / invoices
- [x] **Inventory optional** — freeform lines with no catalog; stock holds only for variants
- [x] Payments: bank transfer default + proof-of-payment review (card later)
- [x] Quotations + invoices as first-class commerce documents (product intent; server TBD)
- [x] Frontend stack **Next.js** (App Router + shadcn)
- [x] Branding: **Kunemi Workspace** (not ShopFlow)

### Backend (NestJS)

- [x] Module layout: auth, businesses, inventory, orders, payments, deliveries, tracking, team, health
- [x] JWT register / login / `GET /auth/me` + global guard + tenant claims
- [x] TypeORM entities; Postgres (Docker) primary; SQLite local fallback
- [x] Freeform + catalog orders; reserve stock only when `variantId` set; cancel + expiry cron
- [x] Order list/detail embeds payment + delivery
- [x] Products / variants CRUD + restock APIs
- [x] `GET/PATCH /businesses/me` (tax, shipping, bank, brand, onboarding status)
- [x] Bank transfer payments: pay token, countdown, claim + optional proof, verify/reject → order `paid`
- [x] Public pay: `GET/POST /api/pay/:token` (+ RLS-safe public access)
- [x] Payments review: list, verify, reject, proof file
- [x] Deliveries: create, list, status transitions, order status sync
- [x] Public tracking: `GET /api/tracking/:token`
- [x] Postgres RLS + tenant GUC interceptor; SECURITY DEFINER for public track/pay
- [x] Demo seed: `owner@lagosthreads.co` / `password123`

### Frontend (Next.js)

#### API layer (`frontend/api`)

- [x] Axios client + token storage + error helpers
- [x] Services: auth, orders, products, payments, deliveries, team
- [x] TanStack Query hooks + query keys + QueryClient provider
- [x] Format helpers (`formatNgn`, `shortId`, `flattenInventory`, …)
- [x] Vitest + RTL: client, format, use-orders, pdf totals
- [x] Legacy `lib/api` re-exports / `apiGet`/`apiSend` deprecated (no UI callers)

#### Live against API

| Route / surface | Status |
|-----------------|--------|
| `/login`, `/register` | Live auth |
| `/onboarding` | Forced when incomplete; PATCH business |
| `/` | Live KPIs, revenue chart, payment split, attention inbox, recent orders, low stock, order status, team roster |
| `/workspace` | Live pipeline + create order; **open chats still sample** |
| `/orders` | Live table, KPIs, create/detail (cancel, create delivery) |
| `/payments` | Live review queue + verify/reject + proof open |
| `/inventory` | Live list, restock, create/edit product & variant, delete, KPIs |
| `/deliveries` | Live table + status, KPIs |
| `/team` | Live member list + KPIs |
| `/settings` | Live business/bank/tax/shipping/brand PATCH |
| `/pay/[token]` | Public bank-transfer pay + claim (TanStack) |
| `/track/[token]` | Public tracking (TanStack) |

#### Still mock / UI-only

| Route / surface | Notes |
|-----------------|-------|
| `/quotations`, `/documents/quotation/[id]` | Mock data + PDF preview |
| `/invoices`, `/documents/invoice/[id]` | Mock data + PDF preview |
| `/ai-agents` | Tier placeholder only |
| Workspace open chats | Sample inbox until messaging API |
| Role demo switcher | Local role UX; not full server RBAC |
| Export buttons | Chrome only |
| Chat→paid conversion on team widget | Needs messaging attribution |
| Hosted public quote/invoice pay link | Internal preview + WhatsApp share for now |

#### Other frontend done

- [x] AuthGate + session restore via `/auth/me`
- [x] Create-order drawer: freeform or catalog; bank transfer default; pay-link WhatsApp copy
- [x] Order detail: cancel, create delivery, share pay/track messages
- [x] Totals engine: merchandise + tax-free + shipping + VAT on taxable products (`lib/pdf/totals.ts`)
- [x] WhatsApp deep-link helpers, hold countdown, empty states
- [x] Repo branding rename ShopFlow → Kunemi Workspace; `docs/` ignored

---

## Yet to be done

### P0 — Close remaining Phase 1 gaps

- [x] Product create / edit / add-variant / delete UI (backend already supported)
- [x] Dashboard revenue + payment-split charts from real orders/payments
- [x] Empty states on charts + team roster (no fake conversion %)
- [ ] Optional: non-owner DB role + `FORCE ROW LEVEL SECURITY`
- [ ] Deploy pipeline (frontend host + API + Postgres)

### P1 — Documents & team depth

- [x] Quotes entities + APIs (create, list, send, accept)
- [x] Invoices entities + APIs (create, list, send, mark-paid, void)
- [x] Quote → convert to invoice
- [x] Wire quotations/invoices UI + KPIs + PDF preview off API
- [ ] Email send or hosted public document links (beyond clipboard/WhatsApp)
- [ ] Quote/invoice → order conversion (optional path)
- [x] Team invite + role mutations (owner / manager / sales / ops)
- [x] RolesGuard on team manage + business settings PATCH
- [ ] Broader per-route RBAC matrix (sales vs ops capabilities)
- [ ] Password change / forced reset after invite

### P2 — Integrations

- [x] Cloudflare R2 for images / proofs / document files (local fallback when unset)
- [x] Public ShopFlow catalog API (`/api/store/:slug…`)
- [ ] ShopFlow checkout → Workspace order create (write path)
- [x] Buyer user accounts on same auth API (`role: buyer`, no businessId)
- [x] Chat module (shared API): buyer endpoints + Workspace `/inbox` UI
- [x] Multi-currency foundation: `business.currency` (ISO), formatMoney helpers, settings picker
- [x] PaymentProvider registry (bank_transfer live; Stripe/Paystack stubs)
- [x] Wire Workspace UI off `formatNgn` → `useMoney()` / `formatMoney(..., currency)`
- [x] Currency polish: form labels, shipping major/minor, revenue chart, PDF currency, product edit price
- [ ] Card gateway webhooks (Stripe/Paystack) as secondary methods behind provider interface
- [ ] Courier API providers + webhooks (manual fulfillment already works)
- [ ] External messaging (WA/IG) — separate from in-app ShopFlow↔Workspace chat
- [ ] Cloudflare Worker (or equivalent) edge webhook ingestion
- [ ] Notification center (expiring holds, payment claims, delivery events, chat)

### P3 — AI Agents (deferred by design)

- [ ] Design agent tools (catalog Q&A, create order, send quote/invoice, payment follow-up, handoff)
- [ ] Provision AI seats by subscription tier
- [ ] Runtime, memory, audit log, human takeover
- [ ] Guardrails: tax-free rules, stock holds, payment confirmation policy

### P4 — Quality

- [x] Unit tests: totals engine, API client helpers, use-orders hook sample
- [ ] Broader hook/component tests + order lifecycle e2e
- [ ] Backend unit/e2e tests for pay claim → verify → ship → track
- [ ] Keep this file updated as work lands

---

## Suggested next build order

1. ~~Backend skeleton + auth + tenant isolation~~  
2. ~~Products / inventory + create order + holds~~  
3. ~~Deliveries + tracking + RLS~~  
4. ~~Bank transfer payments (default)~~  
5. ~~Frontend API layer + wire core commerce screens~~  
6. ~~Product CRUD UI + live dashboard charts~~  
7. ~~Quotes / invoices backend + wire documents~~  
8. ~~Team invite / RBAC~~  
9. ~~Cloudflare R2 + ShopFlow public catalog~~  
10. ~~Buyer auth + chat API (buyer endpoints + Workspace inbox)~~  
11. **ShopFlow buyer FE + checkout → Workspace orders**  
12. External messaging (WA/IG)  
13. Card gateway / courier APIs (optional)  
14. AI agent design (separate from human Sales Team)

---

## Key code pointers

| Area | Path |
|------|------|
| Frontend API layer | `frontend/api/` |
| Chart analytics helpers | `frontend/api/analytics.ts` |
| Product form sheet | `frontend/components/dashboard/product-form-sheet.tsx` |
| Documents API | `backend/src/documents/` |
| Documents UI hooks | `frontend/api/hooks/use-documents.ts` |
| Create quote/invoice drawer | `frontend/components/dashboard/create-document-drawer.tsx` |
| Team invite / roles | `backend/src/team/`, `frontend/components/dashboard/invite-member-sheet.tsx` |
| Roles guard | `backend/src/common/guards/roles.guard.ts` |
| Chat API + Workspace inbox | `backend/src/chat/`, `frontend/app/inbox/` |
| Buyer auth | `POST /api/auth/buyer/register`, `POST /api/auth/buyer/login` |
| R2 / uploads | `backend/src/storage/` |
| ShopFlow store API | `backend/src/store/` |
| Upload client | `frontend/api/services/uploads.ts` |
| Auth session | `frontend/lib/auth-context.tsx` |
| Remaining mock domain data | `frontend/lib/data.ts` |
| VAT + shipping totals | `frontend/lib/pdf/totals.ts` |
| Nav | `frontend/components/dashboard/nav-items.ts` |
| Public pay UI | `frontend/app/pay/[token]/` |
| Public track UI | `frontend/app/track/[token]/` |
| Docker Postgres | `backend/docker-compose.yml` |
| RLS bootstrap | `backend/src/database/rls.service.ts` |
| Auth | `backend/src/auth/` |
| Businesses | `backend/src/businesses/` |
| Orders | `backend/src/orders/` |
| Inventory | `backend/src/inventory/` |
| Payments | `backend/src/payments/` |
| Deliveries | `backend/src/deliveries/` |
| Public tracking | `backend/src/tracking/` |
| Local product docs (not in git) | `docs/` |
