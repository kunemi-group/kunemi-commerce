# Contributing

## Quality gate

Pull requests targeting `staging` or `main` run the GitHub Actions workflow in
`.github/workflows/ci.yml`. The gate checks:

- changed-file Prettier formatting;
- backend lint, typecheck, unit tests, e2e tests, and build;
- frontend lint, typecheck, Vitest, and production build.

The workflow does not require a staging or production environment. Backend e2e
tests use the existing isolated SQLite test harness. PostgreSQL migration/RLS
checks should be added as a separate job when the ephemeral database bootstrap
is ready.

## Local checks

```bash
# Root tooling
pnpm install --frozen-lockfile

# Backend
cd backend
pnpm install --frozen-lockfile
pnpm run lint:check
pnpm run typecheck
pnpm test --runInBand
pnpm run test:e2e --runInBand
pnpm run build

# Frontend
cd frontend
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

The repository-level Husky hook runs lint-staged and formats staged supported
files before commit. CI remains the authoritative full-project gate.

## Approved dependency builds

pnpm build policy lives in each app's `pnpm-workspace.yaml`. It permits only
the native scripts required by each app: `bcrypt`, `better-sqlite3`, and
`unrs-resolver` for the backend, and `unrs-resolver` for the frontend.
`@scarf/scarf`, `msw`, and `sharp` are explicitly denied because their install
scripts are not required by the current applications. Keep this policy narrow
and review any new package before approving its build script.
