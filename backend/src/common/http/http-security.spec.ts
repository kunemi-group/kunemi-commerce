import { applyHttpSecurity } from './http-security';

describe('HTTP security middleware', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('sets production security headers and preserves a safe request ID', () => {
    process.env.NODE_ENV = 'production';
    const use = jest.fn();
    applyHttpSecurity({ use } as never);
    const middleware = use.mock.calls[2][0] as (req: unknown, res: unknown, next: () => void) => void;
    const headers: Record<string, string> = {};
    const req = { header: () => 'request-123' };
    const res = { setHeader: (name: string, value: string) => { headers[name] = value; } };
    const next = jest.fn();

    middleware(req, res, next);

    expect(headers['X-Request-ID']).toBe('request-123');
    expect(headers['Content-Security-Policy']).toContain("default-src 'none'");
    expect(headers['Strict-Transport-Security']).toContain('max-age=31536000');
    expect(next).toHaveBeenCalled();
  });

  it('replaces unsafe request IDs with a generated ID', () => {
    process.env.NODE_ENV = 'test';
    const use = jest.fn();
    applyHttpSecurity({ use } as never);
    const middleware = use.mock.calls[2][0] as (req: unknown, res: unknown, next: () => void) => void;
    const headers: Record<string, string> = {};
    const req = { header: () => 'bad id with spaces' };
    const res = { setHeader: (name: string, value: string) => { headers[name] = value; } };

    middleware(req, res, jest.fn());

    expect(headers['X-Request-ID']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
