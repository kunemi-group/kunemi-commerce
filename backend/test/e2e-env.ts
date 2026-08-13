process.env.NODE_ENV = 'test';
process.env.DATABASE_TYPE = 'sqlite';
process.env.SQLITE_PATH = 'kunemi-workspace.e2e.sqlite';
process.env.SEED_ON_BOOT = 'true';
process.env.ALLOW_SQLITE_SYNC = 'true';
process.env.JWT_SECRET = 'e2e-secret';
process.env.CORS_ORIGIN = 'http://localhost:3000';
