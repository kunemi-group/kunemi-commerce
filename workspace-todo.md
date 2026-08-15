# Kunemi Workspace — Product todo

**Last updated:** 2026-08-15  
**Active branch:** `feat/workspace-phase-a-simplify`

**Scope:** Seller/business app only (`Workspace`). Not ShopFlow marketplace.  
**Companion:** monorepo/security work stays in `todo.md`.

**North star (SMB):**  
Customer asks (chat or store) → take order → get paid → ship → know what you made.

**Positioning:** Chat-to-cash + bank transfer + multi-currency + optional single-business storefront.  
Not a second Shopify clone; not multi-seller marketplace yet.

---

## Principles

1. One home. No duplicate “start here” pages.
2. Jobs over modules — optimize the daily money loop first.
3. Two roles until customers demand more.
4. Business store (single seller) before ShopFlow marketplace.
5. Analytics that answer “am I okay this week?” — not BI theater.
6. Hide unfinished product (AI agents, deep RBAC) from nav.

---

## Phase A — Simplify the app

Goal: less confusion, one clear place to work.

### A1 — Kill `/workspace` (sales floor page)

- [x] Stop treating `/workspace` as a product surface
- [x] Merge useful bits into **Home** (`/`):
  - [x] Attention queue (expiring holds, payment review)
  - [x] Pending / needs-action orders
  - [x] Primary **New order** CTA
- [x] Chat → order lives on **Inbox** only (no mock “open chats” panel)
- [x] Remove sales-role redirect to `/workspace`
- [x] Remove nav item “Workspace”
- [x] Redirect `/workspace` → `/` (or `/inbox`) for bookmarks
- [x] Delete or archive dead sales-floor UI once Home covers it

### A2 — Navigation cleanup

Target IA:

| Nav        | Purpose                                           |
| ---------- | ------------------------------------------------- |
| Home       | Today’s work + light stats                        |
| Inbox      | Chat                                              |
| Orders     | Create, status, holds, detail                     |
| Products   | Catalog + stock (rename Inventory)                |
| Store      | Public shop link, publish, theme                  |
| Money      | Payments (+ invoices as tab later)                |
| Deliveries | Keep until volume low enough to fold under Orders |
| Team       | Invite / remove people                            |
| Settings   | Bank, tax, brand, currency, domain                |

- [x] Rename Inventory → **Products** (UI label; routes can follow later)
- [x] Rename Sales Team → **Team**
- [x] Hide **AI Agents** from nav (keep route unlisted or behind flag)
- [x] Keep Quotations/Invoices under Commerce without fake badges (Store/Insights later)
- [x] Remove fake/static nav badges
- [x] One Home for all staff (no owner-only dashboard split based on demo role)

### A3 — Roles: Owner + Team only

Product surface (invite UI + copy):

| Role      | Access                                                                   |
| --------- | ------------------------------------------------------------------------ |
| **Owner** | Full: settings, bank, team, delete, money controls                       |
| **Team**  | Day-to-day: orders, products, inbox, payments review, deliveries, quotes |

- [x] Product copy and invite UX: only Owner / Team
- [x] Map legacy backend roles if needed (`manager`/`sales`/`ops` → Team; keep `owner`)
- [x] Stop frontend role switcher demos that imply full RBAC product
- [x] Backend: enforce Owner-only for settings / bank / team manage / destructive actions
- [x] Backend: Team can run commerce ops; no separate manager/ops pages
- [x] Document: do **not** reintroduce manager/ops until a real page needs them
- [x] Password change / forced reset after invite (+ Workspace forgot/reset password)

### A4 — Home = action + light pulse

- [x] Attention: payment proofs, expiring holds, failed/expired payments
- [x] Today / 7d money snapshot (collected, outstanding, order count) — via Home KPIs
- [x] Recent orders
- [x] Low stock
- [x] Onboarding checklist only while incomplete
- [x] Empty states that push New order / Add product (Share store → Phase C)

**Done when:** a new seller lands on one Home and knows what to do next without reading docs.

---

## Phase B — Insights (analytics v1)

Goal: small-business honest reporting. No vanity leaderboards without attribution.

### B1 — Insights page or Home section

Period: **Today / 7d / 30d / custom**

- [x] **Money:** gross sales, collected, outstanding (awaiting + under review)
- [x] **Orders funnel:** created → paid → shipped → delivered / cancelled / expired
- [x] **Top products:** revenue + units (variants)
- [x] **Payment health:** claims, verified, rejected, median time-to-verify (if data allows)
- [x] **Stock risk:** low stock list (link to Products)
- [x] Keep existing 14-day revenue chart; align it to selected period (`/insights` + Home chart days prop)
- [x] Currency-aware formatting via business currency
- [x] Nav: **Insights** under Overview (`/insights`)

### B2 — Explicitly later (do not build in v1)

- [ ] Channel attribution (WhatsApp / store / IG) — after store + chat attribution exist
- [ ] Per-teammate conversion boards without chat→order links
- [ ] AI agent performance
- [ ] Fancy cohort / LTV charts

