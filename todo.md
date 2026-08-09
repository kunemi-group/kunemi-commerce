# Kunemi Workspace — Project status & todo

**Last updated:** 2026-08-09
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
| Cloudflare Edge Platform Router | **Done** — `cloudflare-platform` Worker + KV domain lookup |
| Platform Super Admin Module | **Done** — `super_admin` role, GMV metrics, store suspension, vanity domains, `/admin` UI |
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

### Security and architecture remediation plan

Complete the P0 security work before production deployment or adding more public integrations. Each task should include automated regression coverage and a short deployment/rollback note where configuration or persistence changes.

#### SEC-P0-01 — Remove public admin bootstrap

- [x] Delete `POST /api/admin/seed` and remove `@Public()` from the admin bootstrap path.
- [x] Remove `AdminService.seedSuperAdmin()` and every hardcoded admin email/password.
- [x] Remove the frontend **Seed Admin Account (Dev)** button and `seedAdminAccount()` API client.
- [ ] Replace HTTP seeding with an explicit CLI/deployment command requiring admin email and a generated password through secret-manager input.
- [x] Add an e2e test proving unauthenticated users cannot create or promote platform administrators.
- **Files:** `backend/src/admin/admin.controller.ts`, `backend/src/admin/admin.service.ts`, `frontend/components/admin/admin-auth.tsx`, `frontend/api/services/admin.ts`.
- **Done when:** no public route, browser action, default credential, or production startup path can create a platform administrator.

#### SEC-P0-02 — Rotate and validate secrets

- [ ] Rotate the mail/provider credential currently present in `backend/.env` if it has ever been used.
- [ ] Rotate production JWT, database, Cloudflare platform, R2, payment-provider, and admin API credentials.
- [x] Keep only placeholders in `.env.example`; never store usable secrets in source-controlled files.
- [x] Verify `.gitignore` excludes `.env*` except examples, SQLite databases, uploads, `.next`, `dist`, coverage, local logs, and Wrangler `.dev.vars`.
- [x] Add startup configuration validation with separate development/test/production schemas.
- [x] Remove fallback JWT and platform shared secrets; fail production startup when required values are absent, default-looking, or too short.
- [ ] Add secret scanning to CI and pre-commit checks.
- **Files:** `backend/.env.example`, auth configuration, edge-proxy configuration, `cloudflare-platform/wrangler.jsonc`.
- **Done when:** production cannot start with fallback credentials and automated secret scanning passes.

#### SEC-P0-03 — Make tenant isolation fail closed

- [x] Stop swallowing tenant-context setup errors in `TenantContextInterceptor`; reject the request before business queries execute.
- [ ] Replace connection-pool session GUC usage with request transactions/query runners using transaction-local context, or mandatory tenant-scoped repositories.
- [ ] Ensure cleanup uses the same database connection and cannot leak tenant context to another request.
- [ ] Require `{ id, businessId }` for all tenant-owned reads and mutations, including scheduled jobs and relation reloads.
- [x] Add `businessId` to the order-expiry variant lookup and other ID-only tenant-owned queries.
- [ ] Run PostgreSQL with a non-owner application role and enable/verify `FORCE ROW LEVEL SECURITY` where applicable.
- [ ] Add concurrent cross-tenant tests for orders, products, variants, payments, proofs, deliveries, documents, chats, team members, and expiry processing.
- **Files:** `backend/src/common/interceptors/tenant-context.interceptor.ts`, RLS files, all tenant module services.
- **Done when:** tenant-context failure blocks requests and Business A cannot access Business B data during normal, concurrent, or scheduled execution.

#### SEC-P0-04 — Replace schema synchronization with migrations

