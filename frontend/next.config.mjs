import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // PDF generation runs in the browser (Download PDF). Do not also list
  // this package under serverExternalPackages — that conflicts with transpilePackages.
  transpilePackages: ["@react-pdf/renderer"],
  turbopack: {
    // Pin root to this app so parent lockfiles don't confuse Turbopack
    root: __dirname,
    resolveAlias: {
      // Ensure CSS @import "tailwindcss" resolves inside frontend/
      tailwindcss: path.join(__dirname, "node_modules/tailwindcss"),
      "tw-animate-css": path.join(__dirname, "node_modules/tw-animate-css"),
    },
  },
}

export default nextConfig