**Done when:** owner can answer “what sold, what I’m owed, what’s stuck” in under a minute.

---

## Phase C — Business storefront (Shopify-like, single seller)

Goal: Instagram bio → shop → same Workspace orders sellers already manage.

**Not in scope here:** multi-seller cart, platform escrow, ShopFlow marketplace (see `todo.md` P2).

### C1 — Public store surface

- [ ] Public store routes (e.g. `/s/[slug]` or subdomain via edge)
- [ ] Store home: brand, featured/published products
- [ ] Product detail page
- [ ] Cart (single business only)
- [ ] Mobile-first layout; brand color + logo from business settings

### C2 — Checkout → existing Workspace order

- [ ] Checkout creates **Workspace `Order`** (not a new order type)
- [ ] Server validates catalog prices, stock, tax/shipping rules
- [ ] Reuse bank-transfer pay token + `/pay/[token]`
- [ ] Stock reserve on checkout where variants exist
- [ ] Customer contact + delivery address capture
- [ ] Order visible immediately in Workspace Orders / Home

### C3 — Seller controls in Workspace

- [ ] **Store** settings: enable/disable, slug, share link, WhatsApp button
- [ ] Product **Published to store** toggle (already partially present — finish UX)
- [ ] “View store” / “Copy product link” from Products
- [ ] Basic theme: logo, color, short about blurb
- [ ] Optional: default shipping for store checkouts

### C4 — Quality bar

- [ ] Empty store state with checklist (add product → publish → share link)
- [ ] Idempotent checkout (no double orders on refresh)
- [ ] Guest checkout first (buyer accounts optional later)
- [ ] Tests: publish filter, stock hold, pay claim path from store order

**Done when:** seller shares one link, buyer pays by transfer, seller fulfills in the same Orders UI.

---

## Phase D — SMB depth (after A–C)

Order by customer pain; don’t start until Home + store path work.

### D1 — Customers

- [ ] Customer list from orders (phone/email key)
- [ ] Customer detail: order history, addresses, notes
- [ ] Start order / quote from customer

### D2 — Notifications

- [ ] In-app (and later email/WhatsApp): new chat, payment claim, expiring hold, low stock, new store order
- [ ] Notification center entry point on Home

### D3 — Documents & money polish

- [ ] Quote / invoice → order conversion
- [ ] Hosted public document link (beyond clipboard/WhatsApp)
- [ ] Receipt / simple PDF after paid
- [ ] Money page: Payments + Invoices tabs; outstanding collections view

### D4 — Mobile & ops

- [ ] Touch-friendly order create + payment review on small screens
- [ ] Faster proof review path
- [ ] Deliveries fold under Orders if nav still heavy

### D5 — Payments expansion (only after transfer is excellent)

- [ ] Stripe / Paystack as secondary methods behind provider interface
- [ ] Keep bank transfer as default for markets that need it

---

## Phase E — Explicitly deferred

Do not schedule until A–C are solid:

- [ ] ShopFlow marketplace (multi-seller cart, escrow, platform shipping)
- [ ] AI Agents product (optional later: assist **inside Inbox**, not separate nav)
- [ ] Manager / ops / accountant roles as first-class product
- [ ] Courier carrier APIs
- [ ] WA/IG official messaging integrations
- [ ] Complex RBAC matrix pages

---

## Suggested build order

1. **A1–A4** — Kill Workspace page, simplify nav + roles, fix Home
2. **B1** — Insights v1 (can start in parallel with A if needed)
3. **C1–C4** — Single-business storefront → existing orders
4. **D1–D3** — Customers, notifications, money/docs polish
5. **E** only when A–C are boringly reliable

---

## Definition of “Workspace is ready for real SMBs”

- [x] One Home; no `/workspace` product page
- [x] Owner + Team only in product
- [x] Seller can run: product → order → pay → ship → track without mocks
- [x] Insights answer money + funnel + top products for a period
- [ ] Public store link creates the same orders sellers already manage
- [x] No AI Agents / marketplace noise in primary nav

---

## Notes / decisions log

| Date       | Decision                                                    |
| ---------- | ----------------------------------------------------------- |
| 2026-08-09 | Separate this file from monorepo `todo.md`                  |
| 2026-08-09 | Remove `/workspace` sales floor; Home + Inbox only          |
| 2026-08-09 | Roles product surface: Owner + Team                         |
| 2026-08-09 | Storefront = single-business checkout into Workspace orders |
| 2026-08-09 | ShopFlow multi-seller stays out of this list                |
| 2026-08-15 | Phase A on branch `feat/workspace-phase-a-simplify`         |
| 2026-08-15 | Phase B1 Insights page + period analytics                   |
| 2026-08-15 | A3 password force-change after invite + Owner/Team reset    |
| 2026-08-15 | DB migrate legacy manager/sales/ops → team role             |

Update this file as Workspace product work lands. Keep security, CI, and ShopFlow marketplace in `todo.md`.
