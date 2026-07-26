# API layer (Axios + TanStack Query)

```
api/
  client.ts          # axios instance + auth header interceptor
  keys.ts            # query key factory
  query-client.ts    # QueryClient defaults
  types.ts           # Nest response types
  format.ts          # money / ids helpers
  services/          # pure axios calls (no React)
  hooks/             # useQuery / useMutation wrappers
  index.ts           # public exports
```

## Usage

```tsx
import { useOrders, useCreateOrder, formatNgn } from "@/api"

function Orders() {
  const { data, isLoading, refetch } = useOrders(true)
  const create = useCreateOrder()
  // ...
}
```

## Tests

```bash
pnpm test
```

Uses **Vitest** + **React Testing Library** for hooks/helpers.
