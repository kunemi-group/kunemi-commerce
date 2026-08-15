import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Store · Kunemi Workspace",
  description: "Shop this business on Kunemi Workspace",
}

/** Public single-business storefront (Workspace) — no dashboard shell. */
export default function PublicStoreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-background text-foreground">{children}</div>
  )
}