- [x] Set TypeORM `synchronize: false` for PostgreSQL and all production environments.
- [ ] Permit SQLite synchronization only in explicit local/test configuration if still needed.
- [ ] Add a baseline migration for schema, indexes, constraints, and RLS policies.
- [ ] Add migration generate/run/revert scripts.
- [ ] Run migrations before application rollout with a role separate from the runtime role.
- [ ] Test migration from a representative existing database and document rollback/restore.
- **Files:** `backend/src/app.module.ts`, `backend/package.json`, new `backend/src/database/migrations/`.
- **Done when:** production startup never modifies schema automatically and migrations can create a clean database.

#### SEC-P0-05 — Move authentication to secure server-managed sessions

- [x] Stop storing access and refresh tokens in `localStorage` or JavaScript-readable cookies.
- [x] Set refresh/session cookies from the backend or a Next.js BFF with `HttpOnly`, `Secure`, `SameSite`, explicit `Path`, and bounded expiry.
- [ ] Keep access tokens short-lived and in memory, or use opaque server-side browser sessions.
- [x] Add CSRF protection for state-changing cookie-authenticated requests and enforce allowed origins.
- [ ] Store refresh sessions per device with rotation, reuse detection, revocation, and token-family identifiers.
- [ ] Revoke sessions after logout, password reset, or security-sensitive account changes.
- [x] Make Next.js route protection validate a server-verifiable session rather than cookie presence.
- [x] Remove legacy token-storage migration code after a bounded release.
- **Files:** `frontend/api/client.ts`, `frontend/lib/cookies.ts`, `frontend/proxy.ts`, `frontend/lib/auth-context.tsx`, `backend/src/auth/`.
- **Done when:** browser JavaScript cannot read long-lived credentials and auth/session/CSRF e2e tests pass.

#### SEC-P1-01 — Harden login, OTP, registration, and recovery

- [ ] Generate OTPs with `crypto.randomInt()` and store only a keyed hash/HMAC.
- [ ] Add attempt limits, one-time consumption, resend cooldown, expiry, and previous-code invalidation.
- [ ] Add IP- and account-aware rate limiting to register, login, admin login, verify, resend, refresh, public payment claims, and tracking.
- [ ] Return consistent public responses to limit account enumeration.
- [ ] Benchmark/document password hashing policy; consider Argon2id for new passwords.
- [ ] Add password change/reset and security event logging.
- **Files:** `backend/src/auth/`, `backend/src/database/entities/user.entity.ts`, `backend/src/main.ts`.
- **Done when:** brute-force, OTP replay, refresh replay, and enumeration tests pass.

#### SEC-P1-02 — Harden uploads and private media

- [ ] Prefer multipart or direct-to-R2 signed uploads over base64 JSON.
- [ ] Enforce body limits before decoding and decoded-size limits afterward.
- [ ] Validate file signatures and re-encode images where practical; never trust client MIME type or filename.
- [ ] Use generated keys and verify resolved local paths remain under the upload root.
- [ ] Separate public product/brand assets from private proofs and documents.
- [ ] Require tenant authorization or short-lived signed URLs for private objects.
- [ ] Set safe `Content-Disposition`, `X-Content-Type-Options`, cache, and CSP headers.
- [ ] Add malware scanning/quarantine hooks and adversarial upload tests.
- **Files:** `backend/src/storage/`, `backend/src/payments/payments.service.ts`, `frontend/api/services/uploads.ts`.
- **Done when:** only verified allowlisted content is stored and private media cannot be fetched anonymously or across tenants.

#### SEC-P1-03 — Add platform HTTP security controls

- [ ] Add CSP, HSTS in production, `nosniff`, frame restrictions, referrer policy, and permissions policy.
- [ ] Validate `CORS_ORIGIN`; reject wildcard/malformed production configuration while credentials are enabled.
- [ ] Disable or protect Swagger in production and disable persisted authorization outside local development.
- [ ] Add request IDs, structured logs, secret/PII redaction, centralized exception mapping, and request-size limits.
- [ ] Configure trusted proxies explicitly; never trust identity headers without authenticated proxy verification.
- [ ] Allow only validated `https:` external tracking URLs.
- **Files:** `backend/src/main.ts`, `backend/src/common/`, delivery DTOs, `frontend/next.config.mjs`.
- **Done when:** security-header, CORS, redaction, proxy-header, and URL-validation tests pass.

