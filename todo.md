# ShopFlow — Project status & todo

**Last updated:** 2026-07-17  

**Current state:** Strong **Next.js** frontend + **NestJS API on Docker Postgres** with JWT auth, freeform/catalog orders, stock holds, **bank-transfer payments (default)**, delivery + public tracking, and **Postgres RLS**.

### How to run

```bash
# API (NestJS) — Postgres via Docker
cd backend
docker compose up -d
# DATABASE_TYPE=postgres in .env
npm install
npm run start:dev   # http://localhost:3001/api/health
# seed: owner@lagosthreads.co / password123

# UI (Next.js) — still mock data
cd frontend
pnpm install
pnpm dev            # http://localhost:3000
```

---

## Overall progress

| Layer | Status |
|-------|--------|
| Product docs (PRD + Phase 1 tech plan) | Done (Next.js + optional inventory) |
| Frontend UI (Next.js + shadcn, mock data) | **Strong** — freeform + catalog orders |
| NestJS + persistence (JWT, orders, products, payments, deliveries, tracking) | **Done on Postgres** (+ SQLite fallback) |
| Postgres RLS | **Done** (ENABLE policies + public tracking/pay definer fns) |
| Wire frontend → API | **Partial** — auth, register, onboarding, pay + payments review |
| Payments module | **Bank transfer default done**; card gateway later |
| AI agent runtime | **UI placeholder only** |
| Integrations (WA/IG, pay gateway, courier) | **Not started** |

---

## Done

### Product model (decisions locked)

- [x] Social commerce OS positioning (chat-first, not storefront-first)
- [x] **Sales Team** (humans + roles) vs **AI Agents** (tier-gated, separate nav)
- [x] Tier limits: team seats vs AI seats (Starter / Growth / Scale)
- [x] VAT: rate from settings; **products only** (never shipping); tax-free line exemption
- [x] Shipping as separate fee on orders / quotes / invoices
- [x] **Inventory optional** — freeform lines work with no catalog; stock holds only for variants
- [x] Payments: card + bank transfer + proof-of-payment review concept
- [x] Quotations + invoices as first-class commerce documents
- [x] Docs: frontend stack **Next.js** (not Vite)
- [x] NestJS monorepo `backend/` scaffold (health, team, inventory, orders, payments, deliveries, tracking)
- [x] JWT register/login + global auth guard + tenant JWT claims
- [x] TypeORM entities + Postgres (Docker) primary; SQLite (`better-sqlite3`) local fallback
- [x] Persist freeform + catalog orders; reserve stock only for `variantId` lines; cancel + expiry cron
- [x] Demo seed: `owner@lagosthreads.co` / `password123`
- [x] **Deliveries persistence** — create, list, status transitions, order status sync
- [x] **Public tracking** — `/api/tracking/:token` with timeline, items, business info
- [x] **Postgres RLS** — tenant policies on core tables; SECURITY DEFINER for public tracking
- [x] Tenant interceptor sets `app.current_business_id` GUC (Postgres only)
- [x] **Bank transfer default payment** — business account details, 30m countdown, customer “I paid” + optional proof, business verify → order `paid`
- [x] Public pay page `GET/POST /api/pay/:token` + frontend `/pay/[token]`
- [x] Business review queue `GET /api/payments`, verify/reject + proof file

### Frontend routes & UX (mock-backed)

| Route | What works |
|-------|------------|
| `/` | Owner dashboard — KPIs, charts, attention inbox, onboarding |
| `/workspace` | Sales floor — chats, pipeline, create-order drawer |
| `/orders` | Filters, hold countdown, detail sheet, new order |
| `/inventory` | Stock, reserved holds, tax-free product tags |
| `/quotations` | Quote list + send/share UX |
| `/invoices` | Invoice list + send/share UX |
| `/documents/quotation/[id]` | PDF template preview + download |
| `/documents/invoice/[id]` | PDF template preview + download |
| `/payments` | Review queue + proof dialog (UI only) |
| `/deliveries` | Fulfillment modes + tracking link copy |
| `/team` | Sales team roster & performance |
| `/ai-agents` | Tier-gated AI seats placeholder |
| `/settings` | Business, bank, payments, branding, VAT, default shipping |
| `/track/[token]` | Public customer tracking page |
| `/agents` | Redirects → `/team` |

Also done:

- [x] Role demo switcher (owner vs sales teammate shell)
- [x] WhatsApp copy helpers, hold countdown, empty states, motion/density polish
- [x] Totals engine: merchandise + tax-free + shipping + VAT on taxable products only (`frontend/lib/pdf/totals.ts`)
- [x] Branding (logo/color/VAT/default shipping) via localStorage for demo
- [x] Next config fix so `@react-pdf/renderer` does not crash the app

