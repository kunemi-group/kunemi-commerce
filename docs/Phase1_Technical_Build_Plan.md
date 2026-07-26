# Phase 1 Technical Build Plan: B2B Commerce SaaS

Stack: **Next.js** (frontend, App Router + React) · **NestJS** (backend, Node.js/TypeScript) · **PostgreSQL** (database) · **Cloudflare Workers** (webhook edge ingestion)

This document turns the Phase 1 PRD into an implementable spec: data model, module boundaries, and API contracts. It assumes a single Postgres database shared across tenants, isolated via Row-Level Security (RLS) plus an application-level tenant guard, as described in the Master PRD's Cross-Phase Technical Principle.

### Cross-cutting product principle: inventory is optional

Not every merchant sells from a managed catalog. Phase 1 **must** support businesses that:

- have **no products** in inventory, or
- use inventory only for **some** SKUs,

while still creating orders, quotations, invoices, payments, and deliveries.

**Implications:**

- Order / quote / invoice line items may be **freeform** (description + qty + unit price) without a `variant_id`.
- Stock reservation, low-stock alerts, and hold expiry apply **only** when a line references a product variant.
- Inventory module remains first-class but **optional** for a tenant’s day-to-day ops.

---

## 1. High-Level Architecture

```
                 ┌──────────────────┐
   WhatsApp/IG  →│ Cloudflare Worker │→ verifies signature, forwards
   webhooks      │  (edge ingestion) │  validated payloads
                 └─────────┬─────────┘
                            │
                            ▼
   Next.js     ──HTTPS──▶ ┌───────────────────────┐
   Sales Workspace        │   NestJS API (REST)    │──▶ PostgreSQL
   Owner Dashboard ◀──────│  modules: auth, biz,   │    (RLS-scoped)
   Public Tracking Page   │  team, inventory*,     │
                           │  orders, payments,     │
                           │  deliveries, webhooks  │
                           └───────────────────────┘
                           * inventory optional per tenant
```

The public tracking page and the sales/owner dashboards are both served by the same **Next.js** app (`frontend/`), hitting the NestJS API (`backend/`) — the tracking endpoints are simply unauthenticated routes.

---

## 2. NestJS Module Structure

```
src/
├── main.ts
├── app.module.ts
├── common/
│   ├── guards/
│   │   ├── jwt-auth.guard.ts
│   │   └── tenant-scope.guard.ts        # reads businessId off the JWT
│   ├── decorators/
│   │   └── current-business.decorator.ts
│   ├── interceptors/
│   │   └── tenant-context.interceptor.ts  # SET LOCAL app.current_business_id per request
│   └── filters/http-exception.filter.ts
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   └── strategies/jwt.strategy.ts
├── businesses/                # tenant profile, subscription tier
├── team/                      # human sales team (owner/manager/sales/ops) + metrics
├── inventory/                 # OPTIONAL module — catalog + stock when used
│   ├── inventory.module.ts
│   ├── inventory.controller.ts
│   ├── inventory.service.ts   # stock decrement/restore, low-stock alerts (variant lines only)
│   └── entities/{product,product-variant}.entity.ts
├── orders/
│   ├── orders.module.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts      # freeform lines and/or variant lines; reserve only if variant
│   ├── order-state-machine.service.ts   # valid transitions + compensations
│   ├── order-expiry.scheduler.ts        # @Cron: release stock past reservedUntil (variant holds only)
│   └── entities/{order,order-item,order-status-history}.entity.ts
├── payments/
│   ├── payments.module.ts
│   ├── payments.controller.ts   # payment links, manual-transfer upload
│   ├── payments.service.ts
│   ├── providers/
│   │   ├── payment-provider.interface.ts
│   │   └── card-gateway.provider.ts
│   └── entities/payment.entity.ts
├── deliveries/
│   ├── deliveries.module.ts
│   ├── deliveries.controller.ts                # POST /orders/:id/deliveries — select mode/provider, ship
│   ├── deliveries.service.ts
│   ├── providers/
│   │   ├── fulfillment-provider.interface.ts  # assignDelivery / getDeliveryStatus / cancelDelivery
│   │   ├── manual-delivery.provider.ts         # 'manual' mode: no outbound call, optional external link
│   │   └── third-party-courier.provider.ts     # 'api_integrated' mode
│   └── entities/delivery.entity.ts
├── webhooks/
│   ├── webhooks.module.ts
│   ├── webhooks.controller.ts   # POST /webhooks/payments, POST /webhooks/courier
│   └── webhooks.service.ts      # idempotency check against webhook_events
└── tracking/
    └── tracking.controller.ts   # GET /tracking/:token — public, no auth
```