#### SEC-P1-04 — Complete server-side authorization policy

- [ ] Define a route/action matrix for owner, manager, sales, ops, user, admin, and super-admin.
- [ ] Apply policy guards across settings, inventory, orders, payments, deliveries, documents, chat, team, and admin.
- [ ] Treat frontend gates only as presentation; enforce every privileged action in the backend.
- [ ] Prevent deleting/demoting the last super-admin and require step-up authentication for destructive platform actions.
- [ ] Add immutable audit events for admin, role, business, domain, payment, proof-access, and sensitive-setting actions.
- [ ] Add table-driven authorization tests for every protected controller action.
- **Done when:** the RBAC matrix is documented and every privileged endpoint has automated policy coverage.

#### ARCH-P1-01 — Enforce frontend boundaries

- [ ] Remove deprecated `frontend/lib/api.ts` after migrating remaining imports.
- [ ] Keep `app/` pages focused on routing/composition; move domain UI/state into `features/<domain>`.
- [ ] Keep transport types, query keys, client, and services in `frontend/api/` without UI dependencies.
- [ ] Generate or validate frontend API types from the backend OpenAPI contract.
- [ ] Replace `Record<string, unknown>` mutation inputs with explicit schemas/types.
- [x] Remove `typescript.ignoreBuildErrors`; builds must fail on type errors.
- [ ] Add ESLint import-boundary rules.
- **Done when:** lint/type/build checks enforce boundaries and deprecated API helpers are gone.

#### ARCH-P1-02 — Enforce backend boundaries

- [ ] Choose and document one feature-module directory convention; avoid a partial restructuring.
- [ ] Keep controllers limited to transport concerns and move workflows into application services/use cases.
- [ ] Put persistence behind tenant-aware repositories.
- [ ] Centralize configuration schemas, policies, tenant scoping, audit events, serializers, and exception handling.
- [ ] Add constraints/indexes for state invariants, idempotency, unique public tokens, tenant relations, and common queries.
- [ ] Add idempotency/concurrency controls to payments, webhooks, order transitions, stock, and scheduled expiry.
- **Done when:** boundaries are documented, circular dependencies are absent, and concurrency/invariant tests pass.

#### QA-P1-01 — Establish a mandatory security and quality CI gate

- [x] Establish colocated unit-test coverage for security-sensitive services, guards, interceptors, and session helpers; keep cross-module HTTP behavior in `backend/test/` e2e suites.
- [ ] Use one documented package-manager strategy per workspace and frozen lockfiles.
- [ ] Backend gate: format check, lint without `--fix`, build/type check, unit/e2e tests, migration test, dependency audit.
- [ ] Frontend gate: format check, lint, type check, Vitest, production build, dependency audit.
- [ ] Add SAST, secret scanning, dependency updates, SBOM generation, and container/image scanning where applicable.
- [ ] Run RLS and migration tests against ephemeral PostgreSQL.
- [ ] Add smoke tests for health, auth, tenant isolation, admin denial, payments, private proofs, tracking, and secure headers.
- [ ] Block deployment on failure and publish diagnostic artifacts/coverage.
- **Done when:** a clean checkout passes without ignored type errors, dependency mutation, or manual database preparation.

#### Recommended remediation sequence

1. SEC-P0-01 public admin bootstrap removal.
2. SEC-P0-02 secret rotation and startup validation.
3. SEC-P0-03 tenant isolation redesign.
4. SEC-P0-04 migrations and database roles.
5. SEC-P0-05 secure browser sessions.
6. SEC-P1-01 authentication abuse controls.
7. SEC-P1-02 uploads/private media.
8. SEC-P1-03 HTTP controls.
9. SEC-P1-04 RBAC and auditing.
10. ARCH-P1-01 and ARCH-P1-02 structural enforcement.
11. QA-P1-01 CI gate; keep it active throughout all work.

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