### Docs present

- [x] `docs/Omnicommerce_Ecosystem_Master_PRD_v2_1.docx`
- [x] `docs/Phase1_Technical_Build_Plan.md` (API/DB design; not implemented)
- [x] `backend/README.md` updated for Postgres, deliveries, RLS

---

## Yet to be done

### P0 — Backend / system of record

- [x] NestJS API scaffold (module layout, `/api` prefix, port 3001)
- [x] JWT auth + multi-tenant `businessId` on token
- [x] Persist freeform + variant order lines; reserve stock **only** when `variantId` set
- [x] Order cancel + expiry cron (variant holds only)
- [x] Postgres via Docker + RLS policies (ENABLE; FORCE/non-owner role optional later)
- [x] Deliveries + public tracking persistence
- [x] Bank transfer payments + RLS on `payments` (+ optional proof upload)
- [ ] Card gateway webhooks (optional path later)
- [ ] Wire remaining frontend (orders, inventory, dashboard) off mocks → API
- [ ] Cloudflare Worker edge webhook ingestion (payments, courier; later WA/IG)
- [ ] Optional: non-owner DB role + `FORCE ROW LEVEL SECURITY`

### P1 — Product flows still UI-only or incomplete

- [ ] Persist create-order from Next.js UI (server inventory reserve + payment link)
- [x] Real bank-transfer pay link + countdown + claim + verify → `paid`
- [ ] Card gateway webhooks (secondary method)
- [ ] Courier API providers + webhooks (manual mode already works)
- [ ] Quote → accept → invoice/order conversion (server)
- [ ] Invoice pay + status lifecycle (server)
- [ ] Email send of PDF (quotes/invoices), not only mailto/copy
- [ ] Host PDF and share link for WhatsApp (not only clipboard message)
- [ ] True RBAC (owner / manager / sales / ops) beyond demo role switcher
- [x] Branding / VAT / shipping / bank settings on **business record** (`PATCH /businesses/me`)
- [x] Inventory update + restock APIs
- [x] Order list/detail embed payment + delivery
- [x] `GET /auth/me` for SPA session
- [x] UI register + login + forced onboarding wizard (bank, WhatsApp, address, tax/shipping, brand)
- [x] Register leaves bank empty until onboarding completes

### P2 — AI Agents (deferred by design)

- [ ] Design AI agent tools (catalog Q&A, create order, send quote/invoice, payment follow-up, handoff to Sales Team)
- [ ] Provision AI seats by subscription tier
- [ ] Runtime, memory, audit log, human takeover
- [ ] Guardrails: tax-free rules, stock holds, payment confirmation policy

### P3 — Polish / depth

- [ ] Order detail mutations (cancel, resend pay link, ship) with server state
- [ ] Inventory CRUD + restock (server)
- [ ] Team invite + permission management (server)
- [ ] Notification center (expiring holds, proofs, failed delivery)
- [ ] Wire `/track/[token]` UI to `/api/tracking/:token`
- [ ] Tests (unit for totals engine, e2e for order lifecycle)
- [ ] Deploy pipeline (frontend host + API + DB)

### Docs / housekeeping

- [x] Align Phase 1 tech plan stack: **Next.js** (not Vite) + optional inventory schema
- [x] Update this file as work lands (Postgres + deliveries + RLS)

---

## Suggested next build order

1. ~~Backend skeleton + auth + tenant isolation~~  
2. ~~Products / inventory + create order + holds~~  
3. ~~Deliveries + tracking + RLS~~  
4. ~~Bank transfer payments (default)~~  
5. Wire dashboard & orders to API  
6. Card gateway (optional)  
7. AI agent design (separate from human Sales Team RBAC)

---

## Key code / doc pointers

| Area | Path |
|------|------|
| Mock domain data | `frontend/lib/data.ts` |
| VAT + shipping totals | `frontend/lib/pdf/totals.ts` |
| Nav | `frontend/components/dashboard/nav-items.ts` |
| Phase 1 API/DB plan | `docs/Phase1_Technical_Build_Plan.md` |
| Master PRD | `docs/Omnicommerce_Ecosystem_Master_PRD_v2_1.docx` |
| Docker Postgres | `backend/docker-compose.yml` |
| RLS bootstrap | `backend/src/database/rls.service.ts` |
| Deliveries | `backend/src/deliveries/` |
| Public tracking | `backend/src/tracking/` |
| Bank transfer payments | `backend/src/payments/` |
| Customer pay UI | `frontend/app/pay/[token]/` |
