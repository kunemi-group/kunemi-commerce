# Kunemi Workspace

**Kunemi Commerce** product — social selling desk for teams that close orders on WhatsApp / Instagram.

Multi-tenant ops: orders, optional inventory, bank-transfer payments (default), quotes/invoices (PDF), deliveries, sales team, and (later) AI agents.

> **Not ShopFlow** — that name is reserved for a different Kunemi product.

## Monorepo

| Path | Stack | Port |
|------|--------|------|
| `frontend/` | **Next.js** (App Router) + React + shadcn | 3000 |
| `backend/` | **NestJS** (TypeScript) | 3001 |
| `docs/` | PRD + Phase 1 technical plan | — |

## Product principles

1. **Chat-first commerce** — agents close sales in DMs; platform is the back office.
2. **Inventory is optional** — zero products is valid; freeform order/quote/invoice lines always work. Stock holds only when a catalog variant is used.
3. **VAT** — settings rate; taxable **products only**; tax-free lines exempt; **shipping never taxed**.
4. **Sales Team** (humans + roles) ≠ **AI Agents** (tier-gated seats; runtime later).

## Quick start

```bash
# API (Postgres via Docker — recommended)
cd backend
docker compose up -d
# ensure DATABASE_TYPE=postgres in .env
npm install
npm run start:dev
# → http://localhost:3001/api/health
# seed login: owner@lagosthreads.co / password123
# bank transfer is default payment (pay link + verify)
# deliveries + public tracking are persisted; RLS policies applied on boot

# UI (still mock-backed until wired)
cd frontend
pnpm install
pnpm dev
# → http://localhost:3000
```

SQLite fallback: set `DATABASE_TYPE=sqlite` in `backend/.env` (no Docker).

## Docs

- `docs/Phase1_Technical_Build_Plan.md` — API, schema, Nest modules
- `todo.md` — done vs backlog
- `backend/README.md` — API stubs and curl examples
