# Workspace backend boundary

Workspace contains seller-facing operations:

- `businesses/` — seller business settings and onboarding
- `inventory/` — seller catalog and stock management
- `team/` — seller team and role management
- `orders/` — seller-created and seller-managed orders
- `payments/` — seller-owned payment and bank-transfer review flow
- `fulfillment/` — deliveries and tracking

Additional seller operations such as analytics may move here as the boundary
is extended. Documents and chat remain shared because both surfaces use them.
