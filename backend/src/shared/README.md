# Shared backend boundary

Shared modules are platform primitives used by both Workspace and ShopFlow:

- `auth/`
- `mail/`
- `storage/` — including uploads and private media handling
- `documents/`
- `chat/`

Cross-cutting infrastructure such as `common/` and `database/` remains at
`backend/src/` until a separate infrastructure boundary is needed.
