# Workspace backend boundary

Workspace contains seller-facing operations:

- `businesses/` — seller business settings and onboarding
- `inventory/` — seller catalog and stock management
- `team/` — seller team and role management
- `orders/` — seller-created and seller-managed orders
- `payments/` — seller-owned payment and bank-transfer review flow
- `fulfillment/` — deliveries and tracking
- `storefront/` — **single-business public shop** + guest checkout → Workspace orders

The storefront is **not** ShopFlow. ShopFlow is the multi-seller marketplace
(later). Storefront checkout always creates seller-owned Workspace `Order`s.

Documents and chat remain shared because both surfaces use them.
