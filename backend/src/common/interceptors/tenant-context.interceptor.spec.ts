import { ServiceUnavailableException } from '@nestjs/common';
import { firstValueFrom, of } from 'rxjs';
import { TenantContextInterceptor } from './tenant-context.interceptor';

function executionContext(request: Record<string, unknown>) {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => request }),
  } as never;
}

function makeConfig(databaseType = 'postgres') {
  return {
    get: jest.fn((key: string, fallback: string) => {
      if (key === 'DATABASE_TYPE') return databaseType;
      return fallback;
    }),
  };
}

function makeRunner() {
  return {
    manager: {},
    connect: jest.fn().mockResolvedValue(undefined),
    startTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn().mockResolvedValue([]),
    commitTransaction: jest.fn().mockResolvedValue(undefined),
    rollbackTransaction: jest.fn().mockResolvedValue(undefined),
    release: jest.fn().mockResolvedValue(undefined),
  };
}

describe('TenantContextInterceptor', () => {
  it('runs tenant work on one transaction-local query runner and releases it', async () => {
    const runner = makeRunner();
    const dataSource = {
      isInitialized: true,
      createQueryRunner: jest.fn().mockReturnValue(runner),
      transaction: jest.fn(),
    };
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const tenantContext = {
      current: undefined,
      run: jest.fn((_context, callback) => callback()),
    };
    const interceptor = new TenantContextInterceptor(
      dataSource as never,
      makeConfig() as never,
      reflector as never,
      tenantContext as never,
    );

    await expect(
      firstValueFrom(
        interceptor.intercept(
          executionContext({
            user: { businessId: 'business-1', sub: 'user-1' },
            headers: {},
          }),
          { handle: () => of('ok') },
        ),
      ),
    ).resolves.toBe('ok');

    expect(runner.startTransaction).toHaveBeenCalled();
    expect(runner.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("set_config('app.current_business_id', $1, true)"),
      ['business-1'],
    );
    expect(runner.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("set_config('app.current_user_id', $1, true)"),
      ['user-1'],
    );
    expect(runner.commitTransaction).toHaveBeenCalled();
    expect(runner.rollbackTransaction).not.toHaveBeenCalled();
    expect(runner.release).toHaveBeenCalled();
  });

  it('fails closed when the transaction-local context cannot be established', async () => {
    const runner = makeRunner();
    runner.query.mockRejectedValueOnce(new Error('database unavailable'));
    const dataSource = {
      isInitialized: true,
      createQueryRunner: jest.fn().mockReturnValue(runner),
      transaction: jest.fn(),
    };
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
    const tenantContext = { current: undefined, run: jest.fn() };
    const interceptor = new TenantContextInterceptor(
      dataSource as never,
      makeConfig() as never,
      reflector as never,
      tenantContext as never,
    );
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
    expect(runner.release).toHaveBeenCalled();
  });

  it('skips database transactions for SQLite', async () => {
    const dataSource = { isInitialized: true, createQueryRunner: jest.fn() };
    const interceptor = new TenantContextInterceptor(
      dataSource as never,
      makeConfig('sqlite') as never,
      { getAllAndOverride: jest.fn() } as never,
      { current: undefined, run: jest.fn() } as never,
    );

    await expect(
      firstValueFrom(
        interceptor.intercept(
          executionContext({ user: { businessId: 'business-1', sub: 'user-1' }, headers: {} }),
          { handle: () => of('ok') },
        ),
      ),
    ).resolves.toBe('ok');
    expect(dataSource.createQueryRunner).not.toHaveBeenCalled();
  });
});
