/** Central TanStack Query key factory */
export const queryKeys = {
  health: ["health"] as const,
  me: ["auth", "me"] as const,
  business: ["business", "me"] as const,
  orders: {
    all: ["orders"] as const,
    list: () => [...queryKeys.orders.all, "list"] as const,
    detail: (id: string) => [...queryKeys.orders.all, "detail", id] as const,
  },
  products: {
    all: ["products"] as const,
    list: () => [...queryKeys.products.all, "list"] as const,
  },
  payments: {
    all: ["payments"] as const,
    list: () => [...queryKeys.payments.all, "list"] as const,
    detail: (id: string) => [...queryKeys.payments.all, "detail", id] as const,
  },
  deliveries: {
    all: ["deliveries"] as const,
    list: () => [...queryKeys.deliveries.all, "list"] as const,
    detail: (id: string) => [...queryKeys.deliveries.all, "detail", id] as const,
  },
  team: {
    all: ["team"] as const,
    list: () => [...queryKeys.team.all, "list"] as const,
  },
  pay: {
    public: (token: string) => ["pay", "public", token] as const,
  },
  tracking: {
    public: (token: string) => ["tracking", "public", token] as const,
  },
}
