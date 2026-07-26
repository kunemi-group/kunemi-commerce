/**
 * Date/time column type that works for both Postgres and better-sqlite3.
 * Call after dotenv is loaded (see main.ts / app.module).
 */
export function dateTimeType(): 'timestamp' | 'datetime' {
  const t = (process.env.DATABASE_TYPE || 'postgres').toLowerCase();
  return t === 'sqlite' || t === 'better-sqlite3' ? 'datetime' : 'timestamp';
}
