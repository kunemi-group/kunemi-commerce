# ShopFlow backend boundary

ShopFlow is the buyer-facing marketplace domain. Its future modules belong
under this directory:

- `catalog/` — public storefront reads
- `cart/` — buyer cart state
- `checkout/` — multi-seller checkout groups
- `orders/` — seller-order splits belonging to a checkout group
- `escrow/` — centralized payment, release, refund, and reconciliation
- `shipping/` — one platform-level shipping charge per checkout

ShopFlow seller-order records must not reuse Workspace order semantics.
