"use client"

import { useState } from "react"
import { QueryClientProvider } from "@tanstack/react-query"
import { RoleProvider } from "@/lib/role-context"
import { BrandingProvider } from "@/lib/branding-context"
import { AuthProvider } from "@/lib/auth-context"
import { AuthGate } from "@/components/auth/auth-gate"
import { getQueryClient } from "@/api/query-client"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => getQueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RoleProvider>
          <BrandingProvider>
            <AuthGate>{children}</AuthGate>
          </BrandingProvider>
        </RoleProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