`fulfillment-provider.interface.ts` is the seam Phase 2 plugs into: a third `internal-logistics.provider.ts` joins `manual-delivery.provider.ts` and `third-party-courier.provider.ts` in `deliveries/providers/`, bound via the module's `providers` array — no other module changes.

---

## 3. Database Schema (PostgreSQL)

```sql
CREATE TABLE businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  whatsapp_number TEXT,
  subscription_tier TEXT NOT NULL DEFAULT 'starter', -- starter | growth | scale
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','agent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (business_id, email)
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE, -- denormalized for simpler RLS
  sku TEXT,
  attributes JSONB,            -- e.g. {"size":"M","color":"Red"}
  price_cents INTEGER NOT NULL,
  stock_on_hand INTEGER NOT NULL DEFAULT 0,
  stock_reserved INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  tax_exempt BOOLEAN NOT NULL DEFAULT false,  -- VAT product exemption default
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES users(id),  -- sales team member (human)
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,                    -- optional; for invoices / email delivery of PDFs
  delivery_address TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|paid|shipped|delivered|cancelled|expired
  reserved_until TIMESTAMPTZ,             -- inventory hold expiry (only if any variant lines reserved)
  shipping_fee_cents INTEGER NOT NULL DEFAULT 0,  -- never included in VAT base
  tax_cents INTEGER NOT NULL DEFAULT 0,           -- VAT on taxable product lines only
  subtotal_cents INTEGER NOT NULL DEFAULT 0,      -- merchandise before tax/shipping
  total_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Freeform lines: variant_id NULL + description required
-- Catalog lines: variant_id set; description may mirror product name
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES product_variants(id),  -- NULL = freeform / no inventory
  description TEXT NOT NULL,                        -- always stored for PDF/receipts
  quantity INTEGER NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  tax_exempt BOOLEAN NOT NULL DEFAULT false,         -- exclude from VAT base
  CHECK (quantity > 0),
  CHECK (variant_id IS NOT NULL OR length(trim(description)) > 0)
);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  method TEXT NOT NULL CHECK (method IN ('card','manual_transfer')),
  amount_cents INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'awaiting_payment', -- awaiting_payment|under_review|confirmed|failed
  proof_of_payment_url TEXT,
  confirmed_by UUID REFERENCES users(id),
  gateway_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  fulfillment_mode TEXT NOT NULL CHECK (fulfillment_mode IN ('manual','api_integrated')),
  provider TEXT,                    -- e.g. 'third_party_courier_x' | 'internal_logistics' — api_integrated only
  provider_reference TEXT,          -- courier's shipment ID, returned by assignDelivery() — api_integrated only
  external_tracking_url TEXT,       -- optional link to the courier's own tracking page — either mode
  external_courier_name TEXT,       -- display name shown alongside external_tracking_url
  tracking_token TEXT NOT NULL UNIQUE,  -- used in the public tracking URL — always ours, regardless of mode
  status TEXT NOT NULL DEFAULT 'awaiting_pickup',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Idempotency dedupe for inbound webhooks
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,             -- 'payment_gateway' | 'courier_api'
  external_event_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source, external_event_id)
);

-- Indexes
CREATE INDEX idx_orders_business_status ON orders(business_id, status);
CREATE INDEX idx_orders_reserved_until ON orders(reserved_until) WHERE status = 'pending';
CREATE INDEX idx_deliveries_tracking_token ON deliveries(tracking_token);
```

### Row-Level Security (example)

```sql
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_orders ON orders
  USING (business_id = current_setting('app.current_business_id')::uuid);
```

Repeat the same policy shape for every tenant-scoped table. `app.current_business_id` is set per-request by the `tenant-context.interceptor.ts` via `SET LOCAL` inside the request's transaction — so even a query that forgets a `WHERE business_id = ...` clause cannot return another tenant's rows.

---

## 4. Core Data Flow: The Order Lifecycle (Saga)

| From | Event | To | Compensation / Side-effect |
|---|---|---|---|
| (none) | Agent creates order | `pending` | Reserve stock: `stock_reserved += qty` (reject if `stock_on_hand - stock_reserved < qty`); set `reserved_until = now() + 30min` |
| `pending` | Payment webhook: succeeded | `paid` | None |
| `pending` | `reserved_until` passes, unpaid | `expired` | Release stock: `stock_reserved -= qty` |
| `pending` / `paid` | Agent or customer cancels | `cancelled` | Release stock; if `paid`, trigger refund |
| `paid` | Courier webhook: picked up | `shipped` | None |
| `shipped` | Courier webhook: delivered | `delivered` | None |

