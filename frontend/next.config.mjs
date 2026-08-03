import fs from "fs"
import path from "path"
import { createRequire } from "module"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

/**
 * Resolve a package directory to a real filesystem path.
 * pnpm uses junctions; Turbopack/webpack sometimes walk past them to the
 * monorepo root (or a parent package.json) and fail to find tailwindcss.
 */
function resolvePackageDir(name) {
  const candidates = []

  try {
    candidates.push(path.dirname(require.resolve(`${name}/package.json`)))
  } catch {
    /* no package.json export */
  }

  try {
    const resolved = require.resolve(name)
    // Walk up until package.json of this package
    let dir = path.dirname(resolved)
    for (let i = 0; i < 6; i++) {
      if (fs.existsSync(path.join(dir, "package.json"))) {
        candidates.push(dir)
        break
      }
      const parent = path.dirname(dir)
      if (parent === dir) break
      dir = parent
    }
  } catch {
    /* bare resolve failed */
  }

  const local = path.join(__dirname, "node_modules", name)
  if (fs.existsSync(local)) candidates.push(local)

  for (const c of candidates) {
    try {
      return fs.realpathSync(c)
    } catch {
      return c
    }
  }

  return local
}

const tailwindcssDir = resolvePackageDir("tailwindcss")
const twAnimateDir = resolvePackageDir("tw-animate-css")
const shadcnDir = resolvePackageDir("shadcn")

/** Absolute aliases used by both Turbopack and webpack */
const cssPackageAliases = {
  tailwindcss: tailwindcssDir,
  "tw-animate-css": twAnimateDir,
  shadcn: shadcnDir,
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Keep file tracing / monorepo detection inside frontend/, not repo root
  // or a parent user-level package.json (e.g. C:\Users\…\package.json).
  outputFileTracingRoot: __dirname,

  // PDF generation runs in the browser (Download PDF). Do not also list
  // this package under serverExternalPackages — that conflicts with transpilePackages.
  transpilePackages: ["@react-pdf/renderer"],

  turbopack: {
    // Critical on Windows + pnpm: stop Turbopack walking up to the monorepo root
    root: __dirname,
    resolveAlias: {
      ...cssPackageAliases,
      // CSS @import "tailwindcss" and deep entrypoints
      "tailwindcss/index.css": path.join(tailwindcssDir, "index.css"),
      "tw-animate-css/dist/tw-animate.css": path.join(
        twAnimateDir,
        "dist",
        "tw-animate.css",
      ),
    },
  },

  webpack: (config) => {
    config.resolve = config.resolve ?? {}
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      ...cssPackageAliases,
    }
    // Prefer this app's node_modules before walking parents
    config.resolve.modules = [
      path.join(__dirname, "node_modules"),
      ...(Array.isArray(config.resolve.modules)
        ? config.resolve.modules
        : ["node_modules"]),
    ]
    return config
  },
}

export default nextConfig
