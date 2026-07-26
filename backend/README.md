# ShopFlow API (NestJS)

Backend for the ShopFlow social commerce OS.

## Stack

- **NestJS** (Node.js / TypeScript)
- **TypeORM**
- **PostgreSQL** (Docker) — primary persistence + RLS
- **SQLite** (`better-sqlite3`) — optional local fallback without Docker
- Global prefix: `/api`
- Default port: **3001**

## Product rules

1. **Inventory is optional** — freeform order lines work with no catalog. Stock holds only when `variantId` is set.
2. **VAT** — rate from business settings; taxable **product lines only**; shipping never taxed.
3. **Sales Team** (humans) ≠ **AI Agents** (later).
4. **Payments** — **default is bank transfer**: show business account details, countdown, customer “I have made payment” (+ optional proof), business verifies → order `paid`.

## Run (Postgres + Docker) — recommended

```bash
cd backend
docker compose up -d
# backend/.env should have DATABASE_TYPE=postgres
npm install
npm run start:dev
# or: npm run build && node dist/main.js
```

- Health: http://localhost:3001/api/health  
- Seeded user: `owner@lagosthreads.co` / `password123`  
- Postgres: `localhost:5432` / user `shopflow` / password `shopflow` / db `shopflow`

On boot the API:

1. Syncs TypeORM schema  
2. Seeds demo business if empty  
3. Applies **Postgres RLS policies** + public tracking `SECURITY DEFINER` functions  

## Run (local SQLite)

```bash
cd backend
# set DATABASE_TYPE=sqlite in .env
npm install
npm run start:dev
```

## Auth

```bash
# Login
curl -s -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"owner@lagosthreads.co\",\"password\":\"password123\"}"

# Register new business + owner
curl -s -X POST http://localhost:3001/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"businessName\":\"My Shop\",\"email\":\"me@shop.com\",\"password\":\"password123\",\"fullName\":\"Owner Name\"}"
```

Use `Authorization: Bearer <accessToken>` on protected routes.

JWT carries `businessId`. A tenant interceptor sets Postgres GUC `app.current_business_id` per request (skipped on SQLite).

## Key routes

| Method | Path | Auth | Notes |
|--------|------|------|--------|
| GET | `/api/health` | public | Liveness |
| POST | `/api/auth/register` | public | Create business + owner |
| POST | `/api/auth/login` | public | JWT |
| GET | `/api/auth/me` | JWT | Current user + business (SPA bootstrap) |
| GET | `/api/businesses/me` | JWT | Tenant profile + tax/shipping/bank |
| PATCH | `/api/businesses/me` | JWT | Update bank, VAT, shipping, branding, contact |
| GET | `/api/team` | JWT | Human team members |
| GET/POST | `/api/products` | JWT | Optional catalog list/create |
| GET/PATCH/DELETE | `/api/products/:id` | JWT | Product detail / update / delete |
| POST | `/api/products/:id/variants` | JWT | Add variant |
| PATCH | `/api/variants/:id` | JWT | Update price, tax, SKU, threshold |
| POST | `/api/variants/:id/restock` | JWT | `{ "delta": 10 }` adjust stock |
| GET/POST | `/api/orders` | JWT | Freeform and/or catalog lines |
| GET | `/api/orders/:id` | JWT | Detail + history |
| PATCH | `/api/orders/:id/cancel` | JWT | Release stock holds if pending |
| PATCH | `/api/orders/:id/mark-paid` | JWT | Ops shortcut → same as payment verify |
| GET | `/api/pay/:token` | public | Bank details + countdown + order summary |
| POST | `/api/pay/:token/claim` | public | Customer “I have made payment” (+ optional proof) |
| GET | `/api/payments` | JWT | Business payment list / review queue |
| PATCH | `/api/payments/:id/verify` | JWT | Confirm transfer → order `paid` |
| PATCH | `/api/payments/:id/reject` | JWT | Reject claim; customer can re-claim if window open |
| GET | `/api/payments/:id/proof` | JWT | Download uploaded proof file |
| GET | `/api/deliveries` | JWT | List tenant deliveries |
| POST | `/api/deliveries` | JWT | Create delivery (order must be `paid`) |
| PATCH | `/api/deliveries/:id/status` | JWT | Manual lifecycle transitions |
| GET | `/api/tracking/:token` | public | Customer tracking (bypasses RLS via definer fns) |

### Freeform order (no inventory)

```bash
curl -s -X POST http://localhost:3001/api/orders ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"customerName\":\"Ada\",\"customerPhone\":\"+234800\",\"customerEmail\":\"ada@example.com\",\"shippingFeeCents\":2500,\"items\":[{\"description\":\"Ankara Dress\",\"quantity\":1,\"unitPriceCents\":15000,\"taxExempt\":false}]}"
```

### Bank transfer (default payment)

```bash
# After POST /orders → response includes paymentLink + bankTransfer
# Customer page (public)
curl -s http://localhost:3001/api/pay/pay_TOKEN

# Customer claims payment (optional proofBase64)
curl -s -X POST http://localhost:3001/api/pay/pay_TOKEN/claim ^
  -H "Content-Type: application/json" ^
  -d "{\"customerNote\":\"Sent via USSD\"}"

# Business verifies (order → paid)
curl -s -X PATCH http://localhost:3001/api/payments/PAYMENT_UUID/verify ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"note\":\"Seen in bank\"}"
```

Order statuses: `pending` → `payment_review` (claimed) → `paid` (verified).  
Frontend pay UI: `http://localhost:3000/pay/<token>`.

### Delivery + public tracking

```bash
# after mark-paid
curl -s -X POST http://localhost:3001/api/deliveries ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"orderId\":\"ORDER_UUID\",\"fulfillmentMode\":\"manual\"}"

# public (no auth)
curl -s http://localhost:3001/api/tracking/trk_TOKEN

# status updates: awaiting_pickup → picked_up → out_for_delivery → delivered
curl -s -X PATCH http://localhost:3001/api/deliveries/DELIVERY_UUID/status ^
  -H "Authorization: Bearer TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"picked_up\",\"note\":\"Courier collected\"}"
```

Creating a delivery moves order `paid` → `shipped`. Marking delivery `delivered` moves order → `delivered`.

## Postgres RLS

- Tables: `businesses`, `users`, `products`, `product_variants`, `orders`, `order_items`, `order_status_history`, `deliveries`, `delivery_status_events`, `payments`
- Policy uses `current_setting('app.current_business_id', true)`
- `ENABLE ROW LEVEL SECURITY` (not `FORCE`) so the table owner can seed/migrate
- Public tracking uses `SECURITY DEFINER` functions:
  - `get_delivery_by_tracking_token`
  - `get_delivery_events`
  - `get_order_public` / `get_order_items_public`
  - `get_business_public`
  - `get_payment_by_token`

## Cron

Every minute: expire unpaid `pending` orders past `reservedUntil` and release reserved stock (catalog lines only). `payment_review` claims are not auto-expired (business still needs to act).

## Next

- Card gateway webhooks (optional second method)
- Wire remaining Next.js screens to this API
- Optional non-owner DB role + `FORCE ROW LEVEL SECURITY` for stricter isolation

Spec: `docs/Phase1_Technical_Build_Plan.md`