The expiry transition is handled by `order-expiry.scheduler.ts`, a NestJS `@Cron` job (every 1 minute at this scale) that finds `orders WHERE status = 'pending' AND reserved_until < now()` and runs the `pending → expired` transition with its compensation inside a single DB transaction.

---

## 5. Delivery Fulfillment Modes

Every delivery has exactly one `fulfillment_mode`, but both modes share the same `tracking_token` — the customer always gets one of our links, never a raw redirect baked into the order itself.

**`manual`** covers both "agent updates status by hand" and "agent just has the courier's own tracking link" — those are the same flow with an optional field, not two separate paths. `ManualDeliveryProvider.assignDelivery()` writes the delivery row and returns; it never makes an outbound call. The agent can move the order through `awaiting_pickup → picked_up → out_for_delivery → delivered` by hand via `PATCH /deliveries/:id/status`, or paste in `externalCourierName` / `externalTrackingUrl` the moment they have it. The public tracking page renders whichever pieces are populated: our internal status history, a "Track with [Courier]" link out, or both.

**`api_integrated`** covers any provider with a real API — `ThirdPartyCourierProvider` today, `InternalLogisticsProvider` once Phase 2 ships, behind the same interface. `assignDelivery()` fires synchronously the moment an agent selects that provider via `POST /orders/:id/deliveries` — a deliberate "Ship via X" action, not an automatic side-effect of payment confirmation, so there's still a human checkpoint to catch a bad address before a courier is dispatched. `external_tracking_url` can still be populated here too, since some courier APIs also expose their own customer-facing tracking page alongside the webhook feed — the two fields aren't mutually exclusive with the mode.

---

## 6. API Design

### Auth
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/login` | public | Returns `{ accessToken }` containing `{ sub, businessId, role }` |

### Businesses & Agents
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/businesses/me` | any | Business profile + tier |
| PATCH | `/businesses/me` | owner | Update profile/tier |
| GET | `/agents` | owner | List agents + per-agent conversion metrics |
| POST | `/agents` | owner | Invite/create an agent |
| PATCH / DELETE | `/agents/:id` | owner | Update or remove an agent |

### Inventory (optional)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET / POST | `/products` | any / owner | List or create products (empty catalog is valid) |
| PATCH | `/products/:id` | owner | Edit product |
| POST | `/products/:id/variants` | owner | Add a variant |
| PATCH | `/variants/:id` | owner/sales | Adjust `stock_on_hand` (restock) |

Tenants with **zero products** skip this module in day-to-day use; endpoints still return empty lists.

### Orders
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/orders` | sales/owner | Create order from chat; freeform and/or catalog lines; reserve stock **only** for variant lines; return payment link |
| GET | `/orders` | any | List/filter by status, agent, date range |
| GET | `/orders/:id` | any | Order detail + status history |
| PATCH | `/orders/:id/cancel` | sales/owner | Cancel + release/refund (release only reserved variants) |

### Payments
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/orders/:id/payment-link` | agent/owner | Generate/regenerate a card payment link |
| POST | `/orders/:id/manual-transfer` | agent | Submit proof-of-payment upload → `under_review` |
| POST | `/payments/:id/confirm` | owner/agent | Human confirmation → order moves to `paid` |

### Webhooks (signature-verified, no JWT)
| Method | Path | Purpose |
|---|---|---|
| POST | `/webhooks/payments` | Gateway sends `payment.succeeded` / `payment.failed` |
| POST | `/webhooks/courier` | Courier sends pickup/delivery status updates |

### Deliveries & Tracking
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/orders/:id/deliveries` | agent/owner | Select a fulfillment mode/provider and ship; for `api_integrated` this calls `assignDelivery()` immediately |
| PATCH | `/deliveries/:id/status` | agent/owner | Manual status update (manual mode only) |
| GET | `/tracking/:token` | **public** | Customer-facing delivery timeline |

### Example: `POST /orders`

```json
// Request — freeform line (no inventory) + optional catalog line
{
  "customerName": "Amaka Obi",
  "customerPhone": "+2348012345678",
  "customerEmail": "amaka@example.com",
  "deliveryAddress": "12 Allen Ave, Ikeja",
  "shippingFeeCents": 250000,
  "items": [
    {
      "description": "Custom bridal package — consult fee",
      "quantity": 1,
      "unitPriceCents": 5000000,
      "taxExempt": false
    },
    {
      "variantId": "8f1e...",
      "quantity": 2,
      "taxExempt": false
    }
  ]
}

