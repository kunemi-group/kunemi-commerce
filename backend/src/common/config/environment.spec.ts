import { parseCorsOrigins, validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  it('rejects default-looking production secrets', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_TYPE: 'postgres',
        DATABASE_PASSWORD: 'a-secure-database-password',
        JWT_SECRET: 'dev-secret-change-in-prod',
        PLATFORM_SECRET: 'p'.repeat(32),
        CORS_ORIGIN: 'https://workspace.example.com',
        SEED_ON_BOOT: 'false',
      }),
    ).toThrow('JWT_SECRET');
  });

  it('accepts explicit production configuration', () => {
    expect(
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_TYPE: 'postgres',
        DATABASE_PASSWORD: 'd'.repeat(24),
        JWT_SECRET: 'j'.repeat(48),
        PLATFORM_SECRET: 'p'.repeat(48),
        CORS_ORIGIN: 'https://workspace.example.com',
        SEED_ON_BOOT: 'false',
      }),
    ).toMatchObject({ NODE_ENV: 'production', DATABASE_TYPE: 'postgres' });
  });

  it('rejects production demo seeding', () => {
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        DATABASE_TYPE: 'postgres',
        DATABASE_PASSWORD: 'd'.repeat(24),
        JWT_SECRET: 'j'.repeat(48),
        PLATFORM_SECRET: 'p'.repeat(48),
        CORS_ORIGIN: 'https://workspace.example.com',
        SEED_ON_BOOT: 'true',
      }),
    ).toThrow('SEED_ON_BOOT');
  });

  it('rejects wildcard, malformed, and non-HTTPS production origins', () => {
    expect(() => parseCorsOrigins('*', 'production')).toThrow('explicit');
    expect(() => parseCorsOrigins('not-an-origin', 'production')).toThrow('invalid');
    expect(() => parseCorsOrigins('http://workspace.example.com', 'production')).toThrow('https');
  });

  it('accepts multiple explicit HTTPS origins', () => {
    expect(
      parseCorsOrigins(
        'https://workspace.example.com,https://shop.example.com',
        'production',
      ),
    ).toEqual(['https://workspace.example.com', 'https://shop.example.com']);
  });
});
