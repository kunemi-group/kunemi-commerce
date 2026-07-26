"use client"

import { RoleProvider } from "@/lib/role-context"
import { BrandingProvider } from "@/lib/branding-context"
import { AuthProvider } from "@/lib/auth-context"
import { AuthGate } from "@/components/auth/auth-gate"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RoleProvider>
        <BrandingProvider>
          <AuthGate>{children}</AuthGate>
        </BrandingProvider>
      </RoleProvider>
    </AuthProvider>
  )
}
