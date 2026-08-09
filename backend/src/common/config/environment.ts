const INSECURE_SECRET_MARKERS = [
  'change-in-prod',
  'change-me',
  'dev-secret',
  'secret-key',
];

function requireProductionSecret(
  env: Record<string, unknown>,
  name: string,
  minimumLength = 32,
) {
  const value = String(env[name] ?? '').trim();
  const normalized = value.toLowerCase();
  if (
    value.length < minimumLength ||
    INSECURE_SECRET_MARKERS.some((marker) => normalized.includes(marker))
  ) {
    throw new Error(
      `${name} must be a non-default secret of at least ${minimumLength} characters`,
    );
  }
}

export function parseCorsOrigins(raw: unknown, nodeEnv = 'development'): string[] {
  const origins = String(raw ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnv !== 'production') return origins;
  if (!origins.length || origins.includes('*')) {
    throw new Error('CORS_ORIGIN must list explicit production origins');
  }

  for (const origin of origins) {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`CORS_ORIGIN contains an invalid origin: ${origin}`);
    }
    if (parsed.protocol !== 'https:' || parsed.pathname !== '/' || parsed.search || parsed.hash) {
      throw new Error('Production CORS origins must be explicit https origins');
    }
  }
  return origins;
}

export function validateEnvironment(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const env = { ...input };
  const nodeEnv = String(env.NODE_ENV ?? 'development');
  const databaseType = String(env.DATABASE_TYPE ?? 'postgres');

  if (!['development', 'test', 'production'].includes(nodeEnv)) {
    throw new Error('NODE_ENV must be development, test, or production');
  }
  if (!['postgres', 'sqlite', 'better-sqlite3'].includes(databaseType)) {
    throw new Error('DATABASE_TYPE must be postgres or sqlite');
  }

  env.NODE_ENV = nodeEnv;
  env.DATABASE_TYPE = databaseType;

  if (nodeEnv === 'production') {
    if (databaseType !== 'postgres') {
      throw new Error('Production requires PostgreSQL');
    }
    requireProductionSecret(env, 'JWT_SECRET', 32);
    requireProductionSecret(env, 'DATABASE_PASSWORD', 16);
    requireProductionSecret(env, 'PLATFORM_SECRET', 32);

    parseCorsOrigins(env.CORS_ORIGIN, nodeEnv);
    if (String(env.SEED_ON_BOOT ?? 'false') === 'true') {
      throw new Error('SEED_ON_BOOT must be disabled in production');
    }
  }

  return env;
}
