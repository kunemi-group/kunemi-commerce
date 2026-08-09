import { ServiceUnavailableException } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';

function executionContext(request: Record<string, unknown>) {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

describe('TenantContextInterceptor', () => {
  const config = { get: jest.fn() };
  const dataSource = { isInitialized: true, query: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string, fallback: string) =>
      key === 'DATABASE_TYPE' ? 'postgres' : fallback,
    );
    dataSource.query.mockResolvedValue([]);
  });

  it('sets and clears tenant context around the request', async () => {
    const interceptor = new TenantContextInterceptor(dataSource as never, config as never);
    const next = { handle: () => of('ok') };

    await expect(
      firstValueFrom(
        interceptor.intercept(
          executionContext({ user: { businessId: 'business-1', sub: 'user-1' }, headers: {} }),
          next,
        ),
      ),
    ).resolves.toBe('ok');

    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('set_config'), [
      'business-1',
    ]);
    expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('set_config'), ['user-1']);
    expect(dataSource.query.mock.calls[2][0]).toContain(
      "set_config('app.current_business_id', '', false)",
    );
    expect(dataSource.query.mock.calls[3][0]).toContain(
      "set_config('app.current_user_id', '', false)",
    );
  });

  it('fails closed when tenant context cannot be established', async () => {
    dataSource.query.mockRejectedValueOnce(new Error('database unavailable'));
    const interceptor = new TenantContextInterceptor(dataSource as never, config as never);
    const next = { handle: jest.fn(() => of('must not run')) };

    await expect(
      firstValueFrom(
        interceptor.intercept(
          executionContext({ user: { businessId: 'business-1', sub: 'user-1' }, headers: {} }),
          next,
        ),
      ),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(next.handle).not.toHaveBeenCalled();
  });

  it('does not touch the database for SQLite', async () => {
    config.get.mockImplementation((key: string, fallback: string) =>
      key === 'DATABASE_TYPE' ? 'sqlite' : fallback,
    );
    const interceptor = new TenantContextInterceptor(dataSource as never, config as never);

    await expect(
      firstValueFrom(
        interceptor.intercept(
          executionContext({ user: { businessId: 'business-1', sub: 'user-1' }, headers: {} }),
          { handle: () => of('ok') },
        ),
      ),
    ).resolves.toBe('ok');
    expect(dataSource.query).not.toHaveBeenCalled();
  });
});
