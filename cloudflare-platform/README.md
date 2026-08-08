# Cloudflare Edge Multi-Tenant Platform (`kunemi-edge-coordinator`)

This package provides a **Cloudflare Edge Platform Router & Dispatcher** for **Kunemi Commerce**.

## Architecture Overview

```
Buyer Request (e.g. lagosthreads.shopflow.store or shop.lagosthreads.co)
     │
     ▼
[Cloudflare Edge Worker (kunemi-edge-coordinator)]
     │
     ├── 1. KV Tenant Lookup (`TENANT_LOOKUP` namespace)
     │      Resolves domain/subdomain ──► tenantId ("bus_xxx")
     │
     ├── 2. Injects Headers:
     │      - X-Tenant-ID: "bus_xxx"
     │      - X-Platform-Secret: "kunemi-edge-secret..."
     │
     └── 3. Proxies Request:
            - /api/* ──► NestJS Backend API (3001)
            - Workspace ──► Next.js Workspace UI (3000)
            - Storefront ──► ShopFlow Buyer UI (3000)
```

## Setup & Configuration

### Prerequisites
- Node.js 18+
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)

### Environment Configuration (`wrangler.jsonc`)
Set the following environment variables in `wrangler.jsonc` or Cloudflare Worker Settings:
- `BACKEND_API_URL`: NestJS backend API endpoint (default: `http://localhost:3001`).
- `WORKSPACE_UI_URL`: Next.js Workspace frontend (default: `http://localhost:3000`).
- `SHOPFLOW_UI_URL`: Next.js ShopFlow buyer frontend (default: `http://localhost:3000`).
- `PLATFORM_SECRET`: Shared secret header key to validate edge requests at the NestJS backend.
- `ADMIN_API_KEY`: Key required for `/api/admin/tenants` REST management requests.

## Development & Deployment

```bash
# Install dependencies
pnpm install # or npm install

# Check TypeScript build
npm run check

# Launch local edge simulation
npm run dev

# Deploy to Cloudflare Workers
npm run deploy
```

## Admin REST API

Register or update tenant mappings at the edge:

### Register Tenant
```http
POST /api/admin/tenants
Authorization: Bearer <ADMIN_API_KEY>
Content-Type: application/json

{
  "tenantId": "bus_123456",
  "slug": "lagosthreads",
  "name": "Lagos Threads",
  "customDomain": "shop.lagosthreads.co"
}
```

### Lookup Tenant
```http
GET /api/admin/tenants/bus_123456
Authorization: Bearer <ADMIN_API_KEY>
```

### Delete Tenant Mapping
```http
DELETE /api/admin/tenants/bus_123456
Authorization: Bearer <ADMIN_API_KEY>
```