// Freeform-only (business with no catalog products):
// "items": [{ "description": "Service — logo design", "quantity": 1, "unitPriceCents": 7500000, "taxExempt": true }]

// Response  201
{
  "id": "a3c9...",
  "status": "pending",
  "subtotalCents": 1500000,
  "taxCents": 112500,
  "shippingFeeCents": 250000,
  "totalCents": 1862500,
  "reservedUntil": "2026-06-17T13:00:00Z",
  "paymentLink": "https://pay.example.com/o/a3c9..."
}
// reservedUntil is null when no catalog variant lines need a stock hold
```

### Example: `POST /orders/:id/deliveries`

```json
// Request — manual mode, no external link yet
{ "fulfillmentMode": "manual" }

// Request — manual mode, courier tracking link already known
{
  "fulfillmentMode": "manual",
  "externalCourierName": "GIG Logistics",
  "externalTrackingUrl": "https://giglogistics.com/track/9F3K2"
}

// Request — api_integrated mode
{ "fulfillmentMode": "api_integrated", "provider": "third_party_courier_x" }

// Response  201 (api_integrated — assignDelivery() already called)
{
  "id": "d4e1...",
  "fulfillmentMode": "api_integrated",
  "provider": "third_party_courier_x",
  "providerReference": "TPX-88213",
  "status": "awaiting_pickup",
  "trackingToken": "trk_8a2f"
}
```

### Example: idempotent webhook handler (`webhooks.service.ts`)

```ts
async handlePaymentWebhook(event: PaymentWebhookDto) {
  const existing = await this.webhookEvents.findOneBy({
    source: 'payment_gateway',
    externalEventId: event.id,
  });
  if (existing?.processedAt) return; // already handled — no-op

  await this.dataSource.transaction(async (manager) => {
    await manager.upsert(
      WebhookEvent,
      { source: 'payment_gateway', externalEventId: event.id, payload: event },
      ['source', 'externalEventId'],
    );
    if (event.type === 'payment.succeeded') {
      await this.ordersService.markPaid(event.orderId, manager);
    }
    await manager.update(WebhookEvent, { externalEventId: event.id }, { processedAt: new Date() });
  });
}
```

### Example: `GET /tracking/:token`

```json
// Manual mode, with an external courier link populated
{
  "fulfillmentMode": "manual",
  "externalCourierName": "GIG Logistics",
  "externalTrackingUrl": "https://giglogistics.com/track/9F3K2",
  "orderStatus": "shipped",
  "timeline": [
    { "status": "pending", "at": "2026-06-17T12:31:00Z" },
    { "status": "paid", "at": "2026-06-17T12:40:00Z" },
    { "status": "shipped", "at": "2026-06-17T15:05:00Z" }
  ]
}
```

For `api_integrated` deliveries, the response has the same shape, minus `externalCourierName`/`externalTrackingUrl` unless the provider happens to expose its own page too — the `timeline` entries are populated by the courier webhook handler instead of an agent's manual `PATCH`.

---

## 7. Auth & Tenant Isolation

The JWT payload carries `{ sub: userId, businessId, role }`. On every request:

1. `jwt-auth.guard.ts` validates the token.
2. `tenant-scope.guard.ts` reads `businessId`/`role` and attaches them to the request context.
3. `tenant-context.interceptor.ts` opens a transaction and runs `SET LOCAL app.current_business_id = '<businessId>'` before the handler executes any query.

This gives two independent layers: the NestJS guard rejects obviously wrong tenant references at the application level, and Postgres RLS prevents leakage even if a query is missing a `WHERE` clause. `role` distinguishes what an `owner` can do (manage agents, billing, products) from what an `agent` can do (create orders, submit manual-transfer proof, confirm payments within their own orders).

---

## 8. Open Engineering Decisions

- **ORM**: TypeORM's Repository pattern fits the module-per-domain structure above most naturally and has first-class NestJS integration; Prisma offers stronger type safety and migration ergonomics if the team prefers that workflow. Either is a reasonable choice — pick one early since switching later is costly.
- **Scheduled vs. queued expiry**: a `@Cron` sweep (via `@nestjs/schedule`) is sufficient for Phase 1 order volume. If volume grows enough that the periodic sweep causes lock contention, move to a delayed job per order (BullMQ + Redis) instead of polling.
- **Payment gateway**: pick one PCI-DSS-compliant processor that supports both card checkout and webhook callbacks, so the "card" path in Payment Orchestration never touches raw card data directly.
- **Delivery dispatch trigger**: deliberately an explicit agent action (`POST /orders/:id/deliveries`) rather than automatic on payment confirmation, so an `api_integrated` courier is never dispatched without a human checkpoint on the order first.
