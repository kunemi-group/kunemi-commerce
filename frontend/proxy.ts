import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_PREFIXES = [
  "/workspace",
  "/insights",
  "/inventory",
  "/orders",
  "/deliveries",
  "/quotations",
  "/invoices",
  "/settings",
  "/team",
  "/admin",
]

/** Next.js Proxy for Server-Side Cookie-Based Route Protection */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("kunemi_workspace_token")?.value

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("returnUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/workspace",
    "/workspace/:path*",
    "/insights",
    "/insights/:path*",
    "/inventory",
    "/inventory/:path*",
    "/orders",
    "/orders/:path*",
    "/deliveries",
    "/deliveries/:path*",
    "/quotations",
    "/quotations/:path*",
    "/invoices",
    "/invoices/:path*",
    "/settings",
    "/settings/:path*",
    "/team",
    "/team/:path*",
    "/admin",
    "/admin/:path*",
  ],
}
