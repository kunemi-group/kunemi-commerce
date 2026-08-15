# ShopFlow backend boundary

ShopFlow is the **buyer marketplace** domain (future). It is separate from
the single-business storefront that businesses run inside **Kunemi Workspace**.

## Workspace storefront (not here)

Single-seller public shop + guest checkout lives under:

- `backend/src/workspace/storefront/`
- Public routes: `GET/POST /api/store/:slug…`
- Checkout creates **Workspace seller `Order`** records (bank transfer pay link).

Do not put Workspace storefront checkout in this folder.

## ShopFlow (later)

Future modules under this directory:

- `catalog/` — multi-seller discovery (when marketplace ships)
- `cart/` — buyer cart across sellers
- `checkout/` — multi-seller checkout groups
- `orders/` — seller-order splits belonging to a checkout group
- `escrow/` — platform payment, release, refund
- `shipping/` — one platform-level shipping charge per checkout

ShopFlow seller-order records must **not** reuse Workspace order semantics.
